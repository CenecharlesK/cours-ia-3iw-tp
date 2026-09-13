# Voie Python : squelette FastAPI

## Lancer

```bash
cd app/python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn serveur:app --reload --port 3000
```

Ouvrez ensuite <http://localhost:3000>. Le front s'affiche, mais rien ne
fonctionne : c'est normal, les TODO ne sont pas remplis.

## Ce qui est fourni

| Fichier | Rôle | À modifier |
| --- | --- | --- |
| `modele.py` | client du modèle local, streaming et embeddings | non |
| `transport.py` | formatage SSE, erreurs, service du front | non |
| `serveur.py` | vos routes | **oui** |

## Ce que vous écrivez

Cinq TODO dans `serveur.py`, une vingtaine de lignes en tout :

1. valider l'entrée du client ;
2. assembler le prompt côté serveur ;
3. appeler le modèle en streaming ;
4. relayer chaque fragment en SSE ;
5. clôturer par l'événement `done` avec l'usage.

## Vérifier

```bash
# depuis la racine du depot, serveur lance
BASE_URL=http://localhost:3000 pytest examen/conformite
```

Le contrat exact est dans [../CONTRAT.md](../CONTRAT.md), qui fait foi.

## Réglages

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | où joindre le modèle |
| `MODEL_BASE` | `qwen2.5:3b` | modèle de génération |
| `MODEL_EMBED` | `paraphrase-multilingual` | modèle d'embedding, séance 12 |
| `DELAI_MODELE` | `60` | timeout en secondes |
