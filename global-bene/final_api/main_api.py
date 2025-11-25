# main_api.py

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import logging
import uvicorn

from topk_hybrid_advanced import get_recommender
from tasks import refresh_single_user_recommendations  # direct call (no Celery)

app = FastAPI()
logger = logging.getLogger(__name__)

recommender = None


@app.on_event("startup")
async def startup_event():
    """Initialize recommender on startup."""
    global recommender
    recommender = get_recommender()
    logger.info("Recommender initialized successfully.")


@app.get("/")
def root():
    return {"status": "API running on HuggingFace!"}


def background_refresh(user_id: str):
    """Heavy refresh without Celery (HuggingFace Spaces limitation)."""
    try:
        refresh_single_user_recommendations(user_id)
    except Exception as e:
        print("Background refresh failed:", e)


def clean_and_top_k(recommendations: list, k: int = 10):
    """Cleans recommendation list and returns top-k."""
    if not recommendations:
        return []

    # Remove invalid scores
    cleaned = [
        r for r in recommendations
        if isinstance(r.get("score"), (int, float)) and r["score"] > 0
    ]

    # Drop duplicates, keep highest score
    unique = {}
    for r in cleaned:
        item = r["item_id"]
        score = r["score"]
        if item not in unique or score > unique[item]["score"]:
            unique[item] = r

    # Sort by score
    sorted_recs = sorted(unique.values(), key=lambda x: x["score"], reverse=True)

    # Limit to K
    limited = sorted_recs[:k]

    # Add ranks
    for idx, r in enumerate(limited, start=1):
        r["rank"] = idx

    return limited


@app.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str, background_tasks: BackgroundTasks):
    try:
        result = recommender.get_hybrid_recommendations(user_id)

        # Cache hit or cold-start
        if result.get("recommendations") is not None:
            top10 = clean_and_top_k(result["recommendations"], 10)

            return JSONResponse({
                "user_id": user_id,
                "recommendations": top10,
                "source": result.get("source"),
                "strategy": result.get("strategy"),
            })

        # Cache miss → generate in background
        background_tasks.add_task(background_refresh, user_id)

        return JSONResponse(
            status_code=202,
            content={
                "user_id": user_id,
                "status": "generating",
                "message": "Background generation started. Try again in a few seconds.",
                "source": "background",
            },
        )

    except Exception as e:
        logger.exception(f"Error in recommendation API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations/refresh/{user_id}")
async def manual_refresh(user_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(background_refresh, user_id)
    return {"status": "queued", "user_id": user_id}


# ✔ Required for HuggingFace Spaces (runs API server)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
