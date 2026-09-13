// Squelette du serveur, voie JavaScript.
//
// Le transport est ecrit (transport.mjs) et le client du modele aussi
// (modele.mjs). Votre travail tient dans les TODO ci-dessous.
//
// Lancement :
//     node app/node/serveur.mjs
//
// Puis ouvrez http://localhost:3000 et verifiez avec :
//     BASE_URL=http://localhost:3000 pytest examen/conformite

import { createServer } from "node:http";

import { chargerDocuments, chercherCommande } from "./donnees.mjs";
import { appeler, plonger, streamer } from "./modele.mjs";
import {
  creerServeur, fin, fluxOu503, fragment, lireCorps, RequeteInvalide, sse,
} from "./transport.mjs";

const PORT = Number(process.env.PORT || 3000);
const TONS = new Set(["neutre", "direct"]);
const LONGUEUR_MAX = 20_000;

// =====================================================================
// TODO 1 : valider l'entree du client
// =====================================================================
function validerResumer(corps) {
  // Renvoie { texte, ton } ou leve RequeteInvalide.
  //
  // Le contrat exige un 400 pour : texte absent, vide, non textuel, de plus de
  // 20 000 caracteres, et pour un ton qui n'est ni "neutre" ni "direct".
  // L'absence de "ton" vaut "neutre".
  throw new Error("TODO 1 : valider corps.texte et corps.ton");
}

// =====================================================================
// TODO 2 : assembler le prompt, cote serveur et nulle part ailleurs
// =====================================================================
function promptResumer(texte, ton) {
  // Renvoie la liste de messages envoyee au modele.
  //
  // Rappel de la seance 5 : un role, un contexte, un format montre.
  // Le texte du client est une DONNEE, jamais une consigne : gardez-le dans un
  // message "user" distinct de la consigne systeme.
  throw new Error("TODO 2 : construire les messages");
}

async function resumer(req, res) {
  const debut = performance.now();
  const corps = await lireCorps(req);
  const { texte, ton } = validerResumer(corps);
  const messages = promptResumer(texte, ton);

  async function* flux() {
    let usage = {};
    // =================================================================
    // TODO 3 et 4 : appeler le modele et relayer chaque fragment
    // =================================================================
    // `streamer(messages)` produit des objets { genre, valeur } :
    //   { genre: "delta", valeur: "un morceau" }  -> a renvoyer via fragment()
    //   { genre: "usage", valeur: { entree, sortie } } -> a garder pour la fin
    throw new Error("TODO 3 et 4 : boucler sur streamer()");
    // =================================================================
    // TODO 5 : cloturer le flux avec l'evenement done et l'usage
    // =================================================================
    yield fin(usage, debut);
  }

  // fluxOu503 consomme le premier evenement avant de repondre : c'est ce qui
  // permet de renvoyer un vrai 503 quand le modele ne repond pas.
  await fluxOu503(res, flux());
}

// =====================================================================
// SEANCE 10 : POST /api/assistant, avec appel d'outil
// =====================================================================
// TODO 6 : declarer l'outil au format attendu par le modele.
// Un objet { type: "function", function: { name, description, parameters } }.
// La description est LUE PAR LE MODELE : elle fait partie du prompt, et c'est
// elle qui decide s'il appelle l'outil ou s'il repond de memoire.
const OUTILS = [];

// TODO 7 : la table des outils executables.
// Une table explicite, jamais une resolution dynamique du nom recu du modele.
const TABLE_DES_OUTILS = {};

async function assistant(req, res) {
  const debut = performance.now();
  const corps = await lireCorps(req);
  const question = corps.question;
  if (typeof question !== "string" || !question.trim()) {
    throw new RequeteInvalide("question invalide");
  }

  async function* flux() {
    // =================================================================
    // TODO 8 : la boucle d'appel d'outil
    // =================================================================
    // 1. appeler(messages, { outils: OUTILS }) renvoie { message, usage }
    // 2. si message.tool_calls existe, pour chaque appel :
    //    valider les arguments, executer, puis ajouter au fil des messages
    //    { role: "tool", tool_call_id: ..., content: JSON.stringify(resultat) }
    // 3. rappeler le modele en streaming pour qu'il redige la reponse
    // 4. cumuler l'usage des DEUX appels : le client doit voir le total
    throw new Error("TODO 8 : la boucle d'appel d'outil");
    yield fin({}, debut);
  }

  await fluxOu503(res, flux());
}

// =====================================================================
// SEANCE 13 : POST /api/documents, RAG avec citation des sources
// =====================================================================
// TODO 9 : decouper le corpus en morceaux, une seule fois au demarrage.
// chargerDocuments() renvoie [{ titre, texte }]. Visez 300 a 800 tokens par
// morceau, avec un recouvrement. Decouper sur la structure vaut mieux que
// decouper sur la longueur.
const MORCEAUX = [];

// TODO 10 : vectoriser les morceaux avec plonger(), une seule fois.
async function indexer() {
  throw new Error("TODO 10 : vectoriser les morceaux");
}

// TODO 11 : renvoyer les k morceaux les plus proches, avec leur score.
// Similarite cosinus : produit scalaire divise par le produit des normes.
function chercher(vecteurQuestion, k = 3) {
  throw new Error("TODO 11 : recherche par similarite cosinus");
}

async function documents(req, res) {
  const debut = performance.now();
  const corps = await lireCorps(req);
  const question = corps.question;
  if (typeof question !== "string" || !question.trim()) {
    throw new RequeteInvalide("question invalide");
  }

  async function* flux() {
    // =================================================================
    // TODO 12 : le pipeline RAG
    // =================================================================
    // 1. vectoriser la question avec plonger([question])
    // 2. chercher les 3 morceaux les plus proches
    // 3. emettre sse({ sources: [{ titre, score }] }) AVANT tout fragment de
    //    reponse : le contrat l'exige
    // 4. injecter les extraits dans le prompt, et INTERDIRE au modele de
    //    repondre a partir d'autre chose que ces extraits
    // 5. streamer la reponse, puis cloturer avec l'usage
    throw new Error("TODO 12 : le pipeline RAG");
    yield fin({}, debut);
  }

  await fluxOu503(res, flux());
}

const serveur = createServer(creerServeur({
  "POST /api/resumer": resumer,
  "POST /api/assistant": assistant,
  "POST /api/documents": documents,
}));

serveur.listen(PORT, () => {
  console.log(`serveur pret sur http://localhost:${PORT}`);
});
