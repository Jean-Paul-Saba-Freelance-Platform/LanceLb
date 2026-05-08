import os
import io
import base64
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

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "ATS service is running."})

@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        resume_text = ""

        if request.files and "file" in request.files:
            pdf_file = request.files["file"]
            if not pdf_file.filename.lower().endswith(".pdf"):
                return jsonify({"error": "Only PDF files are supported."}), 400
            pdf_bytes = pdf_file.read()
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                resume_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

        elif request.is_json:
            data = request.get_json()
            if "file_base64" in data:
                pdf_bytes = base64.b64decode(data["file_base64"])
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
            return jsonify({"error": "Could not extract enough text from the PDF."}), 422

        result = compute_ats_score(resume_text)
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
        jobs = data.get("jobs", [])

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

        vectorizer = TfidfVectorizer(stop_words="english")
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

@app.route("/fit-score", methods=["POST"])
def fit_score():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body."}), 400

        cv_text = data.get("cv_text", "").strip()
        job_description = data.get("job_description", "").strip()

        if not cv_text or not job_description:
            return jsonify({"error": "Both cv_text and job_description are required."}), 400

        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([cv_text, job_description])
        score = int(round(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0][0] * 100))

        return jsonify({"success": True, "fitScore": score}), 200

    except Exception as e:
        print(f"Fit score error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)