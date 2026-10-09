from datetime import datetime

from extensions import db


class Memorial(db.Model):
    __tablename__ = "memorials"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    biografia = db.Column(db.Text, nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    dataNascimento = db.Column(db.String(80), nullable=True)
    dataMorte = db.Column(db.String(80), nullable=True)
    localizacao = db.Column(db.String(255), nullable=True)
    tipo = db.Column(db.String(50), nullable=False, default="historica")
    imagem = db.Column(db.String(500), nullable=True)
    galeria = db.Column(db.JSON, nullable=False, default=list)
    createdAt = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "biografia": self.biografia,
            "descricao": self.descricao,
            "dataNascimento": self.dataNascimento,
            "dataMorte": self.dataMorte,
            "localizacao": self.localizacao,
            "tipo": self.tipo,
            "imagem": self.imagem,
            "galeria": self.galeria or [],
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
        }
