from typing import Any

from extensions import db
from models import Memorial


def get_all_memoriais():
    return Memorial.query.order_by(Memorial.createdAt.desc()).all()


def get_memorial_by_id(memorial_id: int):
    return Memorial.query.get(memorial_id)


def create_memorial(data: dict[str, Any], image_url: str | None = None, gallery_urls: list[str] | None = None):
    memorial = Memorial(
        nome=(data.get("nome") or "").strip(),
        biografia=(data.get("biografia") or "").strip() or None,
        descricao=(data.get("descricao") or "").strip() or None,
        dataNascimento=(data.get("dataNascimento") or "").strip() or None,
        dataMorte=(data.get("dataMorte") or "").strip() or None,
        localizacao=(data.get("localizacao") or "").strip() or None,
        tipo=data.get("tipo") or "historica",
        imagem=image_url,
        galeria=gallery_urls or [],
    )
    db.session.add(memorial)
    db.session.commit()
    return memorial


def update_memorial(memorial: Memorial, data: dict[str, Any], image_url: str | None = None, gallery_urls: list[str] | None = None):
    if data.get("nome") is not None:
        memorial.nome = (data.get("nome") or "").strip() or memorial.nome

    for field in ["biografia", "descricao", "dataNascimento", "dataMorte", "localizacao"]:
        if field in data:
            value = (data.get(field) or "").strip()
            setattr(memorial, field, value or None)

    if data.get("tipo") is not None:
        memorial.tipo = data.get("tipo") or memorial.tipo or "historica"

    if image_url is not None:
        memorial.imagem = image_url

    if gallery_urls is not None:
        memorial.galeria = gallery_urls

    db.session.commit()
    return memorial


def delete_memorial(memorial: Memorial):
    db.session.delete(memorial)
    db.session.commit()
