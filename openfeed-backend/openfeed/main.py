import logging
import uuid
from typing import Optional
from contextlib import asynccontextmanager

from pydantic import BaseModel
from fastapi.responses import Response
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.auth import verify_api_key
from openfeed.db.client import Client, client
from openfeed.services.articles.service import (
    refresh_articles_for_user,
    refresh_user_articles,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai._base_client").setLevel(logging.INFO)
logging.getLogger("openfeed.clients.openai_client.client").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)


db_client: Optional[Client] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client
    db_client = client()
    yield


app = FastAPI(dependencies=[Depends(verify_api_key)], lifespan=lifespan)


def get_db() -> Client:
    assert db_client is not None, "db_client not initialized"
    return db_client


def _run_with_logging(name: str, fn, *args) -> None:
    try:
        fn(*args)
    except Exception:
        logger.exception("Background task '%s' failed", name)


@app.post("/user/articles", status_code=202)
def user_articles_refresh(background_tasks: BackgroundTasks):
    logger.info("POST /user/articles - accepted, processing in background")
    db = get_db()
    background_tasks.add_task(
        _run_with_logging, "refresh_user_articles", refresh_user_articles, db
    )
    return Response(status_code=202)


class UserArticlesRefreshRequest(BaseModel):
    user_id: uuid.UUID


@app.post("/user/articles/refresh", status_code=202)
def user_articles_refresh_single(
    req: UserArticlesRefreshRequest, background_tasks: BackgroundTasks
):
    logger.info(
        "POST /user/articles/refresh user=%s - accepted, processing in background",
        req.user_id,
    )
    db = get_db()
    background_tasks.add_task(
        _run_with_logging,
        "refresh_articles_for_user",
        refresh_articles_for_user,
        db,
        req.user_id,
    )
    return Response(status_code=202)
