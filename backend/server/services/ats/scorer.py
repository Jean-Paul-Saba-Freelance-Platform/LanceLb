# LanceLB ATS Scorer v2.0 - domain-aware scoring
import re
import textstat
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords

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
    "scheduled", "supervised", "allocated", "appraised", "audited",
    "balanced", "budgeted", "calculated", "computed", "managed",
    "projected", "researched", "addressed", "arbitrated", "arranged",
    "authored", "collaborated", "corresponded", "drafted", "enlisted",
    "formulated", "influenced", "interpreted", "lectured", "mediated",
    "moderated", "negotiated", "persuaded", "promoted", "proposed",
    "publicized", "reconciled", "recruited", "spoke", "translated",
    "wrote", "clarified", "collected", "critiqued", "diagnosed",
    "examined", "extracted", "identified", "inspected", "inspired",
    "interviewed", "investigated", "summarized", "surveyed",
    "systematized", "assembled", "built", "designed", "devised",
    "engineered", "fabricated", "maintained", "operated", "pinpointed",
    "programmed", "remodeled", "repaired", "solved", "advised",
    "coached", "communicated", "conducted", "enabled", "encouraged",
    "explained", "facilitated", "guided", "informed", "instructed",
    "stimulated", "taught", "trained", "conceptualized", "created",
    "customized", "established", "fashioned", "illustrated", "instituted",
    "integrated", "performed", "proved", "revised", "revitalized",
    "shaped", "streamlined", "structured", "tabulated", "validated",
    "assisted", "counseled", "demonstrated", "educated", "familiarized",
    "motivated", "participated", "provided", "referred", "rehabilitated",
    "reinforced", "represented", "supported", "verified", "approved",
    "catalogued", "classified", "compiled", "dispatched", "filed",
    "generated", "implemented", "monitored", "ordered", "prepared",
    "processed", "purchased", "recorded", "retrieved", "screened",
    "specified", "accelerated", "achieved", "attained", "completed",
    "conceived", "convinced", "discovered", "doubled", "effected",
    "eliminated", "expanded", "expedited", "founded", "improved",
    "increased", "initiated", "innovated", "introduced", "invented",
    "launched", "mastered", "originated", "overcame", "overhauled",
    "pioneered", "reduced", "resolved", "spearheaded", "strengthened",
    "transformed", "upgraded", "co-authored",
]


def score_sections(text):
    SECTION_PATTERNS = {
        'experience': r'experience|professional experience|work experience|employment history|work history',
        'education': r'education|academic background|qualifications|academic history',
        'skills': r'skills|competencies|core competencies|technical skills|expertise|technologies',
        'summary': r'summary|profile|objective|about me|professional summary|career summary',
        'projects': r'projects|portfolio|key projects|personal projects|academic projects',
        'certifications': r'certifications|licenses|credentials|accreditations|certificates',
        'awards': r'awards|achievements|honors|recognition|accomplishments',
    }
    SECTION_POINTS = {
        'experience': 5, 'education': 5, 'skills': 5,
        'summary': 4, 'projects': 3, 'certifications': 2, 'awards': 1,
    }
    score, missing = 0, []
    for section, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, text, re.I):
            score += SECTION_POINTS[section]
        else:
            missing.append(section)
    feedback = []
    if missing:
        feedback.append(f"⚠️ Add a {', '.join(missing)} section to strengthen your resume.")
    else:
        feedback.append("✅ All key sections detected.")
    return min(score, 25), feedback


def score_keywords(text):
    text_lower = text.lower()
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
    feedback = []
    if primary_ratio < 0.25:
        feedback.append(f"⚠️ Consider adding these keywords to improve your ranking: {', '.join(missing_from_domain[:5])}.")
    elif primary_ratio < 0.5:
        feedback.append(f"✅ Good keyword coverage. You could strengthen it by adding: {', '.join(missing_from_domain[:3])}.")
    else:
        feedback.append(f"✅ Strong keyword coverage ({best_hits}/{best_size} {best_domain} keywords found). Great job!")
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
        feedback = [f"⚠️ Only {count} quantified achievement(s) detected. Try to include more metrics."]
    else:
        feedback = [f"✅ {count} quantified achievements detected. Great use of metrics!"]
    return score, feedback


def score_action_verbs(text):
    text_lower = text.lower()
    count = sum(1 for v in ACTION_VERBS if v in text_lower)
    score = min(count, 15)
    if count < 5:
        feedback = [f"❌ Only {count} action verb(s) found. Use strong verbs like: {', '.join(ACTION_VERBS[:5])}."]
    elif count < 12:
        feedback = [f"⚠️ {count} action verbs found. Adding more will strengthen your descriptions."]
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
    elif flesch >= 10: return  6, ["⚠️ Readability is moderate. Consider simplifying some sentences."]
    else:              return  5, ["⚠️ Language is dense. Shorter sentences improve ATS readability."]

def score_contact_info(text):
    has_email = bool(re.search(r'\S+@\S+\.\S+', text))
    has_phone = bool(re.search(r'[\+\(]?[1-9][0-9\s\.\-\(\)]{8,}[0-9]', text))
    score     = (3 if has_email else 0) + (2 if has_phone else 0)
    feedback  = [
        "✅ Email address detected." if has_email else "❌ No email detected. Add your email.",
        "✅ Phone number detected."  if has_phone else "❌ No phone detected. Add your phone number.",
    ]
    return score, feedback

def score_job_match(resume_text, job_description):
    if not job_description or len(job_description.strip()) < 20:
        return None, [], []

    resume_lower = resume_text.lower()
    job_lower    = job_description.lower()

    common_stops = {
        'the', 'and', 'for', 'with', 'you', 'will', 'are', 'our', 'this',
        'that', 'have', 'from', 'they', 'been', 'has', 'its', 'your',
        'their', 'what', 'which', 'who', 'can', 'all', 'each', 'she',
        'his', 'her', 'but', 'not', 'was', 'one', 'how', 'more', 'also',
        'any', 'may', 'new', 'use', 'get', 'set', 'per', 'via', 'etc',
    }

    words = re.findall(r'\b[a-z][a-z0-9\+\#\.]{2,}\b', job_lower)
    job_keywords = [w for w in words if w not in common_stops]

    tokens = job_lower.split()
    bigrams = [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens)-1)]

    matched   = []
    unmatched = []

    checked_bigrams = set()
    for bigram in bigrams:
        if len(bigram) > 6 and bigram not in checked_bigrams:
            checked_bigrams.add(bigram)
            if bigram in resume_lower:
                matched.append(bigram)
            else:
                unmatched.append(bigram)

    checked = set()
    for kw in job_keywords:
        if kw not in checked and kw not in ' '.join(matched):
            checked.add(kw)
            if kw in resume_lower:
                matched.append(kw)
            else:
                unmatched.append(kw)

    matched   = list(dict.fromkeys(matched))[:20]
    unmatched = list(dict.fromkeys(unmatched))[:10]

    total = len(matched) + len(unmatched)
    if total == 0:
        return None, [], []

    ratio = len(matched) / total
    score = round(ratio * 100)

    return score, matched, unmatched


def compute_ats_score(resume_text, job_description=None):
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

    result = {
        'total_score' : total_score,
        'grade'       : grade,
        'breakdown'   : {
            'Section Completeness' : s1,
            'Keyword Density'      : s2,
            'Quantified Impact'    : s3,
            'Action Verbs'         : s4,
            'Readability'          : s5,
            'Contact Info'         : s6,
        },
        'feedback' : f1 + f2 + f3 + f4 + f5 + f6,
    }

    job_match_score, matched, missing = score_job_match(resume_text, job_description)
    if job_match_score is not None:
        result['job_match_score']  = job_match_score
        result['matched_keywords'] = matched
        result['missing_keywords'] = missing

    return result
# updated Sun Apr  5 17:17:12 MEDT 2026
