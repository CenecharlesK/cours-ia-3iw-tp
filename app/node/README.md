# Voie JavaScript : squelette Node

**Aucune dépendance npm.** Node 20 ou plus suffit, et il n'y a rien à installer.
C'est délibéré : ce squelette ne peut pas casser à l'installation.

## Lancer

```bash
cd app/node
npm start          # ou : node serveur.mjs
```

Ouvrez ensuite <http://localhost:3000>. Le front s'affiche, mais rien ne
fonctionne : c'est normal, les TODO ne sont pas remplis.

## Ce qui est fourni

| Fichier | Rôle | À modifier |
| --- | --- | --- |
| `modele.mjs` | client du modèle local, streaming et embeddings | non |
| `transport.mjs` | SSE, erreurs, routage, service du front | non |
| `serveur.mjs` | vos routes | **oui** |

## Ce que vous écrivez

Cinq TODO dans `serveur.mjs`, une vingtaine de lignes en tout :

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

La suite de conformité est écrite en Python, mais elle n'interroge que du HTTP :
elle vous juge exactement comme elle juge un rendu Python.

## Express, Fastify, Next.js

Ce squelette utilise le module `node:http` pour éviter toute installation. Si
vous préférez Express ou Fastify, vous en avez le droit : le contrat est le
même, et `modele.mjs` fonctionnera tel quel. Vous reprenez alors à votre charge
le routage et le service du front, en respectant
[../CONTRAT.md](../CONTRAT.md).

## Réglages

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | où joindre le modèle |
| `MODEL_BASE` | `qwen2.5:3b` | modèle de génération |
| `MODEL_EMBED` | `paraphrase-multilingual` | modèle d'embedding, séance 12 |
| `DELAI_MODELE` | `60` | timeout en secondes |
| `PORT` | `3000` | port d'écoute |
