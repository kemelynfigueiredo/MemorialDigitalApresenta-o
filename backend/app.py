import os

from flask import Flask, jsonify, send_from_directory

from config import Config
from extensions import cors, db
from helpers.database import init_database


class FlaskAppConfig(Config):
    pass


def create_app():
    app = Flask(__name__)
    app.config.from_object(FlaskAppConfig)

    db.init_app(app)
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    origin.strip()
                    for origin in app.config["CORS_ORIGINS"].split(",")
                    if origin.strip()
                ]
            }
        },
        supports_credentials=True,
    )

    app.static_folder = app.config["UPLOAD_FOLDER"]
    app.static_url_path = "/uploads"

    from routes.auth_routes import auth_bp
    from routes.memorial_routes import memorial_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(memorial_bp)

    @app.route("/")
    def index():
        return jsonify({"mensagem": "API do Memorial Digital funcionando."})

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.before_request
    def startup_db():
        if not app.config.get("_db_initialized"):
            init_database(app)
            app.config["_db_initialized"] = True

    @app.errorhandler(400)
    def handle_bad_request(error):
        return jsonify({"erro": getattr(error, "description", "Requisição inválida.")}), 400

    @app.errorhandler(401)
    def handle_unauthorized(error):
        return jsonify({"erro": getattr(error, "description", "Não autorizado.")}), 401

    @app.errorhandler(403)
    def handle_forbidden(error):
        return jsonify({"erro": getattr(error, "description", "Acesso não autorizado.")}), 403

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({"erro": getattr(error, "description", "Recurso não encontrado.")}), 404

    @app.errorhandler(500)
    def handle_server_error(error):
        return jsonify({"erro": "Erro interno do servidor."}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "3001")), debug=True)
