from functools import wraps

from flask import Blueprint, jsonify, request

from helpers.auth_helpers import authenticate_admin
from helpers.file_helpers import save_uploaded_files
from models import Memorial
from services.memorial_service import create_memorial as create_memorial_service
from services.memorial_service import delete_memorial as delete_memorial_service
from services.memorial_service import get_all_memoriais, get_memorial_by_id, update_memorial as update_memorial_service

memorial_bp = Blueprint("memorials", __name__)


def require_admin(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if authenticate_admin() is None:
            return jsonify({"erro": "Token inválido ou expirado."}), 401
        return view_func(*args, **kwargs)

    return wrapped


@memorial_bp.route("/api/memoriais", methods=["GET"])
def list_memoriais():
    memoriais = get_all_memoriais()
    return jsonify([m.to_dict() for m in memoriais])


@memorial_bp.route("/api/memoriais/<int:id>", methods=["GET"])
def get_memorial(id):
    memorial = get_memorial_by_id(id)
    if not memorial:
        return jsonify({"erro": "Memorial não encontrado."}), 404
    return jsonify(memorial.to_dict())


@memorial_bp.route("/api/memoriais", methods=["POST"])
@require_admin
def create_memorial():
    data = request.form.to_dict() if request.form else request.get_json(silent=True) or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"erro": "O campo nome é obrigatório."}), 400

    image_url = None
    gallery_urls = []

    if "imagem" in request.files and request.files["imagem"].filename:
        image_url = save_uploaded_files([request.files["imagem"]], "")[0]

    if "galeria" in request.files:
        gallery_urls = save_uploaded_files(request.files.getlist("galeria"), "")

    if not image_url and data.get("imagem"):
        image_url = str(data.get("imagem")).strip() or None

    memorial = create_memorial_service(data, image_url=image_url, gallery_urls=gallery_urls)
    return jsonify(memorial.to_dict()), 201


@memorial_bp.route("/api/memoriais/<int:id>", methods=["PUT"])
@require_admin
def update_memorial(id):
    memorial = get_memorial_by_id(id)
    if not memorial:
        return jsonify({"erro": "Memorial não encontrado."}), 404

    data = request.form.to_dict() if request.form else request.get_json(silent=True) or {}

    image_url = None
    gallery_urls = None

    if request.files.get("imagem") and request.files["imagem"].filename:
        image_url = save_uploaded_files([request.files["imagem"]], "")[0]
    elif data.get("imagem") is not None:
        image_url = str(data.get("imagem")).strip() or memorial.imagem

    if request.files.get("galeria"):
        gallery_urls = save_uploaded_files(request.files.getlist("galeria"), "")

    memorial = update_memorial_service(memorial, data, image_url=image_url, gallery_urls=gallery_urls)
    return jsonify(memorial.to_dict())


@memorial_bp.route("/api/memoriais/<int:id>", methods=["DELETE"])
@require_admin
def delete_memorial(id):
    memorial = get_memorial_by_id(id)
    if not memorial:
        return jsonify({"erro": "Memorial não encontrado."}), 404

    delete_memorial_service(memorial)
    return jsonify({"mensagem": "Memorial removido com sucesso."})
