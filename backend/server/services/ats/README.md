---
title: LanceLb ATS Scoring
emoji: 📄
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# LanceLb ATS Scoring Service

Flask API that scores resumes using a trained ML model.

## Endpoints

- `GET /health` — health check
- `POST /evaluate` — score a resume (multipart PDF upload or JSON `resume_text`)
