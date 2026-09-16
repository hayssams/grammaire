// Controle le carnet masse-volumique.html : compilation du script, forme des questions, tables de valeurs.
// Usage : node outils/verifie-masse.mjs [fichier]
import { readFileSync } from "node:fs";

const fichier = process.argv[2] || "masse-volumique.html";
const html = readFileSync(fichier, "utf8");
const bloc = html.match(/<script>([\s\S]*?)<\/script>/);
if (!bloc) { console.error(`${fichier} : aucun <script> trouvé.`); process.exit(2); }
const src = bloc[1];

let pbs = 0;
const pb = m => { console.error("PROBLÈME : " + m); pbs++; };

// new Function compile sans executer : une erreur de syntaxe est attrapee ici.
try { new Function(src); } catch (e) { pb(`le script ne compile pas : ${e.message}`); }

const table = nom => {
  const m = src.match(new RegExp(`const ${nom}\\s*=\\s*\\[[\\s\\S]*?\\n\\];`));
  return m ? new Function(m[0] + `; return ${nom};`)() : null;
};

const NOMS = ["FORMULE", "MESURER", "UNITES", "IDENTIFIER", "FLOTTER"];
let trouvees = 0;
for (const nom of NOMS) {
  const qs = table(nom);
  if (!qs) continue;
  trouvees++;
  if (qs.length < 6) pb(`${nom} ne contient que ${qs.length} question(s), il en faut au moins 6.`);
  qs.forEach((q, i) => {
    const ou = `${nom}[${i}]`;
    if (!q.q) pb(`${ou} : pas d'énoncé (q).`);
    if (!q.w) pb(`${ou} : pas d'explication (w).`);
    if (!q.rep) pb(`${ou} : pas de réponse affichée (rep).`);
    if (q.kind === "qcm") {
      if (!Array.isArray(q.ch) || q.ch.length < 2) pb(`${ou} : il faut au moins deux propositions (ch).`);
      else if (!Number.isInteger(q.good) || q.good < 0 || q.good >= q.ch.length) pb(`${ou} : good = ${q.good} ne désigne aucune proposition.`);
    } else if (q.kind === "num") {
      if (!Number.isFinite(q.ans)) pb(`${ou} : ans n'est pas un nombre.`);
      if (!q.unit) pb(`${ou} : pas d'unité (unit).`);
    } else pb(`${ou} : kind vaut « ${q.kind} », attendu "qcm" ou "num".`);
  });
}
if (!trouvees) pb("aucune manche trouvée (FORMULE, MESURER, UNITES, IDENTIFIER, FLOTTER).");

for (const nom of ["METAUX", "LIQUIDES"]) {
  const t = table(nom);
  if (!t) { pb(`${nom} introuvable.`); continue; }
  t.forEach((e, i) => {
    if (!e.nom) pb(`${nom}[${i}] : pas de nom.`);
    if (!(e.rho > 0)) pb(`${nom}[${i}] : rho doit être un nombre positif.`);
    if (i && t[i - 1].rho > e.rho) pb(`${nom} n'est pas trié par masse volumique croissante (${t[i - 1].nom} avant ${e.nom}).`);
  });
}

console.log(pbs ? `${pbs} problème(s).` : `${trouvees} manche(s) contrôlée(s) : le carnet est conforme.`);
process.exit(pbs ? 1 : 0);
