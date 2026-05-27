import logging
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
from uuid import UUID

from fastapi.responses import Response
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.auth import verify_api_key
from openfeed.db.client import Client, client
from openfeed.db.global_stories import get_stories_with_topics
from openfeed.db.user_stories_hidden import get_hidden_story_ids
from openfeed.db.user_topic_preferences import get_user_preferences
from openfeed.clients.iptc.taxonomy import Taxonomy, load_taxonomy
from openfeed.services.extraction import top_stories
from openfeed.services.ingestion import fetch_articles, delete_old_articles
from openfeed.services.preference_scoring import rank_stories

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("openai._base_client").setLevel(logging.INFO)
logging.getLogger("openfeed.clients.openai_client.client").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)


db_client: Optional[Client] = None
taxonomy: Optional[Taxonomy] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client, taxonomy
    db_client = client()
    taxonomy = load_taxonomy(Path(__file__).parent / "iptc" / "taxonomy.json")
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


def get_taxonomy() -> Taxonomy:
    assert taxonomy is not None, "taxonomy not initialized"
    return taxonomy


# TODO: Break this up into separate endpoints.
@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    logger.info("POST /global/articles - accepted, processing in background")
    db = get_db()
    background_tasks.add_task(_run_with_logging, "fetch_articles", fetch_articles, db)
    background_tasks.add_task(_run_with_logging, "top_stories", top_stories, db)
    # background_tasks.add_task(_run_with_logging, "notify_users", notify_users, db)
    return Response(status_code=202)


@app.post("/feed/{user_id}")
def get_user_feed(user_id: UUID):
    db = get_db()
    hidden_ids = get_hidden_story_ids(db, user_id)
    stories = get_stories_with_topics(db, excluded_story_ids=hidden_ids)
    preferences = get_user_preferences(db, user_id)
    ranked = rank_stories(stories, preferences, get_taxonomy())
    return [
        {
            **s.story_with_topics.story.model_dump(mode="json"),
            "medtop_ids": s.story_with_topics.topic_ids,
            "medtop_names": s.story_with_topics.topic_names,
            "final_score": s.final_score,
        }
        for s in ranked
    ]


# @app.post("/notify", status_code=202)
# def notify(background_tasks: BackgroundTasks):
#     Disabled until feed personalisation is stable.
#     logger.info("POST /notify - accepted, processing in background")
#     db = get_db()
#     background_tasks.add_task(_run_with_logging, "notify_users", notify_users, db)
#     return Response(status_code=202)


@app.delete("/global/articles", status_code=202)
def global_articles_delete():
    logger.info("DELETE /global/articles - deleting old articles")
    return delete_old_articles(get_db())
