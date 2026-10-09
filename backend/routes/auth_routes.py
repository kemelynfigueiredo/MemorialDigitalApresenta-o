from flask import Blueprint, jsonify, request

from helpers.auth_helpers import build_admin_token
from models import Memorial
from services.auth_service import check_admin_login


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/teste-banco", methods=["GET"])
def health_check():
    try:
        quantidade = Memorial.query.count()
        return jsonify({"bancoConectado": True, "quantidadeDeMemoriais": quantidade}), 200
    except Exception as exc:
        return jsonify({"bancoConectado": False, "erro": str(exc)}), 500


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    ip = request.remote_addr or "unknown"

    result = check_admin_login(email, password, ip)

    if result.get("blocked"):
        return jsonify({"message": "Muitas tentativas. Tente novamente mais tarde."}), 429

    if result.get("success"):
        token = build_admin_token(email)
        return jsonify({"success": True, "token": token}), 200

    return jsonify({"success": False, "message": "Credenciais inválidas."}), 401
