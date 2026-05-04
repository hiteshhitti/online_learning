from fastapi import FastAPI, Request, UploadFile, File, Header
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.routes import users, courses, orders, dashboard, enquiry, admin, members, batches
import os, shutil, uuid

app = FastAPI(title="LearnHub API", version="1.0.0")

# ── Uploads folder ────────────────────────────────────────────────────────────
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

ALLOWED_ORIGIN = "http://localhost:3000"

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return JSONResponse(
            content={},
            headers={
                "Access-Control-Allow-Origin":      ALLOWED_ORIGIN,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods":     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers":     "Content-Type, Authorization, X-Admin-Token",
                "Access-Control-Max-Age":           "600",
            },
        )

    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"]      = ALLOWED_ORIGIN
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"]     = "Content-Type, Authorization, X-Admin-Token"
    return response


# ── Image upload endpoint ─────────────────────────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5

@app.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    x_admin_token: str = Header(None, alias="x-admin-token"),
):
    from jose import jwt, JWTError
    from app.utils.auth import ADMIN_SECRET, ALGORITHM
    if not x_admin_token:
        return JSONResponse(status_code=401, content={"detail": "Admin token required"})
    try:
        payload = jwt.decode(x_admin_token, ADMIN_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            return JSONResponse(status_code=403, content={"detail": "Not an admin"})
    except JWTError:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired admin token"})

    if file.content_type not in ALLOWED_TYPES:
        return JSONResponse(status_code=400, content={"detail": "Only JPG, PNG, WebP and GIF images are allowed"})

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        return JSONResponse(status_code=400, content={"detail": f"File too large. Max size is {MAX_SIZE_MB}MB"})

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return {"url": f"http://localhost:8000/uploads/{filename}"}


app.include_router(users.router,     prefix="/users",     tags=["Users"])
app.include_router(courses.router,   prefix="/courses",   tags=["Courses"])
app.include_router(orders.router,    prefix="/orders",    tags=["Orders"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(enquiry.router,   prefix="/enquiry",   tags=["Enquiry"])
app.include_router(admin.router,     prefix="/admin",     tags=["Admin"])
app.include_router(members.router,   prefix="/members",   tags=["Members"])
app.include_router(batches.router,   prefix="/batches",   tags=["Batches"])   # ← new
