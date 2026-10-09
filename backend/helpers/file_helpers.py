import os

from flask import current_app


def save_uploaded_file(file_storage, subfolder="") -> str | None:
    if file_storage is None or not file_storage.filename:
        return None

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    if subfolder:
        upload_dir = os.path.join(upload_dir, subfolder)
        os.makedirs(upload_dir, exist_ok=True)

    filename = f"{os.urandom(8).hex()}_{file_storage.filename}"
    path = os.path.join(upload_dir, filename)
    file_storage.save(path)
    return f"/uploads/{filename}"


def save_uploaded_files(files, subfolder="") -> list[str]:
    if not files:
        return []

    uploaded_paths = []
    for file_storage in files:
        url = save_uploaded_file(file_storage, subfolder)
        if url:
            uploaded_paths.append(url)
    return uploaded_paths
