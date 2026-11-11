// =============================================================
//  Zéphyr — classifieur instantané (catégorie + urgence)
//  Aucune IA : règles pondérées + correction des fautes courantes.
//  Temps de réponse : < 1 ms par message.
// =============================================================

export const CATEGORIES = [
  'securite', 'perturbation', 'objet_perdu', 'bagage', 'enregistrement',
  'facturation', 'reservation', 'assistance', 'acces', 'services', 'information'
];
// L'ordre ci-dessus sert aussi à départager deux catégories à égalité.

// ---------- Normalisation ----------
const FAUTES = {
  valize: 'valise', valis: 'valise', vallise: 'valise', valises: 'valises',
  bagge: 'bagage', baguage: 'bagage', baggage: 'bagage', bagagge: 'bagage',
  anule: 'annule', annulle: 'annule', anulee: 'annulee', anuler: 'annuler',
  anulation: 'annulation', annullation: 'annulation', annulaion: 'annulation',
  retar: 'retard', rtard: 'retard', retart: 'retard', retared: 'retard',
  corespondance: 'correspondance', correspondence: 'correspondance', coresspondance: 'correspondance',
  enregistrment: 'enregistrement', enregistremnt: 'enregistrement', enregistremant: 'enregistrement',
  passport: 'passeport', pasport: 'passeport', paseport: 'passeport',
  remboursment: 'remboursement', rembourssement: 'remboursement',
  urgnt: 'urgent', urgant: 'urgent', urjent: 'urgent',
  tel: 'telephone', telefone: 'telephone', portabl: 'portable',
  parkin: 'parking', parkign: 'parking', navete: 'navette',
  embarqement: 'embarquement', embarquemnt: 'embarquement',
  bjr: 'bonjour', slt: 'salut', pr: 'pour', ke: 'que', koi: 'quoi', ds: 'dans', ss: 'suis',
  svp: '', stp: '', pls: '', svv: ''
};

// Vocabulaire pour la correction approximative (distance d'édition de 1)
const VOCABULAIRE = [
  'valise', 'bagage', 'annulation', 'retard', 'correspondance', 'enregistrement', 'passeport',
  'remboursement', 'facture', 'parking', 'navette', 'embarquement', 'comptoir', 'malaise',
  'abandonne', 'suspect', 'urgent', 'urgence', 'telephone', 'portefeuille', 'trottinette',
  'poussette', 'fauteuil', 'handicap', 'restaurant', 'boutique', 'consigne', 'terminal',
  'reservation', 'surclassement', 'indemnisation', 'prelevement', 'assistance', 'pharmacie'
];
const VOCAB = new Set(VOCABULAIRE);

function distance1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, diff = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}

function corriger(mot) {
  if (mot in FAUTES) return FAUTES[mot];
  // On ne corrige que les mots longs qui ne ressemblent pas à des verbes conjugués
  if (mot.length < 7 || VOCAB.has(mot) || /(er|ez|es|ent|ons)$/.test(mot)) return mot;
  return VOCABULAIRE.find(v => distance1(mot, v)) || mot;
}

export function normaliser(texte) {
  const base = String(texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base.split(' ').map(corriger).filter(Boolean).join(' ')
    .replace(/\bwi fi\b/g, 'wifi')
    .replace(/\bcheck in\b/g, 'checkin');
}

// ---------- Règles de catégorie ----------
const ITEMS = '(passeport|doudou|peluche|telephone|portable|smartphone|iphone|portefeuille|porte monnaie|cles?|lunettes|ordinateur|ordi|pc|tablette|ipad|montre|veste|manteau|blouson|echarpe|carte d identite|carte bancaire|cb|permis|sac a main|sac a dos|sacoche|sac|casque|ecouteurs|airpods|bague|bijoux?|appareil photo|chargeur|parapluie|livre|jouet|pochette|papiers|documents?|carte d embarquement|affaires|alliance|gourmette|valise cabine)';
const VERBES_PERTE = '(perdu|perdue|perdus|perdues|perdre|oublie|oubliee|oublies|oublier|laisse|laissee|laisses|laisser|egare|egaree|egares|egarer|ne trouve plus|ne retrouve plus|retrouve|retrouvee|est reste|est restee|sont restes|disparu|disparue)';

const R = (cat, poids, re) => ({ cat, poids, re });
const REGLES = [
  // --- Sécurité / urgence vitale ---
  R('securite', 7, /\b(malaise|senti mal|sent mal|sentie mal|se sent pas bien|evanoui\w*|inconscient\w*|crise (cardiaque|d epilepsie|d asthme)|epilep\w*|respire (plus|mal|pas)|ne respire|saign\w*|blesse\w*|fracture\w*|tombee?s? (dans|de|par|sur)|aide medicale|urgence medicale|(besoin d un|appele[rz]? un|faut un|appelez un) medecin|defibrillateur|ambulance|contractions?|accouch\w*|choc anaphylactique|perte de connaissance|douleur (a|dans) la poitrine)\b/),
  R('securite', 8, /\b(sacs?|colis|valises?|bagages?|paquets?|objets?)\b.{0,15}\b(abandonne\w*|suspect\w*|sans surveillance)\b/),
  R('securite', 6, /\b(abandonne\w*|suspect\w*|sans surveillance)\b/),
  R('securite', 7, /\b(feu|incendie|fumee|flammes?|explosion|alarme)\b/),
  R('securite', 7, /\b(bagarre|se battent|agress\w*|violen\w*|menace\w*|frapp\w*|harcel\w*|armes?|couteau|pistolet|terroris\w*|attentat)\b/),
  R('securite', 6, /\b(on m a vole|m a vole|m ont vole|vol a la tire|pickpocket\w*|cambriol\w*|vole mon|vole ma|vole mes|a ete vole|ete volee?s?|on vient de me voler)\b/),
  R('securite', 9, /\b(ne trouve plus|ne vois plus|perdu|disparu\w*)\b.{0,25}\b(mon|ma|notre) (enfant|fils|fille|bebe|petit|petite)\b|\b(enfant|fils|fille|bebe)\b.{0,25}\bdisparu\w*|\benfant perdu\b/),

  // --- Perturbations ---
  R('perturbation', 6, /\bvol\b[^.?!]{0,40}\b(annule|annulee|supprime)\b|\b(annulation|annule)\b[^.?!]{0,25}\bvol\b/),
  R('perturbation', 3, /\b(annule|annulee)\b/),
  R('perturbation', 4, /\bretard\w*\b/),
  R('perturbation', 4, /\b(correspondances?|transit)\b/),
  R('perturbation', 2, /\bescales?\b/),
  R('perturbation', 5, /\b(greve|grevistes?)\b/),
  R('perturbation', 6, /\b(surbook\w*|surreservation|refuse (a|lors de) l embarquement|refus d embarquement)\b/),
  R('perturbation', 6, /\bderout\w*/),
  R('perturbation', 3, /\b(rebook\w*|reachemin\w*|autre vol|prochain vol)\b/),
  R('perturbation', 4, /\b(indemni\w*|dedommag\w*|ce 261)\b/),
  R('perturbation', 6, /\b(rate|rater|manque|manquer|loupe|louper)\b (mon|ma|le|la|notre|son) (vol|avion|correspondance)\b/),
  R('perturbation', 3, /\bbloquee?s?\b/),
  R('perturbation', 5, /\bvol\b.{0,30}\b(avance|decale|reporte)\w*|\b(avance|decale|reporte)\w*\b.{0,15}\b(mon|le|notre|son) vol\b/),
  R('perturbation', 2, /\b(meteo|orage|neige|brouillard|tempete)\b/),

  // --- Objets perdus ---
  R('objet_perdu', 6, new RegExp(`\\b${VERBES_PERTE}\\b.{0,40}\\b${ITEMS}\\b`)),
  R('objet_perdu', 6, new RegExp(`\\b${ITEMS}\\b.{0,30}\\b${VERBES_PERTE}\\b`)),
  R('objet_perdu', 6, /\bobjets? trouves?\b/),

  // --- Bagages ---
  R('bagage', 3, /\b(valises?|bagages?|soute|cabine|tapis|bagagerie)\b/),
  R('bagage', 3, /\b(trottinette|hoverboard|gyropode|poussette|skis?|velo|planche|surf|golf|guitare|violon|instrument|siege auto|liquides?|ml|parfum|gourde|batterie|power bank|franchise|excedent|kg|kilos?)\b/),
  R('bagage', 2, /\b(pas sortie?|pas arrivee?|jamais arrivee?)\b/),
  R('bagage', 2, /\bdepot (de )?bagages?\b/),

  // --- Enregistrement ---
  R('enregistrement', 4, /\b(enregistr\w*|checkin)\b/),
  R('enregistrement', 2, /\bcomptoirs?\b/),
  R('enregistrement', 4, /\b(carte d embarquement|boarding pass)\b/),
  R('enregistrement', 2, /\bbornes?\b/),
  R('enregistrement', 4, /\bembarquement\b.{0,20}\b(ferme|fermee|termine|clos)\b|\bporte (est )?fermee\b/),

  // --- Facturation ---
  R('facturation', 5, /\b(debite|debitee|debiter|double debit|preleve|prelevee|prelevement)\b/),
  R('facturation', 5, /\bfactur\w*/),
  R('facturation', 4, /\brembours\w*/),
  R('facturation', 4, /\b(un|le|mon|du|de) recu\b|\bjustificatif de paiement\b|\bnote de frais\b/),
  R('facturation', 3, /\b(payer|paye|payee|paiement|regle|reglement)\b/),
  R('facturation', 2, /\b(carte bancaire|plusieurs fois|en \d+ fois|deux fois|en double)\b/),
  R('facturation', 3, /\bmontant\b/),

  // --- Réservation ---
  R('reservation', 3, /\breserv\w*/),
  R('reservation', 4, /\b(modifier|changer|decaler|reporter)\b.{0,30}\b(date|vol|reservation|billet|nom|passager|heure)\b/),
  R('reservation', 4, /\bannuler\b.{0,30}\b(reservation|vol|billet|voyage)\b/),
  R('reservation', 4, /\bacheter\b.{0,20}\b(billets?|vols?|places?)\b/),
  R('reservation', 1, /\bbillets?\b/),
  R('reservation', 2, /\b(sieges?|hublot|couloir|surclass\w*|business)\b/),
  R('reservation', 5, /\bmal orthographi\w*|\b(erreur|faute) (sur|dans) (le|mon) nom\b/),
  R('reservation', 3, /\bgroupe de \d+|\baller simple\b|\baller retour\b/),

  // --- Assistance ---
  R('assistance', 5, /\b(pmr|mobilite reduite|fauteuil|handicap\w*|malvoyant\w*|aveugle|non voyant|sourd\w*|malentendant\w*|chien guide|chien d assistance|autis\w*|enceinte|oxygene|bequilles?|deambulateur|accompagnement)\b/),
  R('assistance', 2, /\bassistance\b/),

  // --- Accès / transports ---
  R('acces', 4, /\b(parkings?|garer|stationn\w*|p1|p2|navettes?|tram|tramway|rer|metro|trains?|gare|bus|taxis?|vtc|uber|location de voitures?|loueur|depose minute|transports? en commun|centre ville|barriere)\b/),
  R('acces', 2, /\b(venir|aller) (a|jusqu a) l aeroport\b/),

  // --- Services ---
  R('services', 4, /\b(wifi|internet|salons?|lounge|restaurants?|manger|cafe|snack|boutiques?|duty free|shopping|pharmacie|bureau de change|devises|consigne|douches?|fumeurs?|cigarette|priere|recharg\w*|prises?|distributeurs?|toilettes|nursery|massage|vegetarien|halal)\b/),

  // --- Informations générales ---
  R('information', 5, /\b(voyage seul|voyager seul|voyagent seuls?|non accompagnee?s?|mineurs?)\b/),
  R('information', 3, /\b(visa|documents?|papiers|passeport|carte d identite|esta|autorisation de sortie)\b/),
  R('information', 4, /\b(chat|chien|animal|animaux|lapin|oiseau)\b/),
  R('information', 3, /\b(combien de temps avant|a quelle heure (dois|faut)|arriver a l aeroport)\b/),
  R('information', 1, /\b(boeing|777|787|dreamliner|flotte|avion|appareil|terminal|terminaux|horaires?|statut|destinations?|desservez|bebe|nourrisson|enfant|bonjour|salut|merci|zephyr)\b/)
];

// "je suis en retard" = le voyageur est en retard, pas le vol
function neutraliser(n) {
  return n.replace(/\b(je suis|je serai|nous sommes|on est|nous serons|suis) en retard\b/g, 'voyageur tardif');
}

export function classerCategorie(n) {
  const t = neutraliser(n);
  const scores = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  for (const r of REGLES) if (r.re.test(t)) scores[r.cat] += r.poids;
  let meilleure = 'information', max = 0;
  for (const c of CATEGORIES) if (scores[c] > max) { max = scores[c]; meilleure = c; }
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { categorie: meilleure, scores, certitude: total ? max / total : 0, score: max };
}

// ---------- Urgence ----------
const HAUTE_MOTS = /\b(urgent|urgente|urgence|au plus vite|le plus vite|tout de suite|immediatement|vite|asap|sos|au secours|a l aide)\b/;
const MINUTES = /\b(dans|d ici|reste|encore|plus que|seulement|que) (\d+) ?(min|mn|minutes?)\b/;
const BIENTOT = /\bdans (moins d )?(une|1) ?(h|heure)\b|\bdans (une|un) (demi heure|quart d heure)\b|\bdans quelques minutes\b|\bdans (une|1) h\d+\b/;
const FERME = /\b(ferme|ferment|termine|clos)\w* dans\b|\b(embarquement|porte|comptoir)\b.{0,25}\b(ferme|fermee|termine|clos)\b/;
const HYPOTHESE = /\b(en cas de|si jamais|que se passe t il si|que faire si|au cas ou|si mon vol|si ma valise|si mon bagage|si je)\b/;
const PASSE = /\b(hier|avant hier|la semaine derniere|le mois dernier|l an dernier|l annee derniere|il y a \d+ (jours?|semaines?|mois|ans?))\b/;
const RECENT = /\b(a l instant|je viens de|vient de|viennent de|il y a \d+ ?(min|mn|minutes?)|tout a l heure|il y a (une|1) heure)\b/;
const PROBLEME = /\b(ne (fonctionne|marche|s ouvre|passe|charge|repond|correspond)\w* (pas|plus)|n arrive pas|impossible|erreur|bug|refusee?|personne n est venu|attends? depuis|toujours pas|pas recu|en panne|panne|inconnu|non autorise|frauduleu\w*|a tort|alors qu\w*|echoue\w*|mal orthographi\w*|deux fois|en double)\b/;

function urgenceTemps(t) {
  if (HAUTE_MOTS.test(t) || BIENTOT.test(t) || FERME.test(t)) return true;
  const m = t.match(MINUTES);
  return !!(m && Number(m[2]) <= 90);
}

export function classerUrgence(n, categorie) {
  const t = neutraliser(n);
  if (urgenceTemps(t)) return 'haute';
  if (HYPOTHESE.test(t)) return 'basse';

  switch (categorie) {
    case 'securite':
      return PASSE.test(t) ? 'moyenne' : 'haute';
    case 'perturbation':
      if (/\bvol\b[^.?!]{0,40}\b(annule|annulee|supprime)\b|\b(annulation|annule)\b[^.?!]{0,25}\bvol\b|\b(annule|annulee)\b/.test(t)) return 'haute';
      if (/\bcorrespondance\b/.test(t) && /\b(rate|ratee|manque|manquee|loupe|retard|serree|atterri|courte|pas le temps)\w*/.test(t)) return 'haute';
      if (/\b(rate|rater|manque|manquer|loupe|louper)\b (mon|ma|le|la|notre|son) (vol|avion|correspondance)\b|\bbloquee?s?\b|\bsurbook\w*|\brefuse (a|lors de) l embarquement|\bderout\w*/.test(t)) return 'haute';
      if (/\b(retard\w*|greve|indemni\w*|dedommag\w*|avance|decale|reporte)\b/.test(t)) return 'moyenne';
      return 'basse';
    case 'bagage':
      return /\b(pas sortie?|pas arrivee?|jamais arrivee?|perdue?s?|manquante?s?|manque|cassee?s?|abimee?s?|endommagee?s?|dechiree?s?|arrachee?|ouverte?|volee?s?|toujours pas|retard\w*)\b/.test(t) || PROBLEME.test(t) ? 'moyenne' : 'basse';
    case 'objet_perdu':
      return RECENT.test(t) ? 'moyenne' : 'basse';
    default:
      return PROBLEME.test(t) ? 'moyenne' : 'basse';
  }
}

export function classer(texte) {
  const n = normaliser(texte);
  const c = classerCategorie(n);
  return { ...c, urgence: classerUrgence(n, c.categorie), normalise: n };
}
