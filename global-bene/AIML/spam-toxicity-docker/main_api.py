from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

app = FastAPI(
    title="Spam & Toxicity Detection API",
    version="2.0.0"

)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Simple rule-based spam detection (no ML dependencies)
SPAM_KEYWORDS = [
    # Financial scams
    'free money', 'win prize', 'claim reward', 'instant cash', 'guaranteed money',
    'make money fast', 'earn $', 'cash prize', 'lottery win', 'inheritance claim',
    'bitcoin investment', 'crypto investment', 'loan approval', 'instant loan',
    'no credit check', 'bad credit ok', 'pre-approved', 'guaranteed approval',

    # Promotional spam
    'limited time offer', 'urgent action required', 'act now', 'click here',
    'sign up free', 'download now', 'subscribe now', 'join free', 'free trial',
    'special discount', 'exclusive offer', 'hot deal', 'amazing deal',

    # Phishing indicators
    'verify account', 'account suspended', 'security alert', 'password reset',
    'confirm identity', 'update payment', 'billing issue', 'account locked',
    'suspicious activity', 'unauthorized access',

    # Generic spam
    'congratulations winner', 'you have won', 'selected winner', 'lucky winner',
    'prize notification', 'gift card', 'free gift', 'bonus offer', 'special promotion'
]

TOXIC_KEYWORDS = [
    'hate', 'stupid', 'idiot', 'dumb', 'moron', 'asshole', 'bastard', 'bitch',
    'fuck', 'shit', 'damn', 'hell', 'crap', 'suck', 'worst', 'terrible',
    'awful', 'horrible', 'disgusting', 'pathetic', 'loser', 'failure'
]

def calculate_spam_score(text):
    """Calculate spam score based on keyword matching"""
    text_lower = text.lower()
    found_keywords = []

    for keyword in SPAM_KEYWORDS:
        if keyword.lower() in text_lower:
            found_keywords.append(keyword)

    # Score based on number of keywords and text length
    base_score = len(found_keywords) * 0.15

    # Bonus for multiple keywords
    if len(found_keywords) > 1:
        base_score += 0.1

    # Check for suspicious patterns
    if re.search(r'\b\d{10,}\b', text):  # Long numbers (phone/account numbers)
        base_score += 0.2
    if re.search(r'\b\d+\$?\d*\b.*\b(?:dollar|usd|money|cash|prize)\b', text):  # Money amounts
        base_score += 0.15
    if '!' in text and text.count('!') > 2:  # Excessive exclamation marks
        base_score += 0.1
    if text.isupper() and len(text) > 10:  # ALL CAPS
        base_score += 0.1

    return min(base_score, 0.95), found_keywords

def calculate_toxicity_score(text):
    """Calculate toxicity score based on keyword matching"""
    text_lower = text.lower()
    found_toxic = []

    for keyword in TOXIC_KEYWORDS:
        if keyword.lower() in text_lower:
            found_toxic.append(keyword)

    # Score based on toxic keywords
    base_score = len(found_toxic) * 0.2

    # Check for repeated toxic words
    toxic_count = sum(1 for word in text_lower.split() if word in [k.lower() for k in TOXIC_KEYWORDS])
    if toxic_count > 1:
        base_score += 0.1

    return min(base_score, 0.9), found_toxic

class PredictRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        text = request.text

        # --- Spam Detection ---
        spam_score, found_spam_keywords = calculate_spam_score(text)
        spam_label_probs = {
            "spam": spam_score,
            "not_spam": 1.0 - spam_score
        }

        spam_explain = []
        if found_spam_keywords:
            spam_explain.append(f"Found {len(found_spam_keywords)} spam indicators: {', '.join(found_spam_keywords[:3])}")
        if spam_score > 0.3:
            spam_explain.append(f"Spam confidence: {spam_score:.2f}")

        # --- Toxicity Detection ---
        toxicity_score, found_toxic_keywords = calculate_toxicity_score(text)

        # Determine toxicity label based on score
        if toxicity_score > 0.6:
            tox_label = 'toxic'
        elif toxicity_score > 0.3:
            tox_label = 'unsafe'
        else:
            tox_label = 'safe'

        # Create all_scores for compatibility
        all_scores = {
            'safe': 1.0 - toxicity_score,
            'spam': 0.0,
            'toxic': toxicity_score if toxicity_score > 0.6 else 0.0,
            'misinformation': 0.0,
            'unsafe': toxicity_score if 0.3 < toxicity_score <= 0.6 else 0.0
        }

        toxicity_explain = []
        if found_toxic_keywords:
            toxicity_explain.append(f"Found toxic language: {', '.join(found_toxic_keywords)}")

        return {
            "spam_detection": {
                "label_probs": spam_label_probs,
                "explain": spam_explain,
                "keyword_analysis": {
                    "keyword_count": len(found_spam_keywords),
                    "found_keywords": found_spam_keywords,
                    "rule_triggered": len(found_spam_keywords) > 0
                }
            },
            "toxicity_detection": {
                "label": tox_label,
                "toxicity_score": toxicity_score,
                "confidence": toxicity_score,
                "all_scores": all_scores,
                "explain": toxicity_explain
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "spam_detection": "rule-based (active)",
        "toxicity_detection": "rule-based (active)",
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Spam & Toxicity Detection API v2.0",
        "endpoints": {
            "POST /predict": "Make prediction",
            "GET /docs": "API documentation"
        }
    }
