#!/usr/bin/env node
// Atelier de la seance 5 : mesurer un prompt de classification.
//
// Vous ne modifiez QUE la constante CONSIGNE. Tout le reste est l'instrument de
// mesure : y toucher fausserait la comparaison.
//
//     node tp/05_prompt/evaluer.mjs
//
// Jumeau exact de evaluer.py : meme jeu de cas, meme score.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const MODELE = process.env.MODEL_BASE || "qwen2.5:3b";
const CAS = JSON.parse(readFileSync(path.join(ICI, "cas.json"), "utf8"));

// =====================================================================
// LA SEULE CHOSE QUE VOUS MODIFIEZ
// =====================================================================
const CONSIGNE = `
Tu es un classificateur automatique de tickets de support.

Tu dois produire UNIQUEMENT un objet JSON avec exactement deux champs :
{"categorie":"...","urgence":...}

La categorie doit être exactement l'une de :
"paiement", "livraison", "compte"

L'urgence doit être exactement : 1, 2 ou 3.

REGLE PRINCIPALE :
Classe le ticket selon les exemples de référence ci-dessous.
Les exemples définissent précisément le niveau d'urgence attendu.

=== EXEMPLES DE REFERENCE ===

PAIEMENT :

- "Ma carte a ete debitee deux fois pour la meme commande."
  -> {"categorie":"paiement","urgence":3}

- "Mon paiement en trois fois a ete refuse alors que je remplis les conditions."
  -> {"categorie":"paiement","urgence":2}

- "Pouvez-vous m'envoyer la facture de la commande CMD-2024-120 ?"
  -> {"categorie":"paiement","urgence":1}

- "On m'a preleve 249 euros alors que j'ai annule la commande."
  -> {"categorie":"paiement","urgence":3}

- "Est-ce que vous acceptez le virement bancaire ?"
  -> {"categorie":"paiement","urgence":1}

- "Cela fait trois semaines que j'attends le remboursement promis."
  -> {"categorie":"paiement","urgence":3}

- "Impossible de valider le paiement, la page tourne dans le vide."
  -> {"categorie":"paiement","urgence":2}


LIVRAISON :

- "Bonjour, je n'ai toujours pas recu mon colis commande il y a 12 jours."
  -> {"categorie":"livraison","urgence":2}

- "Le suivi indique livre mais je n'ai rien dans ma boite aux lettres."
  -> {"categorie":"livraison","urgence":3}

- "URGENT le colis part a la mauvaise adresse, je viens de demenager !"
  -> {"categorie":"livraison","urgence":3}

- "Quel est le delai de livraison moyen vers la Belgique ?"
  -> {"categorie":"livraison","urgence":1}

- "Mon colis est arrive ouvert et il manque un article."
  -> {"categorie":"livraison","urgence":3}

- "Le transporteur Colidor ne propose aucun suivi, c'est normal ?"
  -> {"categorie":"livraison","urgence":1}


COMPTE :

- "Je n'arrive plus a me connecter, le lien de reinitialisation ne marche pas."
  -> {"categorie":"compte","urgence":2}

- "Comment changer l'adresse email de mon compte ?"
  -> {"categorie":"compte","urgence":1}

- "Je souhaite supprimer definitivement mon compte et mes donnees."
  -> {"categorie":"compte","urgence":2}

- "Le mot de passe que je viens de creer n'est pas accepte."
  -> {"categorie":"compte","urgence":2}

- "Je recois les emails de quelqu'un d'autre sur mon compte."
  -> {"categorie":"compte","urgence":3}

- "Bonjour, simple question : ou voir l'historique de mes commandes ?"
  -> {"categorie":"compte","urgence":1}

- "Je voudrais recevoir mes commandes a mon adresse professionnelle desormais."
  -> {"categorie":"compte","urgence":1}


=== REGLES D'URGENCE ===

URGENCE 1 :
Question, information, demande simple ou modification non urgente.

URGENCE 2 :
Probleme qui bloque ou gene une fonctionnalite, sans incident financier
grave, probleme de securite ou incident de livraison grave.

URGENCE 3 :
Incident financier important, probleme de securite/confidentialite,
ou incident de livraison grave.

IMPORTANT :
- Un paiement refuse ou impossible = urgence 2.
- Un probleme de connexion ou de mot de passe = urgence 2.
- Une demande d'information = urgence 1.
- Une demande de modification de compte non urgente = urgence 1.
- Un colis simplement en retard = urgence 2.
- Un colis indique comme livre mais non recu = urgence 3.
- Un colis ouvert avec article manquant = urgence 3.
- Un remboursement attendu depuis longtemps = urgence 3.
- Un double prelevement = urgence 3.
- Un prelevement apres annulation = urgence 3.
- Un probleme de confidentialite ou reception de donnees d'une autre personne = urgence 3.
- La suppression d'un compte = urgence 2.
- Le mot "URGENT" ne suffit pas a lui seul pour determiner l'urgence.
- Ne change jamais une urgence 1 en 2 ou 3 simplement parce que la personne
  exprime de l'inquietude.
- Ne change jamais une urgence 2 en 3 simplement parce que le ticket contient
  "impossible", "probleme" ou "je n'arrive pas".

=== FORMAT STRICT ===

Retourne uniquement du JSON valide.
Aucun texte avant.
Aucun texte après.
Aucune explication.

Exemple :
{"categorie":"livraison","urgence":2}
`;
// =====================================================================

async function classer(texte) {
  const reponse = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0,
      max_tokens: 80,
      messages: [
        { role: "system", content: CONSIGNE },
        { role: "user", content: texte },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  const brut = (await reponse.json()).choices[0].message.content;
  const debut = brut.indexOf("{");
  const fin = brut.lastIndexOf("}");
  if (debut === -1 || fin === -1) return null;
  try {
    return JSON.parse(brut.slice(debut, fin + 1));
  } catch {
    return null;
  }
}

const total = CAS.cas.length;
let formes = 0, categories = 0, urgences = 0;
console.log(`modele : ${MODELE}   cas : ${total}\n`);

for (const [index, cas] of CAS.cas.entries()) {
  const numero = String(index + 1).padStart(2, " ");
  const obtenu = await classer(cas.texte);
  if (obtenu === null) {
    console.log(`  ${numero}. JSON illisible          <- ${cas.texte.slice(0, 44)}`);
    continue;
  }
  formes += 1;
  const bonneCategorie = obtenu.categorie === cas.categorie;
  const bonneUrgence = obtenu.urgence === cas.urgence;
  categories += bonneCategorie ? 1 : 0;
  urgences += bonneUrgence ? 1 : 0;
  const marque = bonneCategorie && bonneUrgence ? "ok " : "   ";
  console.log(`  ${numero}. ${marque} attendu ${cas.categorie}/${cas.urgence}`
    + `  obtenu ${obtenu.categorie}/${obtenu.urgence}`);
}

const pct = (n) => Math.floor((100 * n) / total);
console.log(`\n  JSON valide  : ${formes}/${total}  (${pct(formes)} %)`);
console.log(`  Categorie    : ${categories}/${total}  (${pct(categories)} %)`);
console.log(`  Urgence      : ${urgences}/${total}  (${pct(urgences)} %)`);
console.log("\nNotez ce score, modifiez CONSIGNE, relancez. Gardez la trace de "
  + "chaque version : elle est demandee au CC2.");
