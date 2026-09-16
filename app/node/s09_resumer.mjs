// Seance 9 : la route POST /api/resumer.
//
// Objectif : resumer le message d'un client, en streaming, dans le ton demande.
//
// Le contrat exact est dans app/CONTRAT.md, section "Route 1".
//
// Vous remplissez les TODO 1 a 5 de ce fichier, et rien d'autre.
// Tant qu'un TODO n'est pas ecrit, la route repond 501 "a ecrire".
//
// Verifier :
//
//     make app-node                # terminal 1
//     make conformite SEANCE=9     # terminal 2

import { streamer } from "./fourni/modele.mjs";

import {
  AEcrire, fin, fluxOu503, fragment, lireCorps, RequeteInvalide,
} from "./fourni/transport.mjs";

const TONS = new Set([
  "neutre",
  "direct",
  "humour",
  "triste",
  "colere",
]);

const LONGUEUR_MAX = 20_000;

// =====================================================================
// TODO 1 : valider l'entree du client
// =====================================================================

function validerResumer(corps) {

  if (corps == null || typeof corps !== "object" || Array.isArray(corps)) {
    throw new RequeteInvalide("texte invalide");
  }

  const { texte } = corps;
  const ton = corps.ton ?? "neutre";

  if (
    typeof texte !== "string"
    || texte.trim().length === 0
    || texte.length > LONGUEUR_MAX
  ) {
    throw new RequeteInvalide("texte invalide");
  }

  if (!TONS.has(ton)) {
    throw new RequeteInvalide("ton invalide");
  }

  return { texte, ton };
}

// =====================================================================
// TODO 2 : assembler le prompt, cote serveur et nulle part ailleurs
// =====================================================================

function promptResumer(texte, ton) {

  const consignesTon = {
    neutre:
      "Réponds de façon neutre et factuelle.",

    direct:
      "Réponds de façon directe et concise, sans détour.",

    humour:
      "Réponds avec une touche d'humour légère et sympathique, "
      + "comme un conseiller automobile qui essaie de détendre le client, "
      + "sans minimiser son problème.",

    triste:
      "Réponds avec un ton empathique et légèrement triste, "
      + "en montrant que la situation est regrettable, "
      + "sans être excessivement dramatique.",

    colere:
      "Réponds avec un ton ferme et énergique, "
      + "comme si la situation était particulièrement frustrante, "
      + "mais sans insultes ni agressivité envers le client.",
  };

  return [
    {
      role: "system",

      content:
        "Tu es un assistant qui résume des tickets de support client. "
        + "Résume le message ci-dessous en 2 à 3 phrases maximum, en gardant "
        + "les informations essentielles (problème rencontré, contexte). "
        + consignesTon[ton],
    },

    {
      role: "user",
      content: texte,
    },
  ];
}

async function resumer(req, res) {

  const debut = performance.now();

  const { texte, ton } =
    validerResumer(await lireCorps(req));

  const messages =
    promptResumer(texte, ton);

  async function* flux() {

    let usage = {};

    // =================================================================
    // TODO 3 et 4 : appeler le modele et relayer chaque fragment
    // =================================================================

    for await (const evt of streamer(messages)) {

      if (evt.genre === "delta") {

        yield fragment(evt.valeur);

      } else if (evt.genre === "usage") {

        usage = evt.valeur;
      }
    }

    // =================================================================
    // TODO 5 : cloturer le flux avec l'evenement done et l'usage
    // =================================================================

    yield fin(usage, debut);
  }

  await fluxOu503(res, flux());
}

export const routes = {
  "POST /api/resumer": resumer,
};