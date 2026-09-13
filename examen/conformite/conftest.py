"""Outillage commun de la suite de conformite.

La suite n'interroge que du HTTP : elle donne le meme verdict que le serveur
de l'etudiant soit en FastAPI, en Express, en Symfony ou en Go.

Usage :
    BASE_URL=http://localhost:3000 pytest examen/conformite

Le contrat teste est decrit dans app/CONTRAT.md, qui fait foi.
"""
import json
import os

import httpx
import pytest

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
DELAI = float(os.environ.get("DELAI", "60"))


def pytest_configure(config):
    config.addinivalue_line("markers", "s9: route /api/resumer, seance 9")
    config.addinivalue_line("markers", "s10: route /api/assistant, seance 10")
    config.addinivalue_line("markers", "s13: route /api/documents, seance 13")


@pytest.fixture(scope="session", autouse=True)
def serveur():
    """Verifie que le serveur de l'etudiant repond avant de lancer quoi que ce soit."""
    try:
        httpx.get(BASE_URL, timeout=5)
    except httpx.HTTPError as e:
        pytest.exit(
            f"\nAucun serveur ne repond sur {BASE_URL} ({e}).\n"
            f"Lancez votre serveur, puis relancez :\n"
            f"  BASE_URL=http://localhost:3000 pytest examen/conformite\n",
            returncode=2,
        )
    return BASE_URL


class Flux:
    """Le resultat d'un appel a une route SSE, decoupe en evenements."""

    def __init__(self, reponse, brut, evenements):
        self.reponse = reponse
        self.brut = brut
        self.evenements = evenements

    @property
    def code(self):
        return self.reponse.status_code

    @property
    def type_contenu(self):
        return self.reponse.headers.get("content-type", "")

    @property
    def fragments(self):
        return [e for e in self.evenements if "delta" in e]

    @property
    def texte(self):
        return "".join(e["delta"] for e in self.fragments)

    @property
    def final(self):
        finaux = [e for e in self.evenements if e.get("done") is True]
        return finaux[-1] if finaux else None


def appeler_sse(chemin, charge):
    """POST sur une route SSE. Renvoie un Flux, meme si la reponse est une erreur."""
    with httpx.Client(timeout=DELAI) as client:
        with client.stream("POST", f"{BASE_URL}{chemin}", json=charge) as reponse:
            brut = "".join(reponse.iter_text())
    evenements = []
    for ligne in brut.splitlines():
        if ligne.startswith("data: "):
            charge_utile = ligne[6:].strip()
            if charge_utile and charge_utile != "[DONE]":
                try:
                    evenements.append(json.loads(charge_utile))
                except json.JSONDecodeError:
                    pytest.fail(f"evenement SSE illisible : {ligne!r}")
    return Flux(reponse, brut, evenements)


def appeler(chemin, charge):
    """POST classique, pour les cas d'erreur qui doivent renvoyer du JSON."""
    with httpx.Client(timeout=DELAI) as client:
        return client.post(f"{BASE_URL}{chemin}", json=charge)


def exiger_route(chemin):
    """Passe le test si la route n'existe pas encore : elle releve d'une seance ulterieure.

    404 quand rien ne repond, 405 quand un service de fichiers statiques occupe
    la racine et refuse le POST : les deux signifient "pas encore ecrite".
    """
    if appeler(chemin, {}).status_code in (404, 405):
        pytest.skip(f"{chemin} n'est pas encore implementee")
