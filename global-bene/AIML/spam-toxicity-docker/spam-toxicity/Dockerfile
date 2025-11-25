# Use a lightweight Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy dependency file first (for layer caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copy the rest of your app (models, scripts, etc.)
COPY . .

# Render automatically assigns PORT=10000
EXPOSE 10000

# Start the FastAPI app using Uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "10000"]
