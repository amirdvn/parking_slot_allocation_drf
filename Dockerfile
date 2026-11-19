# 1. Select the base Python image
FROM python:3.14-slim

# 2. Configure Python environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Copy the dependencies file
COPY requirements.txt .

# 5. Install project dependencies
RUN python -m pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 6. Copy the project source code
COPY . .

# 7. Expose the application port
EXPOSE 8000

# 8. Set the default Django startup command
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]