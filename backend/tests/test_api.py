import os

import pytest

os.environ["ADMIN_EMAIL"] = "admin@memorial.com"
os.environ["ADMIN_PASSWORD"] = "admin123"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        from extensions import db
        db.create_all()
    with app.test_client() as client:
        yield client


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.get_json()["mensagem"] == "API do Memorial Digital funcionando."


def test_login_success(client):
    response = client.post("/api/login", json={"email": "admin@memorial.com", "password": "admin123"})
    assert response.status_code == 200
    assert "token" in response.get_json()


def test_list_memoriais_empty(client):
    response = client.get("/api/memoriais")
    assert response.status_code == 200
    assert response.get_json() == []
