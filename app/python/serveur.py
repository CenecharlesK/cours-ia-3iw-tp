"""Squelette du serveur, voie Python (FastAPI).

Le transport est ecrit (transport.py) et le client du modele aussi (modele.py).
Votre travail tient dans les TODO ci-dessous.

Lancement :
    cd app/python && pip install -r requirements.txt
    uvicorn serveur:app --reload --port 3000

Puis ouvrez http://localhost:3000 et verifiez avec :
    BASE_URL=http://localhost:3000 pytest examen/conformite
"""
import time

from donnees import charger_documents, chercher_commande
from fastapi import Request
from fastapi.responses import JSONResponse
from modele import ModeleIndisponible, appeler, plonger, streamer
from transport import (
    RequeteInvalide,
    creer_application,
    fin,
    flux_ou_503,
    fragment,
    servir_le_front,
)

app = creer_application()

TONS = {"neutre", "direct"}
LONGUEUR_MAX = 20_000


# =====================================================================
# TODO 1 : valider l'entree du client
# =====================================================================
def valider_resumer(corps):
    """Renvoie (texte, ton) ou leve RequeteInvalide.

    Le contrat exige un 400 pour : texte absent, vide, non textuel, de plus de
    20 000 caracteres, et pour un ton qui n'est ni 'neutre' ni 'direct'.
    L'absence de 'ton' vaut 'neutre'.
    """
    raise NotImplementedError("TODO 1 : valider corps['texte'] et corps['ton']")


# =====================================================================
# TODO 2 : assembler le prompt, cote serveur et nulle part ailleurs
# =====================================================================
def prompt_resumer(texte, ton):
    """Renvoie la liste de messages envoyee au modele.

    Rappel de la seance 5 : un role, un contexte, un format montre.
    Le texte du client est une DONNEE, jamais une consigne : gardez-le dans un
    message 'user' distinct de la consigne systeme.
    """
    raise NotImplementedError("TODO 2 : construire les messages")


@app.post("/api/resumer")
async def resumer(requete: Request):
    debut = time.perf_counter()

    try:
        corps = await requete.json()
    except ValueError as e:
        raise RequeteInvalide("corps JSON illisible") from e
    if not isinstance(corps, dict):
        raise RequeteInvalide("corps JSON invalide")

    texte, ton = valider_resumer(corps)
    messages = prompt_resumer(texte, ton)

    async def flux():
        usage = {}
        # =============================================================
        # TODO 3 et 4 : appeler le modele et relayer chaque fragment
        # =============================================================
        # `streamer(messages)` produit des couples (genre, valeur) :
        #   ("delta", "un morceau de texte")        -> a renvoyer via fragment()
        #   ("usage", {"entree": .., "sortie": ..}) -> a garder pour la fin
        raise NotImplementedError("TODO 3 et 4 : boucler sur streamer()")
        # =============================================================
        # TODO 5 : cloturer le flux avec l'evenement done et l'usage
        # =============================================================
        yield fin(usage, debut)

    # flux_ou_503 consomme le premier evenement avant de repondre : c'est ce qui
    # permet de renvoyer un vrai 503 quand le modele ne repond pas.
    return await flux_ou_503(flux())


# =====================================================================
# SEANCE 10 : POST /api/assistant, avec appel d'outil
# =====================================================================
# TODO 6 : declarer l'outil au format attendu par le modele.
# Un objet {"type": "function", "function": {name, description, parameters}}.
# La description est LUE PAR LE MODELE : elle fait partie du prompt, et c'est
# elle qui decide s'il appelle l'outil ou s'il repond de memoire.
OUTILS = []

# TODO 7 : la table des outils executables.
# Une table explicite, jamais une resolution dynamique du nom recu du modele.
TABLE_DES_OUTILS = {}


@app.post("/api/assistant")
async def assistant(requete: Request):
    debut = time.perf_counter()
    corps = await requete.json()
    question = corps.get("question")
    if not isinstance(question, str) or not question.strip():
        raise RequeteInvalide("question invalide")

    async def flux():
        # =============================================================
        # TODO 8 : la boucle d'appel d'outil
        # =============================================================
        # 1. appeler(messages, outils=OUTILS) renvoie (message, usage)
        # 2. si message["tool_calls"] existe, pour chaque appel :
        #    valider les arguments, executer, puis ajouter au fil des messages
        #    {"role": "tool", "tool_call_id": ..., "content": json.dumps(resultat)}
        # 3. rappeler le modele en streaming pour qu'il redige la reponse
        # 4. cumuler l'usage des DEUX appels : le client doit voir le total
        raise NotImplementedError("TODO 8 : la boucle d'appel d'outil")
        yield fin({}, debut)

    return await flux_ou_503(flux())


# =====================================================================
# SEANCE 13 : POST /api/documents, RAG avec citation des sources
# =====================================================================
# TODO 9 : decouper le corpus en morceaux, une seule fois au demarrage.
# charger_documents() renvoie [(titre, texte)]. Visez 300 a 800 tokens par
# morceau, avec un recouvrement. Decouper sur la structure vaut mieux que
# decouper sur la longueur.
MORCEAUX = []


async def indexer():
    """TODO 10 : vectoriser les morceaux avec plonger(), une seule fois."""
    raise NotImplementedError("TODO 10 : vectoriser les morceaux")


def chercher(vecteur_question, k=3):
    """TODO 11 : renvoyer les k morceaux les plus proches, avec leur score.

    Similarite cosinus : produit scalaire divise par le produit des normes.
    """
    raise NotImplementedError("TODO 11 : recherche par similarite cosinus")


@app.post("/api/documents")
async def documents(requete: Request):
    debut = time.perf_counter()
    corps = await requete.json()
    question = corps.get("question")
    if not isinstance(question, str) or not question.strip():
        raise RequeteInvalide("question invalide")

    async def flux():
        # =============================================================
        # TODO 12 : le pipeline RAG
        # =============================================================
        # 1. vectoriser la question avec plonger([question])
        # 2. chercher les 3 morceaux les plus proches
        # 3. emettre sse({"sources": [{"titre": ..., "score": ...}]}) AVANT tout
        #    fragment de reponse : le contrat l'exige
        # 4. injecter les extraits dans le prompt, et INTERDIRE au modele de
        #    repondre a partir d'autre chose que ces extraits
        # 5. streamer la reponse, puis cloturer avec l'usage
        raise NotImplementedError("TODO 12 : le pipeline RAG")
        yield fin({}, debut)

    return await flux_ou_503(flux())


@app.exception_handler(ModeleIndisponible)
async def _modele_indisponible(_requete: Request, exc: ModeleIndisponible):
    print(f"[modele] {exc}")
    return JSONResponse({"erreur": "modele indisponible"}, status_code=503)


# Toujours en dernier : la racine sert le front et attrape le reste.
servir_le_front(app)
