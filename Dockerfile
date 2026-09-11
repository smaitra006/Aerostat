# Use the official Microsoft Playwright image based on Ubuntu Jammy (22.04)
# This ensures all system dependencies for headless Chromium are pre-installed.
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

# Set environment variables to avoid python buffering and write bytecode
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port Uvicorn will run on
EXPOSE 8000

# Start the FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
