// =============================================================
//  Aéroport Émeraude — serveur Node.js (sans dépendance)
//  - Sert les fichiers du site (index.html, img/, vendor/...)
//  - POST /api/chat    : assistant Zéphyr, streaming SSE
//                        événements : analyse, token, done, error
//      1) l'agent instantané (agent/) classe la demande et répond en < 1 ms
//      2) seules les questions qu'il ne sait pas traiter vont à Ollama,
//         avec les fiches de connaissances utiles (réponses plus justes)
//  - POST /api/analyse : { message } ou { messages: [...] } → catégorie, urgence, réponse
//  - GET  /api/analyse?q=... : idem pour un message
//  - GET  /api/status  : état d'Ollama et du modèle
//  Lancement : npm start   (ou : MODEL=qwen2.5:1.5b npm start)
//  Tests     : npm test
// =============================================================
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyser } from './agent/agent.js';
import { normaliser } from './agent/classifieur.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Configuration (modifiable par variables d'environnement) ----------
const PORT = Number(process.env.PORT) || 3000;
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.MODEL || 'llama3.2:1b';      // léger en RAM (~1,3 Go)
const KEEP_ALIVE = process.env.KEEP_ALIVE || '30m';     // modèle gardé en mémoire : pas de rechargement lent
const IA_SEULEMENT = process.env.IA_SEULEMENT === '1';  // 1 = toujours passer par Ollama (comparaison)
const OPTIONS_OLLAMA = {
  num_ctx: Number(process.env.NUM_CTX) || 2048,
  num_predict: 220,                                     // réponses courtes = plus rapides
  temperature: 0.3,
  top_p: 0.9,
  repeat_penalty: 1.1
};
const DELAI_PREMIER_TOKEN = 90_000;
const TAILLE_MAX_CORPS = 32 * 1024;
const TAILLE_CACHE = 300;

const TYPES_MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2'
};

// ---------- Consigne système de Zéphyr ----------
const PROMPT_SYSTEME = `Tu es Zéphyr, l'assistant de l'Aéroport Émeraude (site de démonstration d'un projet BTS SIO).
Réponds toujours en français, poliment, en 120 mots maximum, avec des phrases simples.
N'invente jamais d'information. Si tu ne sais pas, dis-le et oriente vers le comptoir information du Terminal 1.
Les prix du site sont SIMULÉS : ne prétends jamais qu'il s'agit de tarifs réels d'une compagnie aérienne.
En cas de danger ou d'urgence médicale, commence toujours par : appeler le 112 ou prévenir l'agent le plus proche.

Informations fiables :
- 2 terminaux : T1 Europe, T2 International. Ouvert 24h/24. Arriver 2 h avant en Europe, 3 h avant en international.
- Bagage cabine : 55×35×25 cm, 10 kg, inclus pour tous. Liquides en contenants de 100 ml.
- Soute 23 kg : 0 inclus en Économique, 1 en Premium Economy, 2 en Business. Bagage supplémentaire : 60 € aller-retour. Bagage cabine supplémentaire : 30 € aller-retour.
- Sièges : en Économique, standard gratuit, Premium (3 premiers rangs) +35 € par trajet, issue de secours +45 € (adultes uniquement). Premium Economy : premiers rangs +25 €. Business : tous inclus.
- Flotte : Boeing 777-300ER (400 sièges, 3-4-3 en Économique) et Boeing 787-9 Dreamliner (304 sièges, 3-3-3, plus silencieux, grands hublots).
- Réservation sur le site : recherche, choix du vol, choix des sièges (plan et vue 3D), passagers, paiement simulé, billet de démonstration.
- Parking P1 4 €/h, P2 19 €/jour avec navette gratuite toutes les 10 min. Tram ligne E toutes les 8 min de 5 h à minuit. Taxis devant chaque terminal.
- Salons Feuille (T1) et Canopée (T2) : 35 € sans carte. Wi-Fi gratuit. Assistance PMR gratuite, à réserver 48 h avant au 01 23 45 67 89.
- Consigne bagages au T1 (9 €/jour). Objets trouvés : T1 niveau 0.
- Vol annulé ou retardé : contacter la compagnie et les agents du hall central.`;

// ---------- Cache des réponses de l'IA (questions déjà posées = réponse immédiate) ----------
const cache = new Map();
function lireCache(cle) {
  if (!cache.has(cle)) return null;
  const v = cache.get(cle);
  cache.delete(cle); cache.set(cle, v); // remonte en tête (LRU)
  return v;
}
function ecrireCache(cle, valeur) {
  cache.set(cle, valeur);
  if (cache.size > TAILLE_CACHE) cache.delete(cache.keys().next().value);
}

// ---------- Outils HTTP ----------
function envoyerJSON(res, code, objet) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(objet));
}

function sse(res, evenement, donnees) {
  if (!res.writableEnded && !res.destroyed) {
    res.write(`event: ${evenement}\ndata: ${JSON.stringify(donnees)}\n\n`);
  }
}

function lireCorps(req) {
  return new Promise((ok, ko) => {
    let taille = 0;
    const morceaux = [];
    req.on('data', c => {
      taille += c.length;
      if (taille > TAILLE_MAX_CORPS) {
        ko(Object.assign(new Error('Requête trop volumineuse'), { code: 413 }));
        req.destroy();
      } else {
        morceaux.push(c);
      }
    });
    req.on('end', () => ok(Buffer.concat(morceaux).toString('utf8')));
    req.on('error', ko);
  });
}

const resumeAnalyse = a => ({ categorie: a.categorie, urgence: a.urgence, intention: a.intention, confiance: a.confiance, duree_ms: a.duree_ms });

// Envoie une réponse déjà prête, découpée en petits morceaux (effet de frappe immédiat)
function envoyerTexte(res, texte) {
  for (const morceau of texte.match(/\S+\s*/g) || [texte]) sse(res, 'token', { token: morceau });
}

// ---------- POST /api/chat ----------
async function gererChat(req, res) {
  let corps;
  try {
    corps = JSON.parse((await lireCorps(req)) || '{}');
  } catch (e) {
    return envoyerJSON(res, e.code === 413 ? 413 : 400, { erreur: e.code === 413 ? e.message : 'JSON invalide' });
  }

  const message = typeof corps.message === 'string' ? corps.message.trim().slice(0, 1000) : '';
  if (!message) return envoyerJSON(res, 400, { erreur: 'Le champ "message" est vide.' });

  const historique = Array.isArray(corps.history)
    ? corps.history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }))
    : [];
  const contexte = typeof corps.contexte === 'string' ? corps.contexte.slice(0, 1500) : '';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();

  // 1) Analyse instantanée
  const a = analyser(message, { contexte });
  sse(res, 'analyse', resumeAnalyse(a));
  console.log(`[Zéphyr] ${a.categorie}/${a.urgence} ${a.intention || '-'} (${a.duree_ms} ms) « ${message.slice(0, 60)} »`);

  // 2) Réponse directe : intention reconnue ou urgence haute (aucune attente)
  const longue = message.length > 220 || (message.match(/\?/g) || []).length > 1;
  if (!IA_SEULEMENT && a.instantane && (!longue || a.urgence === 'haute')) {
    envoyerTexte(res, a.reponse);
    sse(res, 'done', { mode: 'instant', ...resumeAnalyse(a) });
    return res.end();
  }

  // 3) Réponse déjà générée par l'IA pour la même question
  const cle = normaliser(message);
  const enCache = historique.length === 0 && lireCache(cle);
  if (enCache) {
    envoyerTexte(res, enCache);
    sse(res, 'done', { mode: 'cache', ...resumeAnalyse(a) });
    return res.end();
  }

  // 4) IA locale, guidée par l'analyse et les fiches de connaissances
  const controleur = new AbortController();
  res.on('close', () => { if (!res.writableFinished) controleur.abort(); });
  const minuteur = setTimeout(() => controleur.abort(new Error('délai dépassé')), DELAI_PREMIER_TOKEN);

  const guide = [
    `Analyse de la demande : catégorie « ${a.categorie} », urgence « ${a.urgence} ».`,
    a.connaissances.length ? 'Fiches utiles (sources fiables, à reformuler) :\n- ' + a.connaissances.join('\n- ') : '',
    contexte ? `Informations actuelles du site :\n${contexte}` : ''
  ].filter(Boolean).join('\n\n');

  let nbTokens = 0, texteIA = '';
  try {
    const reponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controleur.signal,
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        keep_alive: KEEP_ALIVE,
        options: OPTIONS_OLLAMA,
        messages: [
          { role: 'system', content: PROMPT_SYSTEME + '\n\n' + guide },
          ...historique,
          { role: 'user', content: message }
        ]
      })
    });

    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => '');
      throw new Error(`Ollama a répondu ${reponse.status} ${detail.slice(0, 200)}`);
    }

    const decodeur = new TextDecoder();
    let tampon = '';
    for await (const morceau of reponse.body) {
      tampon += decodeur.decode(morceau, { stream: true });
      let i;
      while ((i = tampon.indexOf('\n')) >= 0) {
        const ligne = tampon.slice(0, i).trim();
        tampon = tampon.slice(i + 1);
        if (!ligne) continue;
        const obj = JSON.parse(ligne);
        if (obj.error) throw new Error(obj.error);
        const texte = obj.message?.content;
        if (texte) {
          if (nbTokens === 0) clearTimeout(minuteur);
          nbTokens++;
          texteIA += texte;
          sse(res, 'token', { token: texte });
        }
        if (obj.done) {
          clearTimeout(minuteur);
          if (texteIA.trim() && historique.length === 0) ecrireCache(cle, texteIA);
          sse(res, 'done', { mode: 'ia', modele: MODEL, tokens: nbTokens, ...resumeAnalyse(a) });
          return res.end();
        }
      }
    }
    clearTimeout(minuteur);
    sse(res, 'done', { mode: 'ia', modele: MODEL, tokens: nbTokens, ...resumeAnalyse(a) });
    res.end();
  } catch (err) {
    clearTimeout(minuteur);
    if (res.writableEnded || res.destroyed) return;
    const raison = err.cause?.code === 'ECONNREFUSED' ? 'Ollama n’est pas lancé' : (err.message || String(err));
    console.warn(`[Zéphyr] ${raison}`);

    if (nbTokens > 0) {
      sse(res, 'error', { message: 'La génération a été interrompue : ' + raison });
      return res.end();
    }
    // Repli : la meilleure réponse de l'agent instantané
    envoyerTexte(res, a.reponse + '\n\n(Mode secours : l’IA locale ne répond pas, cette réponse vient de la base de connaissances.)');
    sse(res, 'done', { mode: 'secours', raison, ...resumeAnalyse(a) });
    res.end();
  }
}

// ---------- /api/analyse ----------
async function gererAnalyse(req, res) {
  if (req.method === 'GET') {
    const q = new URL(req.url, 'http://localhost').searchParams.get('q') || '';
    if (!q.trim()) return envoyerJSON(res, 400, { erreur: 'Paramètre q manquant.' });
    return envoyerJSON(res, 200, analyser(q.slice(0, 1000)));
  }
  if (req.method !== 'POST') return envoyerJSON(res, 405, { erreur: 'Utilisez GET ou POST' });
  let corps;
  try { corps = JSON.parse((await lireCorps(req)) || '{}'); }
  catch (e) { return envoyerJSON(res, e.code === 413 ? 413 : 400, { erreur: 'JSON invalide' }); }
  if (Array.isArray(corps.messages)) {
    return envoyerJSON(res, 200, { resultats: corps.messages.slice(0, 500).map(m => analyser(String(m).slice(0, 1000))) });
  }
  if (typeof corps.message !== 'string' || !corps.message.trim()) return envoyerJSON(res, 400, { erreur: 'Champ message manquant.' });
  envoyerJSON(res, 200, analyser(corps.message.slice(0, 1000), { contexte: corps.contexte }));
}

// ---------- GET /api/status ----------
async function gererStatut(res) {
  let ollama = false, installe = false, modeles = [];
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (r.ok) {
      ollama = true;
      const j = await r.json();
      modeles = (j.models || []).map(m => m.name);
      installe = modeles.includes(MODEL) || modeles.includes(MODEL + ':latest');
    }
  } catch { /* Ollama arrêté */ }
  envoyerJSON(res, 200, { serveur: true, agent: true, ollama, modele: MODEL, modeleInstalle: installe, modeles, cache: cache.size });
}

// ---------- Fichiers statiques ----------
async function servirFichier(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let chemin;
  try {
    chemin = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Requête invalide');
  }
  if (chemin === '/') chemin = '/index.html';

  const absolu = path.normalize(path.join(__dirname, chemin));
  const relatif = path.relative(__dirname, absolu);
  const interdit = relatif.startsWith('..') || path.isAbsolute(relatif)
    || relatif.split(path.sep).some(p => p.startsWith('.'))
    || relatif.startsWith('node_modules') || relatif === 'server.js'
    || relatif.startsWith('agent') || relatif.startsWith('tests');

  const introuvable = () => {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Page non trouvée');
  };
  if (interdit) return introuvable();

  try {
    const info = await stat(absolu);
    if (!info.isFile()) return introuvable();
    const contenu = await readFile(absolu);
    res.writeHead(200, {
      'Content-Type': TYPES_MIME[path.extname(absolu).toLowerCase()] || 'application/octet-stream',
      'Content-Length': contenu.length,
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : contenu);
  } catch {
    introuvable();
  }
}

// ---------- Préchargement du modèle (évite l'attente de la première question) ----------
async function prechargerModele() {
  try {
    await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt: '', keep_alive: KEEP_ALIVE }),
      signal: AbortSignal.timeout(120_000)
    });
    console.log('   Modèle préchargé en mémoire.');
  } catch { /* sans importance : l'agent instantané fonctionne sans Ollama */ }
}

// ---------- Serveur ----------
const serveur = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const traitement = (async () => {
    if (url === '/api/chat') {
      if (req.method !== 'POST') return envoyerJSON(res, 405, { erreur: 'Utilisez POST' });
      return gererChat(req, res);
    }
    if (url === '/api/analyse') return gererAnalyse(req, res);
    if (url === '/api/status') return gererStatut(res);
    return servirFichier(req, res);
  })();

  traitement.catch(err => {
    console.error('[Serveur]', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erreur interne');
    } else if (!res.writableEnded) {
      res.end();
    }
  });
});

serveur.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Arrêtez l’autre serveur (Ctrl+C) ou lancez : PORT=3001 npm start`);
    process.exit(1);
  }
  throw e;
});

serveur.listen(PORT, '0.0.0.0', async () => {
  console.log(`✈  Aéroport Émeraude : http://localhost:${PORT}`);
  console.log(`   Agent instantané Zéphyr : actif (réponses en moins d’1 ms)`);
  console.log(`   IA locale : ${MODEL} (contexte ${OPTIONS_OLLAMA.num_ctx} tokens)`);
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    const noms = (j.models || []).map(m => m.name);
    const ok = noms.includes(MODEL) || noms.includes(MODEL + ':latest');
    console.log(ok ? '   Ollama : OK, modèle disponible.' : `   Ollama : lancé, mais le modèle est absent → ollama pull ${MODEL}`);
    if (ok) prechargerModele();
  } catch {
    console.log('   Ollama : injoignable → Zéphyr répond avec l’agent instantané uniquement (lancez : ollama serve).');
  }
});