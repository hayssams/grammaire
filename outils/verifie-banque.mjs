// Vérifie la banque de phrases de classes-grammaticales.html : effectifs, cibles, classes, caméléons.
// Usage : node outils/verifie-banque.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const fichier = join(dirname(fileURLToPath(import.meta.url)), "..", "classes-grammaticales.html");
const html = readFileSync(fichier, "utf8");

function extraire(nom) {
  const m = html.match(new RegExp(`const ${nom}\\s*=\\s*\\[[\\s\\S]*?\\n\\];`));
  if (!m) throw new Error(`${nom} introuvable`);
  return new Function(m[0] + `; return ${nom};`)();
}

const CLASSES_IDS = ["nom","verbe","adjectif","determinant","pronom","adverbe","preposition","conjonction","interjection"];
// Anciennes banques : la nouvelle ne doit rien en reprendre.
const ANCIENS_CAM = ["le","que","ferme","bien","rire","son","juste","fort","pas","même","car","vers","avant"];
const ANCIEN_MEMO = ["orage","chante","gris","trois","te","vite","sous","mais","chut"];

let erreurs = 0;
const echec = msg => { console.error("ÉCHEC : " + msg); erreurs++; };
const cibles = s => (String(s).match(/\[\[(.+?)\]\]/g) || []).map(t => t.slice(2, -2));

const QUIZ = extraire("QUIZ"), CAM = extraire("CAM"), MEMO = extraire("MEMO");

// QUIZ : 54 phrases, 6 par classe, une cible unique, une explication.
if (QUIZ.length !== 54) echec(`QUIZ compte ${QUIZ.length} phrases au lieu de 54`);
for (const id of CLASSES_IDS) {
  const n = QUIZ.filter(q => q.c === id).length;
  if (n !== 6) echec(`QUIZ : ${n} phrase(s) pour ${id} au lieu de 6`);
}
for (const q of QUIZ) {
  if (cibles(q.s).length !== 1) echec(`QUIZ : cible [[...]] absente ou multiple dans « ${q.s} »`);
  if (!CLASSES_IDS.includes(q.c)) echec(`QUIZ : classe inconnue « ${q.c} »`);
  if (!q.w) echec(`QUIZ : explication w manquante dans « ${q.s} »`);
}

// CAM : 13 caméléons neufs, même mot des deux côtés, deux classes différentes.
if (CAM.length !== 13) echec(`CAM compte ${CAM.length} caméléons au lieu de 13`);
for (const c of CAM) {
  if (ANCIENS_CAM.includes(c.w.toLowerCase())) echec(`CAM : « ${c.w} » figurait déjà dans l'ancienne banque`);
  for (const ph of [c.a, c.b]) {
    const t = cibles(ph.s);
    if (t.length !== 1) echec(`CAM : cible absente ou multiple dans « ${ph.s} »`);
    else if (t[0].toLowerCase() !== c.w.toLowerCase())
      echec(`CAM : la cible de « ${ph.s} » ne correspond pas au mot « ${c.w} »`);
    if (!CLASSES_IDS.includes(ph.c)) echec(`CAM : classe inconnue « ${ph.c} »`);
  }
  if (c.a.c === c.b.c) echec(`CAM : « ${c.w} » porte deux fois la même classe`);
  if (!c.t) echec(`CAM : test t manquant pour « ${c.w} »`);
}

// MEMO : 9 exemples neufs, un par classe.
if (MEMO.length !== 9) echec(`MEMO compte ${MEMO.length} exemples au lieu de 9`);
const couvertes = new Set(MEMO.map(m => m.c));
for (const id of CLASSES_IDS) if (!couvertes.has(id)) echec(`MEMO : classe ${id} absente`);
for (const m of MEMO) {
  const t = cibles(m.s);
  if (t.length !== 1) echec(`MEMO : cible absente ou multiple dans « ${m.s} »`);
  else if (ANCIEN_MEMO.includes(t[0].toLowerCase())) echec(`MEMO : « ${m.s} » reprend l'ancien exemple`);
}

console.log(erreurs ? `${erreurs} erreur(s).` : "La banque est conforme : 54 phrases, 13 caméléons, 9 exemples.");
process.exit(erreurs ? 1 : 0);
