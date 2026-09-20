// Controle le carnet thales-brevet.html : compilation du script, forme des questions, rendu des
// figures, cablage des manches, et surtout les mathematiques elles-memes. Le script reconstitue
// les longueurs de chaque figure, propage les relations de Thales, et compare le resultat a la
// reponse annoncee : une reponse fausse ne peut pas partir chez l'eleve.
// Il verifie aussi que les redactions types du carnet se retrouvent mot pour mot dans la fiche.
// Usage : node outils/verifie-thales.mjs [carnet] [fiche]
import { readFileSync } from "node:fs";

const fichier = process.argv[2] || "thales-brevet.html";
const fiche = process.argv[3] || "maths-memo.html";
const html = readFileSync(fichier, "utf8");

let pbs = 0;
const pb = m => { console.error("PROBLÈME : " + m); pbs++; };

const bloc = html.match(/<script>([\s\S]*?)<\/script>/);
if (!bloc) { console.error(`${fichier} : aucun <script> trouvé.`); process.exit(2); }
const src = bloc[1];

// new Function compile sans executer : une erreur de syntaxe est attrapee ici.
try { new Function(src); } catch (e) { pb(`le script ne compile pas : ${e.message}`); }

// ---------------------------------------------------------------- les ancres de montage
const ancre = t => src.indexOf(`/* ============ ${t} ============ */`);
const iMoteurs = ancre("moteurs"), iDonnees = ancre("donnees"), iGami = ancre("gamification"),
      iManches = ancre("les manches");
if (iMoteurs < 0 || iDonnees < 0 || iGami < 0 || iManches < 0 ||
    !(iMoteurs < iDonnees && iDonnees < iGami && iGami < iManches)) {
  console.error("PROBLÈME : les quatre ancres (moteurs, donnees, gamification, les manches) sont absentes ou dans le désordre.");
  process.exit(1);
}

// Les donnees appellent frac() et eq3(), qui vivent dans la tranche outils : on les remplace par
// des equivalents en texte brut, ce qui suffit pour charger les tableaux hors du navigateur.
const prelude = `function frac(a,b){return a+"/"+b;}
function eq3(p){return p.map(([a,b])=>a+"/"+b).join(" = ");}
function shuffle(a){return [...a];}\n`;

let D = null, moteurs = null;
try {
  D = new Function(prelude + src.slice(iDonnees, iGami) +
    "; return {ETAPES,REDACTIONS,AGRANDIR,SUJETS};")();
} catch (e) { pb(`les données ne se chargent pas : ${e.message}`); }
try {
  moteurs = new Function(src.slice(iMoteurs, iDonnees) + "; return {figSVG,figDuoSVG};")();
} catch (e) { pb(`les moteurs de figure ne compilent pas : ${e.message}`); }
if (!D || !moteurs) { console.error(`${pbs} problème(s).`); process.exit(1); }

// ---------------------------------------------------------------- forme des questions
function formeQuestion(ou, q) {
  if (!q.q) pb(`${ou} : pas d'énoncé (q).`);
  if (!q.w) pb(`${ou} : pas d'explication (w).`);
  if (!q.rep) pb(`${ou} : pas de réponse affichée (rep).`);
  if (q.kind === "qcm") {
    if (!Array.isArray(q.ch) || q.ch.length < 2) pb(`${ou} : il faut au moins deux propositions (ch).`);
    else if (!Number.isInteger(q.good) || q.good < 0 || q.good >= q.ch.length) pb(`${ou} : good = ${q.good} ne désigne aucune proposition.`);
  } else if (q.kind === "num") {
    if (!Number.isFinite(q.ans)) pb(`${ou} : ans n'est pas un nombre.`);
    if (q.unit === undefined) pb(`${ou} : pas d'unité (unit), mettre "" si la réponse n'en a pas.`);
  } else pb(`${ou} : kind vaut « ${q.kind} », attendu "qcm" ou "num".`);
}

// ---------------------------------------------------------------- les mathematiques
// Les huit segments d'une configuration de Thales, quel que soit l'ordre des lettres.
const SEGMENTS = ["AM", "MB", "AB", "AN", "NC", "AC", "MN", "BC"];
const nomSegment = (a, b) => SEGMENTS.find(s => (s[0] === a && s[1] === b) || (s[0] === b && s[1] === a));

// « 1,2 m » vaut 120 cm, « 40 cm » en vaut 40, « 3 » prend l'unite de la question.
function enCm(brut, unitQuestion) {
  const m = String(brut).replace(",", ".").match(/^\s*(-?\d+(?:\.\d+)?)\s*(cm|m)?\s*$/);
  if (!m) return null;
  const u = m[2] || unitQuestion;
  if (u !== "cm" && u !== "m") return null;
  return Number(m[1]) * (u === "m" ? 100 : 1);
}

// Propage les relations jusqu'a ne plus rien apprendre : les sommes de segments alignes, puis
// l'egalite des rapports de Thales. Rend la carte des longueurs connues, en centimetres.
function propage(type, connues, rapportDonne) {
  const val = { ...connues };
  const papillon = type === "papillon";
  // triangle : AB = AM + MB ; papillon : A est entre M et B, donc MB = AM + AB.
  const sommes = papillon
    ? [["MB", "AM", "AB"], ["NC", "AN", "AC"]]
    : [["AB", "AM", "MB"], ["AC", "AN", "NC"]];
  const paires = [["AM", "AB"], ["AN", "AC"], ["MN", "BC"]];
  let r = rapportDonne ?? null;
  for (let tour = 0; tour < 6; tour++) {
    for (const [tot, p1, p2] of sommes) {
      if (val[tot] === undefined && val[p1] !== undefined && val[p2] !== undefined) val[tot] = val[p1] + val[p2];
      else if (val[p1] === undefined && val[tot] !== undefined && val[p2] !== undefined) val[p1] = val[tot] - val[p2];
      else if (val[p2] === undefined && val[tot] !== undefined && val[p1] !== undefined) val[p2] = val[tot] - val[p1];
    }
    if (r === null) {
      const pleine = paires.find(([n, d]) => val[n] !== undefined && val[d] !== undefined && val[d] !== 0);
      if (pleine) r = val[pleine[0]] / val[pleine[1]];
    }
    if (r !== null) for (const [n, d] of paires) {
      if (val[n] === undefined && val[d] !== undefined) val[n] = r * val[d];
      else if (val[d] === undefined && val[n] !== undefined && r !== 0) val[d] = val[n] / r;
    }
  }
  return { val, r };
}

// Rejoue une question a figure : la reponse annoncee doit tomber d'elle-meme.
// Rend true si le controle a pu etre mene, false si la figure ne s'y prete pas.
function controleMaths(ou, f, q) {
  if (!f || !Array.isArray(f.lens)) return false;
  const connues = {};
  let cible = null;
  for (const L of f.lens) {
    const nom = nomSegment(L.a, L.b);
    if (!nom) { pb(`${ou} : le segment ${L.a}${L.b} n'est pas un segment de la configuration.`); return false; }
    if (L.v === "?") {
      if (cible) { pb(`${ou} : deux longueurs inconnues sur la même figure.`); return false; }
      cible = nom;
      continue;
    }
    const v = enCm(L.v, q.unit);
    if (v === null) return false; // une etiquette qui n'est pas une longueur (« 1 part »)
    connues[nom] = v;
  }
  if (!cible) return false;
  const { val } = propage(f.type, connues, q.rapport);
  if (val[cible] === undefined) { pb(`${ou} : ${cible} ne se déduit pas des longueurs données.`); return false; }
  const attendu = enCm(q.ans, q.unit);
  if (attendu === null) { pb(`${ou} : la réponse ${q.ans} n'est pas une longueur en cm ou en m.`); return false; }
  const tol = Math.max(0.01, (q.arrondi ? q.arrondi / 2 : 0) * (q.unit === "m" ? 100 : 1) + 0.001);
  if (Math.abs(val[cible] - attendu) > tol) {
    const enUnite = v => (q.unit === "m" ? v / 100 : v);
    pb(`${ou} : Thalès donne ${cible} = ${enUnite(val[cible]).toFixed(3)} ${q.unit}, mais ans vaut ${q.ans}.`);
  }
  return true;
}

let controlees = 0;

// 1. la manche A etapes
if (!Array.isArray(D.ETAPES) || D.ETAPES.length < 8) pb(`ETAPES ne contient que ${D.ETAPES?.length ?? 0} question(s), il en faut au moins 8.`);
(D.ETAPES || []).forEach((q, i) => {
  const ou = `ETAPES[${i}]`;
  formeQuestion(ou, { ...q, kind: "num" });
  if (!q.f) pb(`${ou} : pas de figure (f).`);
  else if (controleMaths(ou, q.f, q)) controlees++;
  else pb(`${ou} : aucun contrôle mathématique possible, il faut une inconnue « ? » sur la figure.`);
});

// 2. la manche Rediger
if (!Array.isArray(D.REDACTIONS) || D.REDACTIONS.length < 5) pb(`REDACTIONS ne contient que ${D.REDACTIONS?.length ?? 0} démonstration(s), il en faut au moins 5.`);
(D.REDACTIONS || []).forEach((r, i) => {
  const ou = `REDACTIONS[${i}]`;
  if (!r.cas) pb(`${ou} : pas de nom de cas (cas).`);
  if (!r.q) pb(`${ou} : pas d'énoncé (q).`);
  if (!r.f && !r.duo) pb(`${ou} : ni figure (f) ni duo de triangles (duo).`);
  if (!Array.isArray(r.etapes) || r.etapes.length < 4) pb(`${ou} : il faut au moins quatre étapes.`);
  else {
    const vues = new Set();
    r.etapes.forEach(e => { if (vues.has(e)) pb(`${ou} : l'étape « ${e} » apparaît deux fois.`); vues.add(e); });
    if (!r.intrus) pb(`${ou} : pas d'étiquette intruse (intrus).`);
    else if (vues.has(r.intrus)) pb(`${ou} : l'intruse est aussi une étape attendue.`);
    if (!r.pourquoi) pb(`${ou} : l'intruse n'est pas expliquée (pourquoi).`);
  }
  // le parallelisme annonce doit resister au calcul des deux rapports
  if (r.paralleles !== undefined && r.f && Array.isArray(r.f.lens)) {
    const c = {};
    for (const L of r.f.lens) { const n = nomSegment(L.a, L.b); const v = enCm(L.v, "cm"); if (n && v !== null) c[n] = v; }
    if (c.AM !== undefined && c.AB && c.AN !== undefined && c.AC) {
      const egaux = Math.abs(c.AM / c.AB - c.AN / c.AC) < 1e-9;
      if (egaux !== r.paralleles)
        pb(`${ou} : la fiche annonce paralleles = ${r.paralleles}, mais AM/AB = ${(c.AM / c.AB).toFixed(4)} et AN/AC = ${(c.AN / c.AC).toFixed(4)}.`);
      else controlees++;
    }
  }
});

// 3. la manche Agrandir
if (!Array.isArray(D.AGRANDIR) || D.AGRANDIR.length < 6) pb(`AGRANDIR ne contient que ${D.AGRANDIR?.length ?? 0} question(s), il en faut au moins 6.`);
(D.AGRANDIR || []).forEach((q, i) => formeQuestion(`AGRANDIR[${i}]`, q));

// 4. la manche Brevet
if (!Array.isArray(D.SUJETS) || D.SUJETS.length < 4) pb(`SUJETS ne contient que ${D.SUJETS?.length ?? 0} sujet(s), il en faut au moins 4.`);
(D.SUJETS || []).forEach((s, i) => {
  const ou = `SUJETS[${i}]`;
  if (!s.titre) pb(`${ou} : pas de titre.`);
  if (!s.contexte) pb(`${ou} : pas d'énoncé de contexte.`);
  if (!s.fig && !s.duo) pb(`${ou} : ni figure (fig) ni duo de triangles (duo).`);
  if (!Array.isArray(s.questions) || s.questions.length !== 3) { pb(`${ou} : il faut exactement trois questions.`); return; }
  s.questions.forEach((q, j) => {
    formeQuestion(`${ou}.questions[${j}]`, q);
    if (j < s.questions.length - 1 && !q.rappel) pb(`${ou}.questions[${j}] : pas de rappel pour la question suivante.`);
  });
  // la figure du sujet porte l'inconnue de sa premiere question
  const q0 = s.questions[0];
  if (s.fig && q0.kind === "num" && controleMaths(`${ou}.questions[0]`, s.fig, q0)) controlees++;
});

// ---------------------------------------------------------------- placement des etiquettes
// Deux etiquettes qui se recouvrent, ou une etiquette coupee par le bord, rendent une figure
// illisible sans rien casser : personne ne s'en apercoit avant l'eleve. Les boites sont estimees
// a partir de largeurs mesurees dans Chrome (largeur par caractere : len 6,64 ; len unknown 7,71 ;
// ptn jusqu'a 13,38 ; hauteurs 14, 16 et 17). L'estimation reste grossiere : la reference est la
// mesure dans un navigateur, et le seuil de 20 % ne vise que les regressions franches.
const BOITE = { "len": [6.7, 14], "len unknown": [7.8, 16], "ptn": [13.5, 17], "ang": [6.2, 14] };
function etiquettes(rendu) {
  const out = [];
  for (const m of rendu.matchAll(/<text class="([^"]+)" x="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]*)<\/text>/g)) {
    const [w, h] = BOITE[m[1]] || BOITE.len;
    const la = w * m[4].length;
    out.push({ txt: m[4], l: +m[2] - la / 2, r: +m[2] + la / 2, t: +m[3] - h / 2, b: +m[3] + h / 2 });
  }
  return out;
}
function placementValide(ou, rendu) {
  const vb = rendu.match(/viewBox="([-\d.\s]+)"/);
  if (!vb) return;
  const [x0, y0, lv, hv] = vb[1].trim().split(/\s+/).map(Number);
  const bs = etiquettes(rendu);
  for (const b of bs)
    if (b.l < x0 - 1 || b.r > x0 + lv + 1 || b.t < y0 - 1 || b.b > y0 + hv + 1)
      pb(`${ou} : l'étiquette « ${b.txt} » sort du cadre.`);
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const a = bs[i], b = bs[j];
    const ch = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
    const mini = Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
    if (ch > 0.2 * mini) pb(`${ou} : « ${a.txt} » et « ${b.txt} » se recouvrent sur ${Math.round(100 * ch / mini)} % de la plus petite.`);
  }
}

// ---------------------------------------------------------------- rendu des figures
const coords = (rendu, re, lo, hi) => {
  const dehors = [];
  for (const m of rendu.matchAll(re)) { const v = Number(m[1]); if (v < lo || v > hi) dehors.push(v); }
  return dehors;
};
function figureValide(ou, rendu) {
  if (typeof rendu !== "string" || !rendu) { pb(`${ou} : la figure ne produit aucun contenu.`); return; }
  if (/\bNaN\b|\bundefined\b/.test(rendu)) { pb(`${ou} : la figure contient NaN ou undefined.`); return; }
  const vb = rendu.match(/viewBox="([-\d.\s]+)"/);
  if (!vb) { pb(`${ou} : la figure n'a pas de viewBox.`); return; }
  const [x0, y0, lv, hv] = vb[1].trim().split(/\s+/).map(Number);
  const hx = coords(rendu, /\b(?:cx|x1|x2)="(-?\d+(?:\.\d+)?)"/g, x0, x0 + lv);
  const hy = coords(rendu, /\b(?:cy|y1|y2)="(-?\d+(?:\.\d+)?)"/g, y0, y0 + hv);
  if (hx.length || hy.length) pb(`${ou} : la figure déborde du cadre (${[...hx, ...hy].join(", ")}).`);
}
(D.ETAPES || []).forEach((q, i) => { if (q.f) { const r = moteurs.figSVG(q.f); figureValide(`ETAPES[${i}]`, r); placementValide(`ETAPES[${i}]`, r); } });
(D.REDACTIONS || []).forEach((r, i) => {
  for (const rendu of [r.f && moteurs.figSVG(r.f), r.duo && moteurs.figDuoSVG(r.duo)].filter(Boolean)) {
    figureValide(`REDACTIONS[${i}]`, rendu); placementValide(`REDACTIONS[${i}]`, rendu);
  }
});
(D.SUJETS || []).forEach((s, i) => {
  for (const rendu of [s.fig && moteurs.figSVG(s.fig), s.duo && moteurs.figDuoSVG(s.duo)].filter(Boolean)) {
    figureValide(`SUJETS[${i}]`, rendu); placementValide(`SUJETS[${i}]`, rendu);
  }
});

// ---------------------------------------------------------------- cablage des manches
const onglets = [...html.matchAll(/data-panel="([a-z]+)"/g)].map(m => m[1]);
const panneaux = [...html.matchAll(/<section class="panel[^"]*" id="([a-z]+)"/g)].map(m => m[1]);
const finManches = src.indexOf("/* fin des manches */");
const zoneManches = src.slice(iManches, finManches < 0 ? src.length : finManches);
if (finManches < 0) pb("l'ancre « fin des manches » est absente.");
const cles = [...zoneManches.matchAll(/^\s{2}([a-z]+):creeManche\(/gm)].map(m => m[1]);
const tablesEcrites = ["ETAPES", "REDACTIONS", "AGRANDIR", "SUJETS"].filter(n => Array.isArray(D[n])).length;
for (const c of cles) {
  if (!onglets.includes(c)) pb(`la manche « ${c} » n'a pas d'onglet.`);
  if (!panneaux.includes(c)) pb(`la manche « ${c} » n'a pas de panneau.`);
}
for (const o of onglets) {
  if (!panneaux.includes(o)) pb(`l'onglet « ${o} » n'a pas de panneau.`);
  // un onglet sans manche est tolere tant que les quatre tableaux ne sont pas tous ecrits
  if (!cles.includes(o) && tablesEcrites === 4) pb(`l'onglet « ${o} » ne correspond à aucune manche.`);
}

// ---------------------------------------------------------------- carnet vers fiche
// Meme normalisation que coherence.mjs : entites, apostrophes, balises, espaces.
const norm = s => String(s)
  .replace(/&eacute;/g, "é").replace(/&egrave;/g, "è").replace(/&agrave;/g, "à")
  .replace(/&ccedil;/g, "ç").replace(/&ocirc;/g, "ô").replace(/&icirc;/g, "î")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|’/g, "'")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

let ficheTexte = null;
try { ficheTexte = norm(readFileSync(fiche, "utf8")); }
catch { pb(`la fiche ${fiche} est introuvable : les rédactions types ne peuvent pas être contrôlées.`); }
let etapesControlees = 0;
if (ficheTexte) (D.REDACTIONS || []).forEach((r, i) => {
  (r.etapes || []).forEach((e, j) => {
    etapesControlees++;
    if (!ficheTexte.includes(norm(e))) pb(`ABSENT de ${fiche} : REDACTIONS[${i}].etapes[${j}] = « ${e} »`);
  });
});

// ---------------------------------------------------------------- figures gelees de la fiche
// La fiche ne porte aucun moteur : ses figures sont des rendus figes des memes donnees.
// Si une figure du carnet bouge, la fiche doit suivre, sinon les deux se contredisent.
const GELEES = [[0, "f"], [1, "f"], [2, "f"], [5, "f"], [4, "duo"]];
let gelees = 0;
if (ficheTexte !== null) {
  const brut = readFileSync(fiche, "utf8");
  const posees = [...brut.matchAll(/<div class="fig">([\s\S]*?)<\/div>/g)].map(m => m[1]);
  if (posees.length !== GELEES.length)
    pb(`${fiche} contient ${posees.length} figure(s) gelée(s) pour ${GELEES.length} attendue(s).`);
  else GELEES.forEach(([i, champ], rang) => {
    const r = (D.REDACTIONS || [])[i];
    if (!r) return;
    const attendu = champ === "duo" ? moteurs.figDuoSVG(r.duo) : moteurs.figSVG(r.f);
    if (posees[rang] !== attendu) pb(`${fiche} : la figure ${rang + 1} a dérivé de REDACTIONS[${i}], il faut la regeler.`);
    else gelees++;
  });
}

// ---------------------------------------------------------------- verdict
if (pbs) { console.error(`${pbs} problème(s).`); process.exit(1); }
console.log(`${cles.length} manche(s) contrôlée(s) : ${controlees} question(s) rejouée(s) en mathématiques, ` +
            `${etapesControlees} étape(s) de rédaction et ${gelees} figure(s) gelée(s) retrouvée(s) dans ${fiche} : le carnet est conforme.`);
