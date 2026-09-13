"""Plomberie HTTP. FOURNI : vous n'avez pas a modifier ce fichier.

Tout ce qui suit est du transport : formatage SSE, traduction des erreurs,
service du front. Votre travail est dans serveur.py.
"""
import json
import pathlib
import time

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from modele import ModeleIndisponible

FRONT = pathlib.Path(__file__).resolve().parents[1] / "front"


class RequeteInvalide(ValueError):
    """Entree du client refusee. Devient un 400 avec un corps JSON."""


def sse(objet):
    """Formate un evenement SSE. Les deux retours a la ligne sont obligatoires."""
    return f"data: {json.dumps(objet, ensure_ascii=False)}\n\n"


def fragment(texte):
    return sse({"delta": texte})


def fin(usage, debut):
    """Evenement de cloture, avec les compteurs exiges par le contrat."""
    return sse({
        "done": True,
        "usage": {
            "entree": usage.get("entree", 0),
            "sortie": usage.get("sortie", 0),
            "ms": int((time.perf_counter() - debut) * 1000),
        },
    })


async def flux_ou_503(generateur):
    """Ouvre un flux SSE, ou renvoie un 503 si le modele ne repond pas.

    Subtilite a connaitre : une fois le flux ouvert, le code HTTP est deja
    parti, et il est trop tard pour annoncer une erreur. On consomme donc le
    premier evenement AVANT de repondre. S'il echoue, on renvoie un vrai 503 ;
    sinon on ouvre le flux en replacant cet evenement en tete.
    """
    premier = None
    try:
        premier = await generateur.__anext__()
    except StopAsyncIteration:
        pass
    except ModeleIndisponible as e:
        print(f"[modele] {e}")
        return JSONResponse({"erreur": "modele indisponible"}, status_code=503)

    async def suite():
        if premier is not None:
            yield premier
        try:
            async for evenement in generateur:
                yield evenement
        except ModeleIndisponible as e:
            # Le flux est deja ouvert : on ne peut que le cloturer proprement.
            print(f"[modele] interrompu en cours de flux : {e}")

    return StreamingResponse(suite(), media_type="text/event-stream")


def creer_application():
    app = FastAPI(title="Assistant support", docs_url=None, redoc_url=None)

    @app.exception_handler(RequeteInvalide)
    async def _invalide(_requete: Request, exc: RequeteInvalide):
        return JSONResponse({"erreur": str(exc)}, status_code=400)

    @app.exception_handler(Exception)
    async def _imprevu(_requete: Request, exc: Exception):
        # On ne laisse jamais fuiter une trace d'execution vers le client.
        print(f"[erreur] {type(exc).__name__}: {exc}")
        return JSONResponse({"erreur": "erreur interne"}, status_code=500)

    return app


def servir_le_front(app):
    """A appeler en dernier : la racine attrape tout ce qui n'est pas une route."""
    app.mount("/", StaticFiles(directory=FRONT, html=True), name="front")
