# Les Fondamentaux de l'Intelligence Artificielle : 3IW

Dépôt de travail du module de 21 heures, ESGI, 3e année d'ingénierie du web.

Tout tourne sur votre machine avec des modèles locaux. **Aucun compte, aucune clé
d'API, aucun paiement.**

## Démarrer

À faire **avant la première séance**, chez vous : les téléchargements pèsent
environ 2,5 Go.

Commencez par créer **votre propre copie privée** de ce dépôt : bouton
**Use this template**, puis **Private**. Ne forkez pas : un fork d'un dépôt public
est public, et votre travail serait visible par toute la promotion.

```bash
git clone <l'adresse de VOTRE copie>
cd cours-ia-3iw

make outils          # installe uv et Ollama s'ils sont absents
make install         # environnement Python : tests, et FastAPI pour la voie Python
make ollama-pull     # le socle du cours
make setup-check     # diagnostic du poste (ou : make setup-check-node)
```

Le guide détaillé, avec la matrice modèle/machine et le dépannage, est dans
[docs/installation-ollama.md](docs/installation-ollama.md).

`make help` liste toutes les commandes.

## Choisir sa voie

Le cours est bilingue. Vous écrivez votre serveur **dans la langue de votre
choix** :

| Voie | Dossier | Prérequis |
| --- | --- | --- |
| Python | `app/python/` | Python 3.11 ou plus |
| JavaScript | `app/node/` | Node 20 ou plus, aucune dépendance npm |

Ce qui est évalué est le **contrat HTTP** décrit dans
[app/CONTRAT.md](app/CONTRAT.md), jamais votre code. Déclarez votre voie en début
de projet et tenez-vous-y.

## Comment on travaille

Vous construisez **une seule application**, qui grandit au fil des séances. Vous
n'écrivez que dans le fichier `serveur` de votre voie, là où sont les `TODO`.

| Séance | Travail | Où |
| --- | --- | --- |
| 4 | installer son poste et relever son débit | `tp/00_setup/` |
| 5 | améliorer un prompt, mesure à l'appui | `tp/05_prompt/` |
| 9 | la route « résumer », TODO 1 à 5 | `app/` |
| 10 | l'assistant avec appel d'outil, TODO 6 à 8 | `app/` |
| 11 | comparer des modèles au banc d'essai | `tp/11_banc/` |
| 13 | la recherche documentaire (RAG), TODO 9 à 12 | `app/` |

Trois règles :

1. **Ne modifiez pas `app/front/`.** Le front est commun à toute la promotion ; le
   modifier est hors sujet.
2. **Ne modifiez pas les fichiers marqués FOURNI** (`modele`, `transport`,
   `donnees`). Votre travail est dans `serveur`.
3. **Le navigateur ne parle jamais au modèle.** Il parle à votre serveur, qui
   parle au modèle.

## Vérifier son travail

Deux terminaux :

```bash
make app            # terminal 1 : votre serveur (ou : make app-node)
make conformite     # terminal 2 : la suite de tests
```

Les tests des routes que vous n'avez pas encore écrites sont ignorés
automatiquement : lancez la suite dès la séance 9 et regardez-la passer au vert
au fil du module. C'est **exactement** la commande qui sert à noter le CC2.

## Organisation du dépôt

| Dossier | Contenu |
| --- | --- |
| `slides/` | les supports du cours, un PDF par bloc |
| `app/` | l'application fil rouge : front, squelettes, données, contrat |
| `tp/` | les ateliers ponctuels : diagnostic, prompt, banc d'essai |
| `docs/` | installation et dépannage |
| `examen/conformite/` | la suite de tests du contrat |

## Évaluation

| Épreuve | Format | Poids |
| --- | --- | --- |
| CC1 | écrit de 45 min, fin de séance 7 | 25 % |
| CC2 | l'application, en binôme, rendu Git et démonstration de 5 min | 35 % |
| Partiel | écrit de 1 h 30 | 40 % |
