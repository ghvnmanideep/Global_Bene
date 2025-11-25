---
title: Hybrid Recommender API
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
app_file: main_api.py
pinned: false
---

# Hybrid Recommender – FastAPI (HuggingFace Space)

This Space hosts a **FastAPI-based hybrid recommendation engine** running inside a Docker container.

## 🚀 Endpoints

### `GET /`
Health check.

### `GET /recommendations/{user_id}`
Returns hybrid recommendations.  
If cache-miss → triggers background regeneration.

### `POST /recommendations/refresh/{user_id}`
Manually trigger refresh for a user.

---

## 🐳 Dockerized FastAPI Server

The app runs with:

