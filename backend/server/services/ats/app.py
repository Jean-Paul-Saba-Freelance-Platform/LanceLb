import os
import io
import joblib
import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from scorer import compute_ats_score

# Added imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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


# ── Job Matching Endpoint ─────────────────────────────────────
@app.route("/match-jobs", methods=["POST"])
def match_jobs():
    try:
        data = request.get_json()
        if not data or "freelancer" not in data:
            return jsonify({ "error": "Missing freelancer profile in request body." }), 400

        freelancer = data["freelancer"]
        jobs = data.get("jobs", [])

        if not jobs:
            return jsonify({ "success": True, "matches": [] })

        # Build freelancer profile string
        freelancer_skills = " ".join(freelancer.get("skills", []))
        freelancer_str = " ".join([
            freelancer.get("title", ""),
            freelancer.get("bio", ""),
            freelancer_skills,
            freelancer.get("experienceLevel", "")
        ]).strip()

        # Build job strings
        job_strings = []
        for job in jobs:
            job_skills = " ".join(job.get("requiredSkills", []))
            job_str = " ".join([
                job.get("title", ""),
                job.get("description", ""),
                job_skills,
                job.get("experienceLevel", "")
            ]).strip()
            job_strings.append(job_str)

        # TF-IDF vectorization
        all_strings = [freelancer_str] + job_strings
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(all_strings)

        # Cosine similarity between freelancer (index 0) and each job
        freelancer_vec = tfidf_matrix[0:1]
        job_vecs = tfidf_matrix[1:]
        similarities = cosine_similarity(freelancer_vec, job_vecs)[0]

        # Build results with matchScore
        matches = []
        for i, job in enumerate(jobs):
            score = int(round(similarities[i] * 100))
            # Experience level bonus (+5 if match, capped at 100)
            if job.get("experienceLevel") == freelancer.get("experienceLevel"):
                score = min(score + 5, 100)
            matches.append({ **job, "matchScore": score })

        # Sort by matchScore descending
        matches.sort(key=lambda x: x["matchScore"], reverse=True)

        return jsonify({ "success": True, "matches": matches })
    except Exception as e:
        print(f"Match jobs error: {e}")
        return jsonify({ "error": str(e) }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
    
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