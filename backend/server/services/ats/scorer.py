import re
import textstat
import pandas as pd
import numpy as np
from scipy.sparse import hstack, csr_matrix
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords, wordnet

for _pkg in ('wordnet', 'stopwords', 'omw-1.4'):
    try:
        nltk.data.find(f'corpora/{_pkg}')
    except LookupError:
        nltk.download(_pkg, quiet=True)

_lemmatizer = WordNetLemmatizer()
_stop_words = set(stopwords.words('english'))

SECTIONS = {
    'experience'     : 5,
    'education'      : 5,
    'skills'         : 5,
    'summary'        : 4,
    'projects'       : 3,
    'certifications' : 2,
    'awards'         : 1,
}

POWER_KEYWORDS = [
    "bachelor", "master", "degree", "certified", "certification",
    "years of experience", "professional", "experienced", "qualified",
    "references available", "portfolio", "volunteer", "internship",
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "adaptability", "creativity",
    "attention to detail", "conflict resolution", "decision making",
    "emotional intelligence", "collaboration", "interpersonal skills",
    "multitasking", "self motivated", "work ethic", "dependable",
    "strategic thinking", "negotiation",
    "project management", "stakeholder", "kpi", "roi", "revenue",
    "budget", "forecasting", "strategic planning", "operations",
    "risk management", "compliance", "process improvement",
    "change management", "performance management", "p&l",
    "cost reduction", "growth", "business development", "pipeline",
    "reporting", "cross functional", "agile", "scrum", "kanban",
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
    "financial analysis", "financial reporting", "accounting",
    "bookkeeping", "auditing", "taxation", "gaap", "ifrs",
    "accounts payable", "accounts receivable", "payroll",
    "balance sheet", "income statement", "cash flow", "valuation",
    "investment", "portfolio management", "risk assessment",
    "quickbooks", "sap", "oracle financials", "cost accounting",
    "variance analysis", "reconciliation", "internal controls",
    "credit analysis", "loan processing", "underwriting",
    "anti money laundering", "know your customer", "kyc",
    "regulatory compliance", "banking operations", "trade finance",
    "wealth management", "retail banking", "commercial banking",
    "financial modeling", "bloomberg", "treasury",
    "sales", "lead generation", "crm", "salesforce", "hubspot",
    "cold calling", "client acquisition", "account management",
    "b2b", "b2c", "market research", "competitive analysis",
    "sales strategy", "territory management", "quota",
    "customer retention", "upselling", "cross selling",
    "proposal writing", "contract negotiation", "partnerships",
    "digital marketing", "seo", "sem", "google analytics",
    "social media", "content marketing", "email marketing",
    "brand management", "campaign management", "paid advertising",
    "facebook ads", "google ads", "influencer marketing",
    "market segmentation", "copywriting", "press release",
    "media relations", "public relations", "crisis communication",
    "event management", "brand awareness", "engagement",
    "talent acquisition", "recruitment", "onboarding", "offboarding",
    "employee relations", "performance appraisal", "hr policies",
    "compensation", "benefits administration", "hris",
    "workforce planning", "succession planning", "training",
    "learning and development", "diversity", "inclusion",
    "labor law", "employee engagement", "organizational development",
    "patient care", "clinical", "diagnosis", "treatment",
    "medical records", "ehr", "hipaa", "nursing", "pharmacy",
    "surgery", "emergency care", "pediatrics", "radiology",
    "medical coding", "icd", "cpt", "healthcare management",
    "public health", "epidemiology", "telemedicine",
    "autocad", "solidworks", "matlab", "ansys", "catia",
    "mechanical design", "electrical engineering", "civil engineering",
    "structural analysis", "quality control", "quality assurance",
    "six sigma", "lean manufacturing", "iso", "cad", "cam",
    "product development", "r&d", "prototyping", "testing",
    "circuit design", "embedded systems", "plc", "scada",
    "project planning", "site management", "blueprints",
    "construction management", "safety compliance", "osha",
    "cost estimation", "subcontractor", "building codes",
    "structural engineering", "surveying", "procurement",
    "scheduling", "ms project", "primavera", "bim", "revit",
    "adobe photoshop", "illustrator", "indesign", "figma",
    "sketch", "ux", "ui", "user experience", "wireframing",
    "prototyping", "branding", "typography", "color theory",
    "graphic design", "motion graphics", "after effects",
    "premiere pro", "3d modeling", "blender", "cinema 4d",
    "video production", "video editing", "photography",
    "content creation", "youtube", "podcast", "streaming",
    "social media management", "analytics", "engagement",
    "adobe creative suite", "final cut pro", "davinci resolve",
    "curriculum development", "lesson planning", "classroom management",
    "student assessment", "differentiated instruction", "e-learning",
    "lms", "special education", "stem", "tutoring",
    "educational technology", "pedagogy", "accreditation",
    "legal research", "case management", "litigation", "contract law",
    "corporate law", "compliance", "regulatory", "due diligence",
    "intellectual property", "mediation", "arbitration",
    "legal writing", "court filings", "advocacy", "negotiation",
    "management consulting", "business analysis", "gap analysis",
    "process mapping", "implementation", "client engagement",
    "deliverables", "powerpoint", "data driven", "insights",
    "recommendations", "frameworks", "best practices",
    "flight operations", "air traffic control", "faa", "easa",
    "aircraft maintenance", "pilot", "aviation safety",
    "flight planning", "navigation", "crew resource management",
    "ground operations", "airport management", "dispatch",
    "personal training", "fitness assessment", "nutrition",
    "strength training", "cardio", "group fitness", "yoga",
    "sports coaching", "injury prevention", "rehabilitation",
    "certified personal trainer", "cpt", "nasm", "ace",
    "food preparation", "menu planning", "culinary arts",
    "kitchen management", "food safety", "haccp", "catering",
    "pastry", "sous chef", "head chef", "recipe development",
    "inventory management", "food costing", "restaurant management",
    "crop management", "irrigation", "soil science", "agronomy",
    "pest control", "livestock", "sustainable farming",
    "precision agriculture", "gis", "supply chain",
    "food production", "greenhouse", "horticulture",
    "vehicle maintenance", "diagnostics", "repair", "obd",
    "engine overhaul", "transmission", "electrical systems",
    "brake systems", "automotive technology", "dealership",
    "service advisor", "parts management",
    "fashion design", "textile", "pattern making", "sewing",
    "garment construction", "trend analysis", "merchandising",
    "retail buying", "supply chain", "sourcing", "production",
    "customer service", "call center", "inbound", "outbound",
    "ticket resolution", "escalation", "sla", "zendesk",
    "freshdesk", "chat support", "email support", "quality assurance",
    "csat", "nps", "workforce management",
]

KEYWORD_DOMAINS = {
    'tech': [
        "python", "java", "javascript", "typescript", "c++", "c#",
        "sql", "nosql", "mongodb", "postgresql", "mysql",
        "react", "node", "express", "django", "flask", "spring",
        "aws", "azure", "google cloud", "docker", "kubernetes",
        "ci/cd", "devops", "git", "github", "rest api", "graphql",
        "microservices", "cloud computing", "cybersecurity", "linux",
        "machine learning", "deep learning", "data science", "nlp",
        "tensorflow", "pytorch", "data analysis", "big data",
        "tableau", "power bi", "excel", "api", "database",
        "software development", "system design", "testing", "debugging",
        "html", "css", "responsive design", "mobile development",
    ],
    'business': [
        "project management", "stakeholder", "kpi", "roi", "revenue",
        "budget", "forecasting", "strategic planning", "operations",
        "risk management", "compliance", "process improvement",
        "agile", "scrum", "kanban", "reporting", "cross functional",
        "business development", "growth", "cost reduction",
        "management consulting", "business analysis", "gap analysis",
        "process mapping", "implementation", "client engagement",
        "deliverables", "powerpoint", "data driven", "insights",
        "recommendations", "frameworks", "best practices",
    ],
    'soft': [
        "leadership", "communication", "teamwork", "problem solving",
        "critical thinking", "time management", "adaptability",
        "attention to detail", "collaboration", "interpersonal skills",
        "self motivated", "strategic thinking", "negotiation",
    ],
    'finance': [
        "financial analysis", "financial reporting", "accounting",
        "auditing", "gaap", "ifrs", "investment", "portfolio management",
        "risk assessment", "sap", "cost accounting", "reconciliation",
    ],
    'marketing': [
        "digital marketing", "seo", "sem", "google analytics",
        "social media", "content marketing", "email marketing",
        "brand management", "campaign management", "copywriting",
        "market research", "competitive analysis",
    ],
    'hr': [
        "talent acquisition", "recruitment", "onboarding", "employee relations",
        "performance appraisal", "compensation", "training",
        "learning and development", "diversity", "inclusion",
    ],
    'design': [
        "adobe photoshop", "illustrator", "figma", "sketch",
        "ux", "ui", "user experience", "wireframing", "prototyping",
        "branding", "graphic design",
    ],
    'general': [
        "bachelor", "master", "degree", "certified", "certification",
        "professional", "experienced", "qualified", "portfolio",
        "volunteer", "internship", "years of experience",
        "customer service", "sales", "crm", "b2b", "b2c",
    ],
}

ACTION_VERBS = [
    "administered", "analyzed", "assigned", "chaired", "consolidated",
    "contracted", "coordinated", "delegated", "developed", "directed",
    "evaluated", "executed", "organized", "oversaw", "planned",
    "prioritized", "produced", "recommended", "reorganized", "reviewed",
    "scheduled", "supervised",
    "allocated", "appraised", "audited", "balanced", "budgeted",
    "calculated", "computed", "managed", "projected", "researched",
    "addressed", "arbitrated", "arranged", "authored", "collaborated",
    "corresponded", "drafted", "enlisted", "formulated", "influenced",
    "interpreted", "lectured", "mediated", "moderated", "negotiated",
    "persuaded", "promoted", "proposed", "publicized", "reconciled",
    "recruited", "spoke", "translated", "wrote",
    "clarified", "collected", "critiqued", "diagnosed", "examined",
    "extracted", "identified", "inspected", "inspired", "interviewed",
    "investigated", "summarized", "surveyed", "systematized",
    "assembled", "built", "designed", "devised", "engineered",
    "fabricated", "maintained", "operated", "pinpointed", "programmed",
    "remodeled", "repaired", "solved",
    "advised", "coached", "communicated", "conducted", "enabled",
    "encouraged", "explained", "facilitated", "guided", "informed",
    "instructed", "stimulated", "taught", "trained",
    "conceptualized", "created", "customized", "established", "fashioned",
    "illustrated", "instituted", "integrated", "performed", "proved",
    "revised", "revitalized", "shaped", "streamlined", "structured",
    "tabulated", "validated",
    "assisted", "counseled", "demonstrated", "educated", "familiarized",
    "motivated", "participated", "provided", "referred", "rehabilitated",
    "reinforced", "represented", "supported", "verified",
    "approved", "catalogued", "classified", "compiled", "dispatched",
    "filed", "generated", "implemented", "monitored", "ordered",
    "prepared", "processed", "purchased", "recorded", "retrieved",
    "screened", "specified",
    "accelerated", "achieved", "attained", "completed", "conceived",
    "convinced", "discovered", "doubled", "effected", "eliminated",
    "expanded", "expedited", "founded", "improved", "increased",
    "initiated", "innovated", "introduced", "invented", "launched",
    "mastered", "originated", "overcame", "overhauled", "pioneered",
    "reduced", "resolved", "spearheaded", "strengthened", "transformed",
    "upgraded", "co-authored",
]


def clean_resume_text(text):
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    text = re.sub(r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', '', text)
    text = re.sub(r'[\n\r\t]', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()


def lemmatize_text(text):
    tokens = [
        _lemmatizer.lemmatize(word)
        for word in text.split()
        if word.isalpha() and len(word) > 2 and word not in _stop_words
    ]
    return ' '.join(tokens)


def extract_ats_features(text):
    word_count     = len(text.split())
    has_education  = 1 if re.search(r'\beducation\b',  text, re.I) else 0
    has_experience = 1 if re.search(r'\bexperience\b', text, re.I) else 0
    has_skills     = 1 if re.search(r'\bskills\b',     text, re.I) else 0
    has_summary    = 1 if re.search(r'\bsummary\b',    text, re.I) else 0
    has_projects   = 1 if re.search(r'\bprojects\b',   text, re.I) else 0
    has_certif     = 1 if re.search(r'\bcertif\w+\b',  text, re.I) else 0
    has_awards     = 1 if re.search(r'\bawards?\b',    text, re.I) else 0

    action_verb_count = sum(1 for verb in ACTION_VERBS if verb in text.lower())
    number_count      = len(re.findall(r'\b\d+[\%\+]?\b', text))
    has_email         = 1 if re.search(r'\S+@\S+', text) else 0
    has_phone         = 1 if re.search(r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', text) else 0

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
        feedback.append("✅ All key sections detected.")
    return min(score, 25), feedback


def score_keywords(text):
    text_lower  = text.lower()
    domain_hits = {d: [kw for kw in kws if kw in text_lower] for d, kws in KEYWORD_DOMAINS.items()}

    best_domain   = max(domain_hits, key=lambda d: len(domain_hits[d]))
    best_hits     = len(domain_hits[best_domain])
    best_size     = len(KEYWORD_DOMAINS[best_domain])
    primary_ratio = best_hits / best_size if best_size else 0
    primary_score = round(primary_ratio * 15)

    other_hits      = sum(len(h) for d, h in domain_hits.items() if d != best_domain)
    secondary_score = min(other_hits, 10)
    score           = min(primary_score + secondary_score, 25)

    missing_from_domain = [kw for kw in KEYWORD_DOMAINS[best_domain] if kw not in text_lower]

    if primary_ratio < 0.25:
        feedback = [f"⚠️  Low keyword coverage in your main field ({best_hits}/{best_size} {best_domain} keywords). Consider adding: {', '.join(missing_from_domain[:5])}."]
    elif primary_ratio < 0.5:
        feedback = [f"✅ Moderate keyword coverage ({best_hits}/{best_size} {best_domain} keywords detected). You could strengthen it with: {', '.join(missing_from_domain[:3])}."]
    else:
        feedback = [f"✅ Strong keyword coverage ({best_hits}/{best_size} {best_domain} keywords found). Great job matching industry terminology!"]

    return score, feedback


def score_quantified_impact(text):
    patterns = [
        r'\b\d+\s*%', r'\$\s*\d+[\.,]?\d*[kmb]?', r'\b\d+\+\s*\w+',
        r'\b\d+x\b', r'\b\d{4}\b(?!.*\d{4})', r'\b\d+\s*(million|billion|thousand)',
    ]
    matches = []
    for p in patterns:
        matches.extend(re.findall(p, text, re.I))
    count = len(matches)
    score = min(count * 2, 20)

    if count == 0:
        feedback = ["❌ No quantified achievements found. Add numbers like '↑ sales by 30%' or 'managed team of 10'."]
    elif count < 5:
        feedback = [f"⚠️  Only {count} quantified achievement(s) detected. Try to include more metrics and numbers."]
    else:
        feedback = [f"✅ {count} quantified achievements detected. Great use of metrics!"]
    return score, feedback


def score_action_verbs(text):
    text_lower = text.lower()
    found      = [v for v in ACTION_VERBS if v in text_lower]
    count      = len(found)
    score      = min(count, 15)

    if count < 5:
        feedback = [f"❌ Only {count} action verb(s) found. Start bullet points with strong verbs like: {', '.join(ACTION_VERBS[:5])}."]
    elif count < 12:
        feedback = [f"⚠️  {count} action verbs found. Adding more will strengthen your experience descriptions."]
    elif count < 20:
        feedback = [f"✅ {count} action verbs detected. Good use of dynamic language!"]
    else:
        feedback = [f"✅ {count} action verbs detected. Excellent vocabulary!"]
    return score, feedback


def score_readability(text):
    try:
        flesch = textstat.flesch_reading_ease(text)
    except:
        flesch = 50

    if   flesch >= 50: return 10, ["✅ Readability is excellent — clear and professional."]
    elif flesch >= 30: return  8, ["✅ Readability is good. Language is appropriately professional."]
    elif flesch >= 10: return  5, ["⚠️  Readability is moderate. Consider simplifying some sentences."]
    else:              return  3, ["❌ Readability is poor. Use shorter sentences and clearer language."]


def score_contact_info(text):
    has_email = bool(re.search(r'\S+@\S+\.\S+', text))
    has_phone = bool(re.search(r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', text))
    score     = (3 if has_email else 0) + (2 if has_phone else 0)
    feedback  = [
        "✅ Email address detected." if has_email else "❌ No email address detected. Add your email.",
        "✅ Phone number detected."  if has_phone else "❌ No phone number detected. Add your phone number.",
    ]
    return score, feedback


def compute_ats_score(resume_text, model, tfidf, scaler, le):
    s1, f1 = score_sections(resume_text)
    s2, f2 = score_keywords(resume_text)
    s3, f3 = score_quantified_impact(resume_text)
    s4, f4 = score_action_verbs(resume_text)
    s5, f5 = score_readability(resume_text)
    s6, f6 = score_contact_info(resume_text)

    total_score = s1 + s2 + s3 + s4 + s5 + s6

    if   total_score >= 85: grade = "🟢 Excellent"
    elif total_score >= 70: grade = "🟡 Good"
    elif total_score >= 50: grade = "🟠 Average"
    else:                   grade = "🔴 Poor"

    # ML: predict job category from trained model
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

    # ── Keyword-domain override ───────────────────────────────
    # The training dataset lacks a "Software Engineer" label, so the model
    # misclassifies tech resumes as Mechanical/Civil/Electrical Engineer.
    # When the keyword domain strongly contradicts the ML prediction, or
    # confidence is low, we override with the keyword-derived category.
    DOMAIN_TO_CATEGORY = {
        'tech'     : 'Software Developer',
        'design'   : 'Web Designing',
        'finance'  : 'Finance',
        'marketing': 'Digital Marketing',
        'hr'       : 'Human Resources',
        'business' : 'Business Analyst',
    }
    NON_TECH_ENGINEER_LABELS = {
        'Mechanical Engineer', 'Civil Engineer', 'Electrical Engineering',
        'Mechanical Engineering', 'Civil Engineering',
    }
    text_lower   = resume_text.lower()
    domain_hits  = {d: [kw for kw in kws if kw in text_lower] for d, kws in KEYWORD_DOMAINS.items()}
    best_domain  = max(domain_hits, key=lambda d: len(domain_hits[d]))
    best_hits    = len(domain_hits[best_domain])

    should_override = (
        confidence < 60
        or (pred_category in NON_TECH_ENGINEER_LABELS and best_domain == 'tech' and best_hits >= 5)
    )
    if should_override and best_domain in DOMAIN_TO_CATEGORY and best_hits >= 3:
        pred_category = DOMAIN_TO_CATEGORY[best_domain]

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
