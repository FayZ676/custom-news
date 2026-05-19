import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi.responses import Response
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.auth import verify_api_key
from openfeed.db.client import Client, client
from openfeed.services.extraction import top_stories
from openfeed.services.notifications import notify_users
from openfeed.services.ingestion import fetch_articles, delete_old_articles


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai._base_client").setLevel(logging.WARNING)
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


# TODO: Break this up into separate endpoints.
@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    logger.info("POST /global/articles - accepted, processing in background")
    db = get_db()
    background_tasks.add_task(_run_with_logging, "fetch_articles", fetch_articles, db)
    background_tasks.add_task(_run_with_logging, "top_stories", top_stories, db)
    background_tasks.add_task(_run_with_logging, "notify_users", notify_users, db)
    return Response(status_code=202)


@app.post("/notify", status_code=202)
def notify(background_tasks: BackgroundTasks):
    logger.info("POST /notify - accepted, processing in background")
    db = get_db()
    background_tasks.add_task(_run_with_logging, "notify_users", notify_users, db)
    return Response(status_code=202)


@app.delete("/global/articles", status_code=202)
def global_articles_delete():
    logger.info("DELETE /global/articles - deleting old articles")
    return delete_old_articles(get_db())
