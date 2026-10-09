import time

import bcrypt
from flask import current_app

from helpers.auth_helpers import LOGIN_ATTEMPTS, LOGIN_WINDOW_MS, MAX_LOGIN_ATTEMPTS, reset_login_attempt, update_login_attempt


def check_admin_login(email: str, password: str, ip: str):
    attempts = LOGIN_ATTEMPTS.get(ip)
    now = time.time() * 1000

    if attempts and now - attempts["firstAttempt"] < LOGIN_WINDOW_MS:
        if attempts["count"] >= MAX_LOGIN_ATTEMPTS:
            retry_after = int((LOGIN_WINDOW_MS - (now - attempts["firstAttempt"])) / 1000)
            return {"blocked": True, "retry_after": retry_after}
    elif attempts:
        reset_login_attempt(ip)

    password_matches = isinstance(password, str) and bcrypt.checkpw(
        password.encode("utf-8"), current_app.config["ADMIN_PASSWORD_HASH"].encode("utf-8")
    )

    if email == current_app.config["ADMIN_EMAIL"] and password_matches:
        reset_login_attempt(ip)
        return {"success": True}

    update_login_attempt(ip)
    return {"success": False}
