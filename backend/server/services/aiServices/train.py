"""
ATS Model Trainer
-----------------
Trains a resume job-category classifier and saves all artifacts
needed by app.py to the ./model/ directory.

Expected dataset CSV columns:
  - 'Resume_str'  : raw resume text
  - 'Category'    : job category label (e.g. "Data Science", "HR", ...)

Usage:
  python train.py --data path/to/resume_dataset.csv

Download dataset from Kaggle:
  https://www.kaggle.com/datasets/gauravduttakiit/resume-dataset
  (UpdatedResumeDataSet.csv)
"""

import os
import re
import argparse
import joblib
import pandas as pd
import numpy as np
import spacy
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report

# ── Import feature extractor from scorer ──────────────────────
from backend.server.services.aiServices.scorer import clean_resume_text, lemmatize_text, extract_ats_features

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "model")


def load_dataset(path):
    df = pd.read_csv(path)

    # Normalise column names — handle common variations
    col_map = {}
    for col in df.columns:
        lower = col.strip().lower()
        if lower in ('resume_str', 'resume', 'resume_text', 'text'):
            col_map[col] = 'Resume_str'
        elif lower in ('category', 'label', 'job_category', 'class'):
            col_map[col] = 'Category'
    df = df.rename(columns=col_map)

    required = {'Resume_str', 'Category'}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(
            f"Dataset is missing columns: {missing}. "
            f"Found: {list(df.columns)}"
        )

    df = df[['Resume_str', 'Category']].dropna()
    df['Resume_str'] = df['Resume_str'].astype(str)
    df['Category']   = df['Category'].astype(str).str.strip()
    print(f"  Loaded {len(df)} rows, {df['Category'].nunique()} categories.")
    return df


def build_features(texts, nlp, tfidf=None, scaler=None, fit=False):
    print("  Cleaning and lemmatising text...")
    processed = [lemmatize_text(clean_resume_text(t), nlp) for t in texts]

    if fit:
        tfidf  = TfidfVectorizer(max_features=8000, ngram_range=(1, 2), sublinear_tf=True)
        X_tfidf = tfidf.fit_transform(processed)
    else:
        X_tfidf = tfidf.transform(processed)

    print("  Extracting ATS hand-crafted features...")
    ats_rows = [extract_ats_features(t) for t in texts]
    ats_df   = pd.DataFrame(ats_rows)

    if fit:
        scaler  = StandardScaler()
        X_ats   = scaler.fit_transform(ats_df.values)
    else:
        X_ats = scaler.transform(ats_df.values)

    X = hstack([X_tfidf, csr_matrix(X_ats)])
    return X, tfidf, scaler


def pick_best_model(X, y):
    """Cross-validate a few candidates and return the best one."""
    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=1000, C=5, solver="lbfgs", multi_class="auto"),
        "LinearSVC (calibrated)": CalibratedClassifierCV(LinearSVC(max_iter=2000, C=1)),
        "RandomForest": RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_name, best_score, best_clf = None, -1, None

    for name, clf in candidates.items():
        scores = cross_val_score(clf, X, y, cv=cv, scoring="accuracy", n_jobs=-1)
        mean   = scores.mean()
        print(f"    {name}: {mean:.4f} ± {scores.std():.4f}")
        if mean > best_score:
            best_score, best_name, best_clf = mean, name, clf

    print(f"\n  Best model: {best_name} ({best_score:.4f})")
    return best_clf


def main(data_path):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("\n[1/5] Loading dataset...")
    df = load_dataset(data_path)

    print("\n[2/5] Encoding labels...")
    le = LabelEncoder()
    y  = le.fit_transform(df['Category'])
    print(f"  Categories: {list(le.classes_)}")

    print("\n[3/5] Loading spaCy model...")
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        print("  spaCy model not found. Run: python -m spacy download en_core_web_sm")
        raise

    print("\n[4/5] Building features...")
    X, tfidf, scaler = build_features(df['Resume_str'].tolist(), nlp, fit=True)

    print("\n[5/5] Selecting and training best model...")
    best_model = pick_best_model(X, y)
    best_model.fit(X, y)

    # Quick report on full training set
    y_pred = best_model.predict(X)
    print("\n--- Training Set Report ---")
    print(classification_report(y, y_pred, target_names=le.classes_))

    # ── Save Artifacts ────────────────────────────────────────
    print("\nSaving artifacts to ./model/ ...")
    joblib.dump(best_model, os.path.join(OUTPUT_DIR, "best_ats_model.pkl"))
    joblib.dump(tfidf,      os.path.join(OUTPUT_DIR, "tfidf_vectorizer.pkl"))
    joblib.dump(scaler,     os.path.join(OUTPUT_DIR, "ats_scaler.pkl"))
    joblib.dump(le,         os.path.join(OUTPUT_DIR, "label_encoder.pkl"))
    print("Done. All 4 artifacts saved.")
    print(f"  {OUTPUT_DIR}/best_ats_model.pkl")
    print(f"  {OUTPUT_DIR}/tfidf_vectorizer.pkl")
    print(f"  {OUTPUT_DIR}/ats_scaler.pkl")
    print(f"  {OUTPUT_DIR}/label_encoder.pkl")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ATS resume classifier")
    parser.add_argument(
        "--data",
        required=True,
        help="Path to the resume CSV dataset (must have Resume_str and Category columns)",
    )
    args = parser.parse_args()
    main(args.data)
