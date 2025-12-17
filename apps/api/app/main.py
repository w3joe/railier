from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import init_db
from app.api import router as api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("API will run without database support")
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.app_name,
    description="Visual drag-and-drop guardrail builder for LLMs",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Railier API",
        "docs": "/docs",
        "health": "/health",
    }
