// =============================================================
//  Zéphyr — agent instantané
//  analyser(message, { contexte }) →
//   { categorie, urgence, intention, confiance, reponse, instantane, connaissances, duree_ms }
// =============================================================
import { classer, normaliser } from './classifieur.js';
import { INTENTIONS, REPONSES_CATEGORIE, PRIORITAIRE, DEPARTS_DEFAUT } from './connaissances.js';

const testerTout = (motifs, t) => [].concat(motifs).every(m => m.test(t));

function trouverIntention(n, categorie, urgence) {
  return INTENTIONS.find(i => i.cat === categorie && (!i.urgence || i.urgence === urgence)
    && testerTout(i.si, n) && !(i.sauf && i.sauf.test(n))) || null;
}

// ---------- Statut des vols (à partir du tableau des départs) ----------
function lireDeparts(contexte) {
  const bloc = typeof contexte === 'string' ? contexte.split('Départs du jour :')[1] : null;
  if (!bloc) return DEPARTS_DEFAUT.map(([heure, vol, ville, terminal, porte, statut]) => ({ heure, vol, ville, terminal, porte, statut }));
  const res = [];
  const re = /(EM \d+) (.+?) (\d\d:\d\d) (T\d) porte (\S+) ([^;.]+)/g;
  let m;
  while ((m = re.exec(bloc))) res.push({ vol: m[1], ville: m[2], heure: m[3], terminal: m[4], porte: m[5], statut: m[6].trim() });
  return res.length ? res : lireDeparts(null);
}

// Question explicite sur un vol du tableau (le nom d'une ville seul ne suffit pas)
const QUESTION_STATUT = /\b(statut|etat du vol|a quelle heure|quel terminal|quelle porte|part de quel|part a quelle|a l heure|ou en est|partira|embarquement est il|est il parti|est il a l heure|horaire du vol|infos? sur le vol)\b/;

function statutVol(n, contexte) {
  const vols = lireDeparts(contexte);
  const parNumero = vols.find(d => n.includes(normaliser(d.vol)) || n.includes(normaliser(d.vol).replace(' ', '')));
  const v = parNumero || (QUESTION_STATUT.test(n) && vols.find(d => new RegExp(`\\b${normaliser(d.ville)}\\b`).test(n)));
  if (!v) return null;
  let conseil = '';
  if (/annul/i.test(v.statut)) conseil = ' Ce vol est annulé : adressez-vous aux agents du hall central pour être réacheminé.';
  else if (/retard/i.test(v.statut)) conseil = ' Restez près de la porte et surveillez les écrans, l’horaire peut évoluer.';
  else if (/embarquement/i.test(v.statut)) conseil = ' L’embarquement est en cours : rendez-vous à la porte sans attendre.';
  return `Vol ${v.vol} pour ${v.ville} : départ prévu à ${v.heure}, terminal ${v.terminal}, porte ${v.porte}. Statut : ${v.statut}.${conseil} (Données de démonstration.)`;
}

// ---------- Analyse ----------
export function analyser(message, options = {}) {
  const debut = performance.now();
  const c = classer(message);
  const { categorie, urgence, normalise: n } = c;

  let intention = null, corps = null, dejaPrioritaire = false;
  const statut = statutVol(n, options.contexte);
  if (statut && ['information', 'perturbation', 'enregistrement'].includes(categorie)) {
    intention = 'statut_vol';
    corps = statut;
  } else {
    const i = trouverIntention(n, categorie, urgence);
    if (i) { intention = i.id; corps = i.reponse; dejaPrioritaire = !!i.urgence; }
  }

  // Confiance : intention précise > catégorie reconnue > repli
  const confiance = intention ? (c.certitude >= 0.5 ? 0.95 : 0.8) : (c.score >= 4 ? 0.55 : 0.25);
  const base = corps || REPONSES_CATEGORIE[categorie];
  const prefixe = urgence === 'haute' && !dejaPrioritaire ? (PRIORITAIRE[categorie] || PRIORITAIRE.defaut) + '\n\n' : '';

  // Fiches utiles transmises à l'IA locale si elle doit compléter la réponse
  const connaissances = INTENTIONS.filter(x => x.cat === categorie && testerTout(x.si, n)).slice(0, 3).map(x => x.reponse);
  if (statut) connaissances.unshift(statut);

  return {
    categorie,
    urgence,
    intention,
    confiance,
    reponse: prefixe + base,
    // Réponse directe si l'intention est claire, ou si c'est urgent (pas de temps à perdre)
    instantane: !!intention || urgence === 'haute',
    connaissances,
    duree_ms: +(performance.now() - debut).toFixed(3)
  };
}
