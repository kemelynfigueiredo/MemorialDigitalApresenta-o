import os

import bcrypt
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH") or bcrypt.hashpw(
    ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()
).decode("utf-8")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "memorial-secret-key")
    JWT_SECRET = os.getenv("JWT_SECRET", "memorial-jwt-secret")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@memorial.com")
    ADMIN_PASSWORD = ADMIN_PASSWORD
    ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or f"sqlite:///{os.path.join(BASE_DIR, 'memorial.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    UPLOAD_FOLDER = UPLOAD_DIR
