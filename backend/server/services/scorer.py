import re
import textstat
import pandas as pd
import numpy as np
from scipy.sparse import hstack, csr_matrix
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords, wordnet

# Download required NLTK data on first run
for _pkg in ('wordnet', 'stopwords', 'omw-1.4'):
    try:
        nltk.data.find(f'corpora/{_pkg}')
    except LookupError:
        nltk.download(_pkg, quiet=True)

_lemmatizer   = WordNetLemmatizer()
_stop_words   = set(stopwords.words('english'))

# ── Constants ─────────────────────────────────────────────────

SECTIONS = {
    'experience'     : 5,
    'education'      : 5,
    'skills'         : 5,
    'summary'        : 4,
    'projects'       : 3,
    'certifications' : 2,
    'awards'         : 1,
}

# ── In scorer.py — replace POWER_KEYWORDS with this ──────────

POWER_KEYWORDS = [

    # ── General ATS (apply to all resumes) ───────────────────
    "bachelor", "master", "degree", "certified", "certification",
    "years of experience", "professional", "experienced", "qualified",
    "references available", "portfolio", "volunteer", "internship",

    # ── Soft Skills ───────────────────────────────────────────
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "adaptability", "creativity",
    "attention to detail", "conflict resolution", "decision making",
    "emotional intelligence", "collaboration", "interpersonal skills",
    "multitasking", "self motivated", "work ethic", "dependable",
    "strategic thinking", "negotiation",

    # ── Management & Business ─────────────────────────────────
    "project management", "stakeholder", "kpi", "roi", "revenue",
    "budget", "forecasting", "strategic planning", "operations",
    "risk management", "compliance", "process improvement",
    "change management", "performance management", "p&l",
    "cost reduction", "growth", "business development", "pipeline",
    "reporting", "cross functional", "agile", "scrum", "kanban",

    # ── Information Technology ────────────────────────────────
    "python", "java", "javascript", "typescript", "c++", "c#",
    "sql", "nosql", "mongodb", "postgresql", "mysql",
    "react", "node", "express", "django", "flask", "spring",
    "aws", "azure", "google cloud", "docker", "kubernetes",
    "ci/cd", "devops", "git", "github", "rest api", "graphql",
    "microservices", "cloud computing", "cybersecurity", "linux",
    "machine learning", "deep learning", "data science", "nlp",
    "tensorflow", "pytorch", "data analysis", "big data", "hadoop",
    "spark", "tableau", "power bi", "excel", "api", "database",
    "software development", "system design", "testing", "debugging",
    "html", "css", "responsive design", "mobile development",

    # ── Finance & Accounting ──────────────────────────────────
    "financial analysis", "financial reporting", "accounting",
    "bookkeeping", "auditing", "taxation", "gaap", "ifrs",
    "accounts payable", "accounts receivable", "payroll",
    "balance sheet", "income statement", "cash flow", "valuation",
    "investment", "portfolio management", "risk assessment",
    "quickbooks", "sap", "oracle financials", "cost accounting",
    "variance analysis", "reconciliation", "internal controls",

    # ── Banking ───────────────────────────────────────────────
    "credit analysis", "loan processing", "underwriting",
    "anti money laundering", "know your customer", "kyc",
    "regulatory compliance", "banking operations", "trade finance",
    "wealth management", "retail banking", "commercial banking",
    "financial modeling", "bloomberg", "treasury",

    # ── Business Development & Sales ─────────────────────────
    "sales", "lead generation", "crm", "salesforce", "hubspot",
    "cold calling", "client acquisition", "account management",
    "b2b", "b2c", "market research", "competitive analysis",
    "sales strategy", "territory management", "quota",
    "customer retention", "upselling", "cross selling",
    "proposal writing", "contract negotiation", "partnerships",

    # ── Marketing & Public Relations ─────────────────────────
    "digital marketing", "seo", "sem", "google analytics",
    "social media", "content marketing", "email marketing",
    "brand management", "campaign management", "paid advertising",
    "facebook ads", "google ads", "influencer marketing",
    "market segmentation", "copywriting", "press release",
    "media relations", "public relations", "crisis communication",
    "event management", "brand awareness", "engagement",

    # ── Human Resources ───────────────────────────────────────
    "talent acquisition", "recruitment", "onboarding", "offboarding",
    "employee relations", "performance appraisal", "hr policies",
    "compensation", "benefits administration", "hris",
    "workforce planning", "succession planning", "training",
    "learning and development", "diversity", "inclusion",
    "labor law", "employee engagement", "organizational development",

    # ── Healthcare ────────────────────────────────────────────
    "patient care", "clinical", "diagnosis", "treatment",
    "medical records", "ehr", "hipaa", "nursing", "pharmacy",
    "surgery", "emergency care", "pediatrics", "radiology",
    "medical coding", "icd", "cpt", "healthcare management",
    "public health", "epidemiology", "telemedicine",

    # ── Engineering ───────────────────────────────────────────
    "autocad", "solidworks", "matlab", "ansys", "catia",
    "mechanical design", "electrical engineering", "civil engineering",
    "structural analysis", "quality control", "quality assurance",
    "six sigma", "lean manufacturing", "iso", "cad", "cam",
    "product development", "r&d", "prototyping", "testing",
    "circuit design", "embedded systems", "plc", "scada",

    # ── Construction ──────────────────────────────────────────
    "project planning", "site management", "blueprints",
    "construction management", "safety compliance", "osha",
    "cost estimation", "subcontractor", "building codes",
    "structural engineering", "surveying", "procurement",
    "scheduling", "ms project", "primavera", "bim", "revit",

    # ── Design ────────────────────────────────────────────────
    "adobe photoshop", "illustrator", "indesign", "figma",
    "sketch", "ux", "ui", "user experience", "wireframing",
    "prototyping", "branding", "typography", "color theory",
    "graphic design", "motion graphics", "after effects",
    "premiere pro", "3d modeling", "blender", "cinema 4d",

    # ── Digital Media ─────────────────────────────────────────
    "video production", "video editing", "photography",
    "content creation", "youtube", "podcast", "streaming",
    "social media management", "analytics", "engagement",
    "adobe creative suite", "final cut pro", "davinci resolve",

    # ── Education & Teaching ──────────────────────────────────
    "curriculum development", "lesson planning", "classroom management",
    "student assessment", "differentiated instruction", "e-learning",
    "lms", "special education", "stem", "tutoring",
    "educational technology", "pedagogy", "accreditation",

    # ── Legal & Advocacy ──────────────────────────────────────
    "legal research", "case management", "litigation", "contract law",
    "corporate law", "compliance", "regulatory", "due diligence",
    "intellectual property", "mediation", "arbitration",
    "legal writing", "court filings", "advocacy", "negotiation",

    # ── Consulting ────────────────────────────────────────────
    "management consulting", "business analysis", "gap analysis",
    "process mapping", "implementation", "client engagement",
    "deliverables", "powerpoint", "data driven", "insights",
    "recommendations", "frameworks", "best practices",

    # ── Aviation ──────────────────────────────────────────────
    "flight operations", "air traffic control", "faa", "easa",
    "aircraft maintenance", "pilot", "aviation safety",
    "flight planning", "navigation", "crew resource management",
    "ground operations", "airport management", "dispatch",

    # ── Fitness & Sports ──────────────────────────────────────
    "personal training", "fitness assessment", "nutrition",
    "strength training", "cardio", "group fitness", "yoga",
    "sports coaching", "injury prevention", "rehabilitation",
    "certified personal trainer", "cpt", "nasm", "ace",

    # ── Chef & Culinary ───────────────────────────────────────
    "food preparation", "menu planning", "culinary arts",
    "kitchen management", "food safety", "haccp", "catering",
    "pastry", "sous chef", "head chef", "recipe development",
    "inventory management", "food costing", "restaurant management",

    # ── Agriculture ───────────────────────────────────────────
    "crop management", "irrigation", "soil science", "agronomy",
    "pest control", "livestock", "sustainable farming",
    "precision agriculture", "gis", "supply chain",
    "food production", "greenhouse", "horticulture",

    # ── Automobile ────────────────────────────────────────────
    "vehicle maintenance", "diagnostics", "repair", "obd",
    "engine overhaul", "transmission", "electrical systems",
    "brake systems", "automotive technology", "dealership",
    "service advisor", "parts management",

    # ── Apparel & Fashion ─────────────────────────────────────
    "fashion design", "textile", "pattern making", "sewing",
    "garment construction", "trend analysis", "merchandising",
    "retail buying", "supply chain", "sourcing", "production",

    # ── BPO & Customer Service ────────────────────────────────
    "customer service", "call center", "inbound", "outbound",
    "ticket resolution", "escalation", "sla", "zendesk",
    "freshdesk", "chat support", "email support", "quality assurance",
    "csat", "nps", "workforce management",
]

# ── In scorer.py — replace your ACTION_VERBS list with this ──

ACTION_VERBS = [
    # Management & Leadership
    "administered", "analyzed", "assigned", "chaired", "consolidated",
    "contracted", "coordinated", "delegated", "developed", "directed",
    "evaluated", "executed", "organized", "oversaw", "planned",
    "prioritized", "produced", "recommended", "reorganized", "reviewed",
    "scheduled", "supervised",

    # Financial
    "allocated", "appraised", "audited", "balanced", "budgeted",
    "calculated", "computed", "managed", "projected", "researched",

    # Communication
    "addressed", "arbitrated", "arranged", "authored", "collaborated",
    "corresponded", "drafted", "enlisted", "formulated", "influenced",
    "interpreted", "lectured", "mediated", "moderated", "negotiated",
    "persuaded", "promoted", "proposed", "publicized", "reconciled",
    "recruited", "spoke", "translated", "wrote",

    # Research & Analysis
    "clarified", "collected", "critiqued", "diagnosed", "examined",
    "extracted", "identified", "inspected", "inspired", "interviewed",
    "investigated", "summarized", "surveyed", "systematized",

    # Technical
    "assembled", "built", "designed", "devised", "engineered",
    "fabricated", "maintained", "operated", "pinpointed", "programmed",
    "remodeled", "repaired", "solved",

    # Teaching & Coaching
    "advised", "coached", "communicated", "conducted", "enabled",
    "encouraged", "explained", "facilitated", "guided", "informed",
    "instructed", "stimulated", "taught", "trained",

    # Creative
    "conceptualized", "created", "customized", "established", "fashioned",
    "illustrated", "instituted", "integrated", "performed", "proved",
    "revised", "revitalized", "shaped", "streamlined", "structured",
    "tabulated", "validated",

    # Support & Service
    "assisted", "counseled", "demonstrated", "educated", "familiarized",
    "motivated", "participated", "provided", "referred", "rehabilitated",
    "reinforced", "represented", "supported", "verified",

    # Administrative
    "approved", "catalogued", "classified", "compiled", "dispatched",
    "filed", "generated", "implemented", "monitored", "ordered",
    "prepared", "processed", "purchased", "recorded", "retrieved",
    "screened", "specified",

    # Achievement
    "accelerated", "achieved", "attained", "completed", "conceived",
    "convinced", "discovered", "doubled", "effected", "eliminated",
    "expanded", "expedited", "founded", "improved", "increased",
    "initiated", "innovated", "introduced", "invented", "launched",
    "mastered", "originated", "overcame", "overhauled", "pioneered",
    "reduced", "resolved", "spearheaded", "strengthened", "transformed",
    "upgraded", "co-authored"
]

# ── Text Cleaning ─────────────────────────────────────────────

def clean_resume_text(text):
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    text = re.sub(r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', '', text)
    text = re.sub(r'[\n\r\t]', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.lower()
    return text

# ── Lemmatization ─────────────────────────────────────────────

def lemmatize_text(text):
    tokens = [
        _lemmatizer.lemmatize(word)
        for word in text.split()
        if word.isalpha() and len(word) > 2 and word not in _stop_words
    ]
    return ' '.join(tokens)

# ── ATS Feature Extraction ────────────────────────────────────

def extract_ats_features(text):
    word_count      = len(text.split())
    has_education   = 1 if re.search(r'\beducation\b',  text, re.I) else 0
    has_experience  = 1 if re.search(r'\bexperience\b', text, re.I) else 0
    has_skills      = 1 if re.search(r'\bskills\b',     text, re.I) else 0
    has_summary     = 1 if re.search(r'\bsummary\b',    text, re.I) else 0
    has_projects    = 1 if re.search(r'\bprojects\b',   text, re.I) else 0
    has_certif      = 1 if re.search(r'\bcertif\w+\b',  text, re.I) else 0
    has_awards      = 1 if re.search(r'\bawards?\b',    text, re.I) else 0

    action_verb_count = sum(
        1 for verb in ACTION_VERBS if verb in text.lower()
    )
    number_count = len(re.findall(r'\b\d+[\%\+]?\b', text))
    has_email    = 1 if re.search(r'\S+@\S+', text) else 0
    has_phone    = 1 if re.search(
        r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', text
    ) else 0

    try:
        readability = textstat.flesch_reading_ease(text)
    except:
        readability = 50

    words        = text.lower().split()
    unique_ratio = len(set(words)) / len(words) if words else 0

    return {
        'word_count'         : word_count,
        'has_education'      : has_education,
        'has_experience'     : has_experience,
        'has_skills'         : has_skills,
        'has_summary'        : has_summary,
        'has_projects'       : has_projects,
        'has_certifications' : has_certif,
        'has_awards'         : has_awards,
        'action_verb_count'  : action_verb_count,
        'number_count'       : number_count,
        'has_email'          : has_email,
        'has_phone'          : has_phone,
        'readability_score'  : readability,
        'unique_word_ratio'  : unique_ratio,
    }

# ── Individual Scorers ────────────────────────────────────────

def score_sections(text):
    score, found, missing = 0, [], []
    for section, pts in SECTIONS.items():
        if re.search(rf'\b{section}\b', text, re.I):
            score += pts
            found.append(section)
        else:
            missing.append(section)

    feedback = []
    if missing:
        feedback.append(
            f"⚠️  Missing sections: {', '.join(missing).upper()}. "
            f"Adding them can improve ATS ranking."
        )
    else:
        feedback.append(" All key sections detected.")

    return min(score, 25), feedback


# ── In scorer.py — replace score_keywords() with this ────────

def score_keywords(text):
    text_lower = text.lower()
    found      = [kw for kw in POWER_KEYWORDS if kw in text_lower]
    missing    = [kw for kw in POWER_KEYWORDS if kw not in text_lower]
    ratio      = len(found) / len(POWER_KEYWORDS)
    score      = round(ratio * 25)

    feedback = []
    if ratio < 0.05:
        feedback.append(
            f" Very few ATS keywords detected ({len(found)}/{len(POWER_KEYWORDS)}). "
            f"Add more industry-relevant terms to your resume."
        )
    elif ratio < 0.15:
        feedback.append(
            f"  Low keyword coverage ({len(found)}/{len(POWER_KEYWORDS)}). "
            f"Consider adding: {', '.join(missing[:6])}."
        )
    elif ratio < 0.25:
        feedback.append(
            f" Moderate keyword coverage ({len(found)}/{len(POWER_KEYWORDS)} keywords found). "
            f"You can still improve by adding: {', '.join(missing[:4])}."
        )
    else:
        feedback.append(
            f" Strong keyword coverage ({len(found)}/{len(POWER_KEYWORDS)} keywords found). "
            f"Great job matching industry terminology!"
        )

    return min(score, 25), feedback


def score_quantified_impact(text):
    patterns = [
        r'\b\d+\s*%',
        r'\$\s*\d+[\.,]?\d*[kmb]?',
        r'\b\d+\+\s*\w+',
        r'\b\d+x\b',
        r'\b\d{4}\b(?!.*\d{4})',
        r'\b\d+\s*(million|billion|thousand)',
    ]
    matches = []
    for pattern in patterns:
        matches.extend(re.findall(pattern, text, re.I))

    count = len(matches)
    score = min(count * 2, 20)

    feedback = []
    if count == 0:
        feedback.append(
            " No quantified achievements found. "
            "Add numbers like '↑ sales by 30%' or 'managed team of 10'."
        )
    elif count < 5:
        feedback.append(
            f"  Only {count} quantified achievement(s) detected. "
            "Try to include more metrics and numbers."
        )
    else:
        feedback.append(
            f" {count} quantified achievements detected. Great use of metrics!"
        )

    return score, feedback


def score_action_verbs(text):
    text_lower = text.lower()
    found      = [v for v in ACTION_VERBS if v in text_lower]
    count      = len(found)
    score      = min(count, 15)      # still max 15 pts

    feedback = []
    if count < 5:
        feedback.append(
            f" Only {count} action verb(s) found. "
            f"Start bullet points with strong verbs like: "
            f"{', '.join(ACTION_VERBS[:5])}."
        )
    elif count < 12:
        feedback.append(
            f"⚠️  {count} action verbs found. "
            f"Adding more will strengthen your experience descriptions."
        )
    elif count < 20:
        feedback.append(
            f" {count} action verbs detected. Good use of dynamic language!"
        )
    else:
        feedback.append(
            f" {count} action verbs detected. Excellent vocabulary!"
        )

    return score, feedback


def score_readability(text):
    try:
        flesch = textstat.flesch_reading_ease(text)
    except:
        flesch = 50

    if   60 <= flesch <= 80 : return 10, ["✅ Readability is excellent — clear and professional."]
    elif 40 <= flesch <  60 : return  7, ["⚠️  Readability is moderate. Simplify some sentences."]
    elif 80 <  flesch <= 90 : return  7, ["⚠️  Text may be too simple. Add more technical depth."]
    else                    : return  4, ["❌ Readability is poor. Use shorter sentences and clearer language."]


def score_contact_info(text):
    has_email = bool(re.search(r'\S+@\S+\.\S+', text))
    has_phone = bool(re.search(r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', text))
    score     = (3 if has_email else 0) + (2 if has_phone else 0)

    feedback  = []
    feedback.append("✅ Email address detected."   if has_email else "❌ No email address detected. Add your email.")
    feedback.append("✅ Phone number detected."    if has_phone else "❌ No phone number detected. Add your phone number.")

    return score, feedback

# ── Master Scorer ─────────────────────────────────────────────

def compute_ats_score(resume_text, model, tfidf, scaler, le):
    s1, f1 = score_sections(resume_text)
    s2, f2 = score_keywords(resume_text)
    s3, f3 = score_quantified_impact(resume_text)
    s4, f4 = score_action_verbs(resume_text)
    s5, f5 = score_readability(resume_text)
    s6, f6 = score_contact_info(resume_text)

    total_score = s1 + s2 + s3 + s4 + s5 + s6

    if   total_score >= 85 : grade = "🟢 Excellent"
    elif total_score >= 70 : grade = "🟡 Good"
    elif total_score >= 50 : grade = "🟠 Average"
    else                   : grade = "🔴 Poor"

    # ── Predict Job Category ──────────────────────────────────
    cleaned    = clean_resume_text(resume_text)
    lemmatized = lemmatize_text(cleaned)
    tfidf_vec  = tfidf.transform([lemmatized])

    ats_feats        = pd.DataFrame([extract_ats_features(resume_text)])
    ats_scaled_feats = scaler.transform(ats_feats)
    X_input          = hstack([tfidf_vec, csr_matrix(ats_scaled_feats)])

    pred_label    = model.predict(X_input)[0]
    pred_proba    = model.predict_proba(X_input)[0]
    pred_category = le.inverse_transform([pred_label])[0]
    confidence    = round(float(np.max(pred_proba)) * 100, 1)

    return {
        'total_score'        : total_score,
        'grade'              : grade,
        'predicted_category' : pred_category,
        'confidence'         : confidence,
        'breakdown'          : {
            'Section Completeness' : s1,
            'Keyword Density'      : s2,
            'Quantified Impact'    : s3,
            'Action Verbs'         : s4,
            'Readability'          : s5,
            'Contact Info'         : s6,
        },
        'feedback' : f1 + f2 + f3 + f4 + f5 + f6,
    }
