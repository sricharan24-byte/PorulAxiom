"""HTTP entry point for the PorulAxiom engine."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="PorulAxiom Engine",
    version="0.1.0",
    description="Foundation API for the PorulAxiom paper-trading platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=[],
)


@app.on_event("startup")
async def log_startup() -> None:
    """Record non-sensitive startup context."""

    logger.info("PorulAxiom engine starting in %s", settings.app_env)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return a dependency-free liveness response."""

    return {"status": "ok", "service": "porulaxiom-engine"}
