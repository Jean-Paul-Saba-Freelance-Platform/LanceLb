import os
import io
import joblib
import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from scorer import compute_ats_score

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Load All Model Artifacts Once at Startup ──────────────────
print("Loading model artifacts...")

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "model")

try:
    best_model = joblib.load(os.path.join(MODEL_DIR, "best_ats_model.pkl"))
    tfidf      = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
    scaler     = joblib.load(os.path.join(MODEL_DIR, "ats_scaler.pkl"))
    le         = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
    print("All artifacts loaded successfully.")
except Exception as e:
    print(f"FAILED to load artifacts: {e}")
    raise

# ── Health Check ──────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({ "status": "ok", "message": "ATS service is running." })

# ── Evaluate Endpoint ─────────────────────────────────────────
@app.route("/evaluate", methods=["POST"])
def evaluate():
    resume_text = ""

    try:
        # ── Handle PDF Upload ─────────────────────────────────
        if "file" in request.files:
            pdf_file = request.files["file"]

            if not pdf_file.filename.lower().endswith(".pdf"):
                return jsonify({ "error": "Only PDF files are supported." }), 400

            pdf_bytes = pdf_file.read()

            if len(pdf_bytes) > 5 * 1024 * 1024:
                return jsonify({ "error": "File too large. Max size is 5MB." }), 400

            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                resume_text = "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                )

        # ── Handle Raw Text Fallback ──────────────────────────
        elif request.json and "resume_text" in request.json:
            resume_text = request.json["resume_text"]

        else:
            return jsonify({ "error": "No file or text provided." }), 400

        # ── Validate Extracted Text ───────────────────────────
        resume_text = resume_text.strip()
        if len(resume_text) < 50:
            return jsonify({
                "error": "Could not extract enough text from the PDF. "
                         "Make sure it is not a scanned image-only PDF."
            }), 422

        # ── Score ─────────────────────────────────────────────
        result = compute_ats_score(
            resume_text,
            model  = best_model,
            tfidf  = tfidf,
            scaler = scaler,
            le     = le,
        )

        return jsonify(result), 200

    except Exception as e:
        print(f"Evaluation error: {e}")
        return jsonify({ "error": str(e) }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)