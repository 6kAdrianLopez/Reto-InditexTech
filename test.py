from dotenv import load_dotenv
import os
import anthropic
import fastapi
import uvicorn

load_dotenv()

key = os.getenv("ANTHROPIC_API_KEY")

print("=== CHECK DEL ENTORNO ===")

if key:
    print("✅ API key de Claude encontrada")
else:
    print("❌ API key NO encontrada - revisad el .env")

print(f"✅ anthropic instalado")
print(f"✅ fastapi instalado")
print(f"✅ uvicorn instalado")
print(f"✅ python-dotenv instalado")
print("========================")
print("🚀 Todo listo para arrancar!")