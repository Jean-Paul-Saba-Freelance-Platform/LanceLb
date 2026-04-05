import os
import io
import base64
import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from scorer import compute_ats_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()
app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "ATS service is running."})

@app.route("/evaluate", methods=["POST"])
def evaluate():
    resume_text = ""
    job_description = ""
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
            job_description = request.form.get("job_description", "")
        elif request.is_json:
            data = request.get_json()
            if "resume_b64" in data:
                pdf_bytes = base64.b64decode(data["resume_b64"])
                with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                    resume_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
                job_description = data.get("job_description", "")
            elif "resume_text" in data:
                resume_text = data["resume_text"]
                job_description = data.get("job_description", "")
            else:
                return jsonify({"error": "No file or text provided."}), 400
        else:
            return jsonify({"error": "No file or text provided."}), 400

        resume_text = resume_text.strip()
        if len(resume_text) < 50:
            return jsonify({"error": "Could not extract enough text from the PDF."}), 422

        result = compute_ats_score(resume_text, job_description)
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

        freelancer_skills = " ".join(freelancer.get("skills", []))
        freelancer_str = " ".join([
            freelancer.get("title", ""),
            freelancer.get("bio", ""),
            freelancer_skills,
            freelancer.get("experienceLevel", "")
        ]).strip()

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

        all_strings = [freelancer_str] + job_strings
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(all_strings)

        freelancer_vec = tfidf_matrix[0:1]
        job_vecs = tfidf_matrix[1:]
        similarities = cosine_similarity(freelancer_vec, job_vecs)[0]

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
    port = int(os.getenv("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)