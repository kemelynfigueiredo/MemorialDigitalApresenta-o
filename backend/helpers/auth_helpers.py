import time

import bcrypt
import jwt
from flask import current_app, g, request


LOGIN_WINDOW_MS = 15 * 60 * 1000
MAX_LOGIN_ATTEMPTS = 5
LOGIN_ATTEMPTS = {}


def verify_password(password: str) -> bool:
    stored_hash = current_app.config.get("ADMIN_PASSWORD_HASH")
    if not stored_hash:
        return False
    return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))


def build_admin_token(email: str) -> str:
    return jwt.encode(
        {"email": email, "role": "admin"},
        current_app.config["JWT_SECRET"],
        algorithm="HS256",
    )


def get_login_attempt_state(ip: str):
    return LOGIN_ATTEMPTS.get(ip)


def update_login_attempt(ip: str):
    now = time.time() * 1000
    current = LOGIN_ATTEMPTS.get(ip)
    LOGIN_ATTEMPTS[ip] = {
        "count": (current["count"] if current else 0) + 1,
        "firstAttempt": current["firstAttempt"] if current else now,
    }


def reset_login_attempt(ip: str):
    LOGIN_ATTEMPTS.pop(ip, None)


def authenticate_admin():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

    if payload.get("role") != "admin":
        return None

    g.admin = payload
    return payload
