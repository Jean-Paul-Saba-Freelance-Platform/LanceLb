import os
import io
import base64
import joblib
import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scorer import compute_ats_score

load_dotenv()
app = Flask(__name__)
CORS(app)

# Load ML model artifacts once at startup
print("Loading model artifacts...")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
try:
    best_model = joblib.load(os.path.join(MODEL_DIR, "best_ats_model.pkl"))
    tfidf      = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
    scaler     = joblib.load(os.path.join(MODEL_DIR, "ats_scaler.pkl"))
    le         = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
    print("All artifacts loaded successfully.")
except Exception as e:
    print(f"FAILED to load artifacts: {e}")
    raise

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "ATS service is running."})

@app.route("/evaluate", methods=["POST"])
def evaluate():
    resume_text = ""
    try:
        if request.files and "file" in request.files:
            pdf_file = request.files["file"]
            if not pdf_file.filename.lower().endswith(".pdf"):
                return jsonify({"error": "Only PDF files are supported."}), 400
            pdf_bytes = pdf_file.read()
            if len(pdf_bytes) > 5 * 1024 * 1024:
                return jsonify({"error": "File too large. Max size is 5MB."}), 400
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                resume_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        elif request.is_json:
            data = request.get_json()
            if "resume_b64" in data:
                pdf_bytes = base64.b64decode(data["resume_b64"])
                with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                    resume_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            elif "resume_text" in data:
                resume_text = data["resume_text"]
            else:
                return jsonify({"error": "No file or text provided."}), 400
        else:
            return jsonify({"error": "No file or text provided."}), 400

        resume_text = resume_text.strip()
        if len(resume_text) < 50:
            return jsonify({"error": "Could not extract enough text from the PDF. Make sure it is not a scanned image-only PDF."}), 422

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
        return jsonify({"error": str(e)}), 500

@app.route("/match-jobs", methods=["POST"])
def match_jobs():
    try:
        data = request.get_json()
        if not data or "freelancer" not in data:
            return jsonify({"error": "Missing freelancer profile in request body."}), 400

        freelancer = data["freelancer"]
        jobs       = data.get("jobs", [])

        if not jobs:
            return jsonify({"success": True, "matches": []})

        freelancer_str = " ".join([
            freelancer.get("title", ""),
            freelancer.get("bio", ""),
            " ".join(freelancer.get("skills", [])),
            freelancer.get("experienceLevel", ""),
        ]).strip()

        job_strings = []
        for job in jobs:
            job_str = " ".join([
                job.get("title", ""),
                job.get("description", ""),
                " ".join(job.get("requiredSkills", [])),
                job.get("experienceLevel", ""),
            ]).strip()
            job_strings.append(job_str)

        vectorizer   = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([freelancer_str] + job_strings)

        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

        matches = []
        for i, job in enumerate(jobs):
            score = int(round(similarities[i] * 100))
            if job.get("experienceLevel") == freelancer.get("experienceLevel"):
                score = min(score + 5, 100)
            matches.append({**job, "matchScore": score})

        matches.sort(key=lambda x: x["matchScore"], reverse=True)
        return jsonify({"success": True, "matches": matches})

    except Exception as e:
        print(f"Match jobs error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
