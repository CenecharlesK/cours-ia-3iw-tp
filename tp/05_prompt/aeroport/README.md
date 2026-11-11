# Aéroport Émeraude : assistant Zéphyr

Site de démonstration (projet BTS SIO) : réservation simulée, départs en direct,
assistant IA Zéphyr (agent instantané + IA locale Ollama) et tableau de bord.

## Lancer le projet
Prérequis : Node.js 18 ou plus récent (aucun `npm install` nécessaire).

    cd tp/05_prompt/aeroport
    npm start

Puis ouvrir http://localhost:3000

## IA locale (facultatif)
Sans Ollama, Zéphyr répond quand même grâce à l'agent instantané.

    ollama pull llama3.2:1b
    ollama serve

## Tests
    npm test     # 186 cas : catégorie et urgence
