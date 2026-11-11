// Évaluation de Zéphyr sur tests/cas.json
// Lancement : node tests/evaluer.js   (ou : node tests/evaluer.js chemin/vers/autre.json)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyser } from '../agent/agent.js';

const ici = path.dirname(fileURLToPath(import.meta.url));
const fichier = process.argv[2] || path.join(ici, 'cas.json');
const { cas } = JSON.parse(await readFile(fichier, 'utf8'));

let okCat = 0, okUrg = 0, okTout = 0, sansReponse = 0;
const parCat = {}, erreurs = [];
const t0 = performance.now();

for (const c of cas) {
  const a = analyser(c.texte);
  const bonCat = a.categorie === c.categorie, bonUrg = a.urgence === c.urgence;
  okCat += bonCat; okUrg += bonUrg; okTout += bonCat && bonUrg;
  if (!a.reponse) sansReponse++;
  const p = (parCat[c.categorie] ??= { total: 0, cat: 0, urg: 0 });
  p.total++; p.cat += bonCat; p.urg += bonUrg;
  if (!bonCat || !bonUrg) erreurs.push({ c, a });
}
const ms = performance.now() - t0;
const pct = (x, n) => (100 * x / n).toFixed(1).padStart(5) + ' %';

console.log(`\nZéphyr : ${cas.length} cas analysés en ${ms.toFixed(1)} ms (${(ms / cas.length).toFixed(3)} ms par message)\n`);
console.log('Catégorie        Cas   Catégorie   Urgence');
for (const [k, v] of Object.entries(parCat)) {
  console.log(`${k.padEnd(16)} ${String(v.total).padStart(3)}   ${pct(v.cat, v.total)}   ${pct(v.urg, v.total)}`);
}
console.log('-'.repeat(44));
console.log(`TOTAL            ${String(cas.length).padStart(3)}   ${pct(okCat, cas.length)}   ${pct(okUrg, cas.length)}`);
console.log(`Les deux justes : ${pct(okTout, cas.length)}   ·   Réponses générées : ${cas.length - sansReponse}/${cas.length}\n`);

if (erreurs.length) {
  console.log('Erreurs :');
  for (const { c, a } of erreurs) {
    console.log(`  « ${c.texte} »`);
    console.log(`     attendu ${c.categorie}/${c.urgence}  →  obtenu ${a.categorie}/${a.urgence}`);
  }
  process.exitCode = 1;
} else {
  console.log('Aucune erreur. ✔');
}
