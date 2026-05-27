import re
import unicodedata

import spacy
from spacy.tokens import Span

_nlp = spacy.load("en_core_web_trf")


_ENTITY_TYPES = {"PERSON", "ORG", "GPE", "LOC", "EVENT", "PRODUCT"}


def _preprocess(text: str) -> str:
    """Normalize text before NER: unicode, parentheticals, whitespace."""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\(.*?\)", "", text)  # remove parenthetical asides e.g. (NYSE: AAPL)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _lemmatize_entity(ent: Span) -> str:
    """Lemmatize each token in an entity span and rejoin."""
    return " ".join(token.lemma_ for token in ent).strip()


def extract_entities(summary: str) -> list[str]:
    """
    Extract named entities from a summary string using spaCy NER.

    Preprocessing is applied before NER to normalize unicode, strip
    parentheticals, and clean whitespace. Entity tokens are lemmatized
    after extraction to normalize to their root forms. Deduplication is
    case-insensitive.
    """
    clean = _preprocess(summary)
    doc = _nlp(clean)

    seen: set[str] = set()
    entities: list[str] = []

    for ent in doc.ents:
        if ent.label_ not in _ENTITY_TYPES:
            continue
        lemmatized = _lemmatize_entity(ent)
        if lemmatized and lemmatized.lower() not in seen:
            seen.add(lemmatized.lower())
            entities.append(lemmatized)

    return entities
