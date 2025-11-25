from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# -------------------------------
# 1. FastAPI setup
# -------------------------------
app = FastAPI(
    title="Spam & Toxicity Detection API",
    version="3.0.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 2. Load models
# -------------------------------
print("🔄 Loading models...")

spam_model = None
tfidf_vectorizer = None
spam_keywords = []
keyword_threshold = 2

try:
    with open("spam_detection_model.pkl", "rb") as f:
        spam_artifacts = pickle.load(f)

    spam_model = spam_artifacts.get("model")
    tfidf_vectorizer = spam_artifacts.get("tfidf_vectorizer")
    spam_keywords = spam_artifacts.get("spam_keywords", [])
    keyword_threshold = spam_artifacts.get("keyword_threshold", 2)

    if spam_model and tfidf_vectorizer:
        print("✅ Spam model & vectorizer loaded successfully")
    else:
        print("⚠️ Missing model/vectorizer in pickle file")

except Exception as e:
    print(f"❌ Spam model load error: {e}")

# Load DistilBERT toxicity model
toxicity_model = None
toxicity_tokenizer = None
toxicity_labels = ["safe", "spam", "toxic", "misinformation", "unsafe"]

try:
    toxicity_model = AutoModelForSequenceClassification.from_pretrained("toxicity_model_final")
    toxicity_tokenizer = AutoTokenizer.from_pretrained("toxicity_model_final")
    toxicity_model.to("cpu")
    toxicity_model.eval()
    print("✅ Toxicity model loaded successfully")
except Exception as e:
    print(f"❌ Toxicity model load error: {e}")

# -------------------------------
# 3. Request schema
# -------------------------------
class PredictRequest(BaseModel):
    text: str

# -------------------------------
# 4. Prediction helper functions
# -------------------------------
def extract_text_features(text: str):
    features = {
        'exclamation_count': text.count('!'),
        'question_count': text.count('?'),
        'uppercase_ratio': sum(1 for c in text if c.isupper()) / (len(text) + 1),
        'word_count': len(text.split()),
        'char_count': len(text),
        'spam_keyword_count': sum(1 for kw in spam_keywords if kw.lower() in text.lower()),
        'has_url': int("http" in text.lower() or "www" in text.lower()),
        'has_currency': int(any(c in text for c in ["$", "€", "£", "₹"])),
        'has_numbers': int(any(c.isdigit() for c in text)),
    }
    return features

# -------------------------------
# 5. API endpoint: /predict
# -------------------------------
@app.post("/predict")
async def predict(request: PredictRequest):
    text = request.text.strip()
    explain = []

    # --- Spam Detection ---
    spam_prob, not_spam_prob = 0.0, 1.0
    found_keywords = [kw for kw in spam_keywords if kw.lower() in text.lower()]
    keyword_rule_triggered = len(found_keywords) >= keyword_threshold

    try:
        if spam_model and tfidf_vectorizer:
            # Combine text-based and TF-IDF features
            tfidf_vec = tfidf_vectorizer.transform([text]).toarray()
            extra_feats = extract_text_features(text)
            extra_vec = np.array([[extra_feats[k] for k in extra_feats]])
            input_features = np.concatenate((extra_vec, tfidf_vec), axis=1)

            spam_prob = float(spam_model.predict_proba(input_features)[0][1])
            not_spam_prob = 1 - spam_prob
        else:
            explain.append("Spam model or vectorizer not loaded properly.")
    except Exception as e:
        explain.append(f"Spam model error: {e}")

    # Rule override
    if keyword_rule_triggered and spam_prob < 0.5:
        spam_prob = 0.95
        not_spam_prob = 0.05
        explain.append("KEYWORD RULE OVERRIDE: Spam keywords detected")

    spam_result = {
        "label_probs": {
            "spam": round(spam_prob, 2),
            "not_spam": round(not_spam_prob, 2)
        },
        "explain": explain,
        "keyword_analysis": {
            "keyword_count": len(found_keywords),
            "found_keywords": found_keywords,
            "rule_triggered": keyword_rule_triggered
        }
    }

    # --- Toxicity Detection ---
    try:
        inputs = toxicity_tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=128,
            return_tensors="pt"
        )

        with torch.no_grad():
            outputs = toxicity_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)[0].tolist()

        pred_idx = int(torch.argmax(torch.tensor(probs)))
        label = toxicity_labels[pred_idx]
        confidence = round(probs[pred_idx], 4)
        all_scores = {toxicity_labels[i]: round(p, 4) for i, p in enumerate(probs)}

        toxicity_result = {
            "label": label,
            "toxicity_score": confidence,
            "confidence": confidence,
            "all_scores": all_scores
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Toxicity model error: {e}")

    return {
        "text": text,
        "spam_detection": spam_result,
        "toxicity_detection": toxicity_result
    }

# -------------------------------
# 6. Health check
# -------------------------------
@app.get("/health")
async def health():
    return {
        "status": "healthy" if spam_model and tfidf_vectorizer and toxicity_model else "unhealthy",
        "spam_model_loaded": spam_model is not None,
        "vectorizer_loaded": tfidf_vectorizer is not None,
        "toxicity_model_loaded": toxicity_model is not None
    }

# -------------------------------
# 7. Root endpoint
# -------------------------------
@app.get("/")
async def root():
    return {
        "message": "Spam & Toxicity Detection API v3.0",
        "endpoints": {
            "POST /predict": "Run a text prediction",
            "GET /health": "Check model load status",
            "GET /docs": "Swagger UI documentation"
        }
    }

# -------------------------------
# 8. Run locally
# -------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
