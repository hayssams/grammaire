// Controle le carnet masse-volumique.html : compilation du script, forme des questions, tables de
// valeurs, ancres de montage et cablage des manches (onglets / panneaux / MANCHES).
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
const TABLES = {};
let trouvees = 0;
for (const nom of NOMS) {
  const qs = table(nom);
  if (!qs) continue;
  TABLES[nom] = qs;
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

// 1. Les quatre ancres de montage : chacune doit exister, exactement une fois, sous sa forme
// litterale exacte (espaces compris devant "fin des manches").
const ANCRES = [
  "/* ============ moteurs ============ */",
  "/* ============ donnees ============ */",
  "/* ============ les manches ============ */",
  "  /* fin des manches */",
];
for (const a of ANCRES) {
  const n = src.split(a).length - 1;
  if (n !== 1) pb(`fichier ${fichier} : l'ancre ${JSON.stringify(a)} apparaît ${n} fois (il en faut exactement une).`);
}

// 2. Le cablage : les data-panel des onglets, les id des panneaux et les cles de MANCHES doivent
// former le meme ensemble. On extrait les cles de MANCHES par expression reguliere plutot qu'en
// executant le script, car creeManche() suppose un DOM. Chaque entree de MANCHES doit donc garder
// sa forme actuelle, sur une seule ligne : cle:creeManche({panel:"#cle",game:"cle",donnees:NOM,
// Si cette forme d'ecriture change, revoir la regex RE_MANCHE ci-dessous.
const onglets = [...html.matchAll(/data-panel="([^"]+)"/g)].map(m => m[1]);
const panels = [...html.matchAll(/<section\s+class="panel[^"]*"\s+id="([^"]+)"/g)].map(m => m[1]);
const RE_MANCHE = /^\s*(\w+):creeManche\(\{panel:"#(\w+)",game:"(\w+)",donnees:(\w+),/gm;
const entrees = [...src.matchAll(RE_MANCHE)];
const manches = entrees.map(m => m[1]);

const setOnglets = new Set(onglets), setPanels = new Set(panels), setManches = new Set(manches);
const orphelins = (a, b, nomA, nomB) => {
  for (const x of a) if (!b.has(x)) pb(`« ${x} » : ${nomA} sans ${nomB}.`);
};
// Un onglet et son panneau vont toujours par paire, quel que soit l'avancement.
orphelins(setOnglets, setPanels, "onglet (data-panel)", "panneau correspondant");
orphelins(setPanels, setOnglets, "panneau", "onglet correspondant");
// Une manche sans onglet ni panneau est du code mort : toujours une erreur.
orphelins(setManches, setOnglets, "manche de MANCHES", "onglet correspondant");
orphelins(setManches, setPanels, "manche de MANCHES", "panneau correspondant");
// L'inverse depend de l'avancement. Le carnet se construit onglet par onglet : les cinq onglets
// sont poses d'un coup, les manches branchees une par une. Tant qu'un tableau de questions manque,
// un onglet pas encore branche est l'etat voulu, on l'annonce sans faire echouer. Des que les cinq
// manches sont la, le carnet est fini et un onglet muet redevient une erreur franche.
const enAttente = [...setOnglets].filter(x => !setManches.has(x));
if (enAttente.length) {
  if (trouvees === NOMS.length) orphelins(setOnglets, setManches, "onglet (data-panel)", "manche dans MANCHES");
  else console.log(`en chantier, onglets pas encore branchés : ${enAttente.join(", ")}.`);
}

// 3. Chaque entree de MANCHES doit etre coherente avec elle-meme : panel:"#x" et game:"x" pour la
// cle x.
for (const [, cle, panelVal, gameVal] of entrees) {
  if (panelVal !== cle) pb(`MANCHES.${cle} : panel vaut "#${panelVal}", attendu "#${cle}".`);
  if (gameVal !== cle) pb(`MANCHES.${cle} : game vaut "${gameVal}", attendu "${cle}".`);
}

// 4. Aucun tableau de questions orphelin : tout tableau declare parmi NOMS doit etre repris par un
// donnees: d'une entree de MANCHES.
const donneesUtilisees = new Set(entrees.map(m => m[4]));
for (const nom of NOMS) {
  if (TABLES[nom] && !donneesUtilisees.has(nom)) pb(`${nom} est déclaré mais n'est référencé par aucun donnees: de MANCHES.`);
}

// 5. Le suivi : logResult envoie bien page:"masse-volumique", et la derniere ligne du script
// demarre une manche qui existe dans MANCHES.
if (!/page:"masse-volumique"/.test(src)) pb(`logResult n'envoie pas page:"masse-volumique".`);

const lignes = src.trim().split("\n");
const derniereLigne = lignes[lignes.length - 1].trim();
const mDerniere = derniereLigne.match(/^MANCHES\.(\w+)\.intro\(\);$/);
if (!mDerniere) pb(`la dernière ligne du script ne démarre pas une manche (attendu MANCHES.<clé>.intro();, trouvé : ${JSON.stringify(derniereLigne)}).`);
else if (!setManches.has(mDerniere[1])) pb(`la dernière ligne démarre MANCHES.${mDerniere[1]}, absente de MANCHES.`);

console.log(pbs ? `${pbs} problème(s).` : `${trouvees} manche(s) contrôlée(s) : le carnet est conforme.`);
process.exit(pbs ? 1 : 0);
