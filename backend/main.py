from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import os
import json
import shutil
from datetime import datetime
import uuid

app = FastAPI()

# Configurar CORS para permitir peticiones del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorios necesarios
os.makedirs("uploads", exist_ok=True)
os.makedirs("data", exist_ok=True)

ENTRIES_FILE = "data/entries.json"

def clasificar_archivo(filename):
    extension = os.path.splitext(filename)[1].lower().replace('.', '')
    
    if extension in ['mp3', 'wav', 'ogg', 'm4a']:
        return 'audio'
    elif extension in ['mp4', 'avi', 'mov', 'mkv']:
        return 'video'
    elif extension in ['jpg', 'jpeg', 'png', 'gif']:
        return 'imagen'
    elif extension in ['pdf', 'doc', 'docx', 'txt']:
        return 'documento'
    elif extension in ['xls', 'xlsx', 'csv']:
        return 'hoja_calculo'
    else:
        return 'otros'

def load_entries():
    if os.path.exists(ENTRIES_FILE):
        with open(ENTRIES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"inbox": [], "processed": []}

def save_entries(entries):
    with open(ENTRIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

@app.post("/api/capture/text")
async def capture_text(content: str = Form(...), tipo: str = Form("nota")):
    entries = load_entries()
    
    new_entry = {
        "id": str(uuid.uuid4()),
        "tipo": tipo,
        "contenido": content,
        "fecha": datetime.now().isoformat(),
        "estado": "inbox"
    }
    
    entries["inbox"].append(new_entry)
    save_entries(entries)
    
    return {"success": True, "entry": new_entry}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    tipo = clasificar_archivo(file.filename)
    
    # Guardar archivo
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = f"uploads/{file_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Guardar entrada
    entries = load_entries()
    new_entry = {
        "id": str(uuid.uuid4()),
        "tipo": tipo,
        "nombre_original": file.filename,
        "archivo": file_name,
        "ruta": file_path,
        "tamano": os.path.getsize(file_path),
        "fecha": datetime.now().isoformat(),
        "estado": "inbox"
    }
    
    entries["inbox"].append(new_entry)
    save_entries(entries)
    
    return {"success": True, "entry": new_entry}

@app.get("/api/entries/inbox")
async def get_inbox():
    entries = load_entries()
    return entries["inbox"]

@app.get("/api/entries/processed")
async def get_processed():
    entries = load_entries()
    return entries["processed"]

@app.post("/api/entries/process/{entry_id}")
async def process_entry(entry_id: str):
    entries = load_entries()
    
    for i, entry in enumerate(entries["inbox"]):
        if entry["id"] == entry_id:
            entry["estado"] = "processed"
            entry["fecha_procesado"] = datetime.now().isoformat()
            entries["processed"].append(entry)
            entries["inbox"].pop(i)
            save_entries(entries)
            return {"success": True, "entry": entry}
    
    return {"success": False, "message": "Entrada no encontrada"}, 404

@app.delete("/api/entries/{entry_id}")
async def delete_entry(entry_id: str):
    entries = load_entries()
    
    # Buscar en inbox
    for i, entry in enumerate(entries["inbox"]):
        if entry["id"] == entry_id:
            # Eliminar archivo si existe
            if "ruta" in entry and os.path.exists(entry["ruta"]):
                os.remove(entry["ruta"])
            entries["inbox"].pop(i)
            save_entries(entries)
            return {"success": True}
    
    # Buscar en processed
    for i, entry in enumerate(entries["processed"]):
        if entry["id"] == entry_id:
            if "ruta" in entry and os.path.exists(entry["ruta"]):
                os.remove(entry["ruta"])
            entries["processed"].pop(i)
            save_entries(entries)
            return {"success": True}
    
    return {"success": False, "message": "Entrada no encontrada"}, 404

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)