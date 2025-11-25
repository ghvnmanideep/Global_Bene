from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI(title="Autotag API", version="1.0")

# -------------------------------
# Load Model + MultiLabelBinarizer
# -------------------------------
bundle = joblib.load("model/autotag_model.pkl")
model = bundle["model"]
mlb = bundle["mlb"]

# SBERT Encoder
sbert = SentenceTransformer("all-MiniLM-L6-v2")

# Input Schema
class InputText(BaseModel):
    text: str


@app.get("/")
def home():
    return {"message": "Autotag API is running!"}


@app.post("/predict")
def predict(data: InputText):
    text = data.text

    # 1) Encode text → embedding vector
    emb = sbert.encode([text], convert_to_numpy=True)

    # 2) Predict probabilities for each label
    probs = model.predict_proba(emb)[0]

    # 3) Combine tag names + scores
    tag_scores = list(zip(mlb.classes_, probs))

    # 4) Sort high → low
    tag_scores = sorted(tag_scores, key=lambda x: x[1], reverse=True)

    # 5) Filter relevant tags
    threshold = 0.05
    tag_scores = [(t, float(s)) for t, s in tag_scores if s >= threshold]

    # 6) Convert to JSON format
    all_tags_dict = {tag: round(score, 4) for tag, score in tag_scores}

    response = {
        "results": [
            {
                "input_text": text,
                "all_tags": all_tags_dict
            }
        ]
    }

    return response
