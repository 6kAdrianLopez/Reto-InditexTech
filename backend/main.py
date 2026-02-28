from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    a = 2
    b = 3
    c = a + b
    return {"message": c}