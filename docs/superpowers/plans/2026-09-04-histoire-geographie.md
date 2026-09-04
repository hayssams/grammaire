# Histoire et Géographie : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au site deux matières, Histoire et Géographie, couvrant le programme de révision de rentrée en 3e : deux carnets d'exercices et une fiche mémo par matière, plus la navigation qui y mène.

**Architecture:** Huit pages HTML autonomes de plus, chacune avec son CSS et son JS inline, calquées sur les fichiers existants. Les carnets d'histoire partagent un helper `friseSVG` qui dessine une frise chronologique cliquable ; les carnets de géo partagent un helper `mapSVG` qui dessine des cartes cliquables. Ces helpers jouent le même rôle que `figSVG` dans `thales.html` : ils sont **dupliqués dans chaque fichier**, puisque le projet interdit les fichiers partagés.

**Tech Stack:** HTML, CSS et JavaScript natifs. Aucun build, aucune dépendance, aucun framework. Google Fonts (Instrument Serif, Karla) chargé par `<link>`. Node 26 sert uniquement au vérificateur de développement, qui n'est pas livré avec le site.

## Global Constraints

- **Tout le contenu visible est en français**, y compris les messages de commit. C'est la règle du `CLAUDE.md`.
- **Jamais de tiret cadratin (« — ») dans les textes rédigés**, ni dans le contenu des pages, ni dans les messages de commit.
- **Aucune dépendance, aucun build, aucun fichier partagé.** Chaque page embarque son CSS et son JS. Le code commun est recopié d'un fichier à l'autre : c'est assumé par le projet.
- **Spec de référence :** `docs/superpowers/specs/2026-09-04-histoire-geographie-design.md`. Elle fait foi sur le contenu (les 23 dates, les 21 personnages, les 13 régions, les 27 pays). Ne rien inventer qui n'y figure pas.
- **Fichiers à ne pas toucher :** `francais.html`, `maths.html`, `thales.html`, `classes-grammaticales.html`, `fonctions-grammaticales.html`, `astuces.html`.
- **Cible = téléphone.** Toute zone cliquable fait au moins 44 px dans sa plus petite dimension. Breakpoints à 420 px et 360 px. Respecter `prefers-reduced-motion` comme dans les fichiers existants.
- **Couleurs d'accent :** `--histoire: #8C4A2F`, `--geo: #17697B`. Les variables de palette existantes (`--paper`, `--paper-2`, `--rule`, `--rule-soft`, `--marge`, `--ink`, `--ink-soft`, `--serif`, `--sans`) sont recopiées à l'identique depuis `thales.html:11-24`.
- **`SHEET_URL`** est identique dans les quatre carnets, recopié depuis `thales.html:394` :
  `https://script.google.com/macros/s/AKfycbwB53nfh6Xk_z1Gn4ck_WL8aX0gPxDzQ2MpxWVnpsdunmWR_IKj-tHPHOEVkP614jQJ/exec`
- **Chaque manche appelle `logResult` à sa fin.** Quatre onglets, donc quatre appels à `logResult` par carnet. Le vérificateur le contrôle.

### Le vérificateur

Il n'y a pas de tests dans ce projet : la vérification se fait dans le navigateur. Pour attraper quand même les fautes mécaniques (JS qui ne compile pas, lien mort, onglet sans panneau, manche qui ne journalise pas), le plan s'appuie sur un petit script Node **non commité**.

**À faire une seule fois, avant la tâche 1.** Écrire ce fichier dans le scratchpad de la session (le chemin exact est repris tel quel dans toutes les tâches ; adapter si le scratchpad diffère) :

```bash
mkdir -p /tmp/verif-grammaire && cat > /tmp/verif-grammaire/verif.mjs <<'EOF'
// Vérificateur des pages du site. Usage : node verif.mjs page.html [page2.html ...]
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

let echecs = 0;
const ko = (f, m) => { console.error(`KO  ${f} : ${m}`); echecs++; };

for (const f of process.argv.slice(2)) {
  const html = readFileSync(f, "utf8");
  const dir = dirname(resolve(f));

  // 1. le JS inline compile-t-il ?
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  // une page chapeau (index, francais, maths...) n'a pas de script : c'est normal
  scripts.forEach((src, i) => {
    try { new vm.Script(src, { filename: `${f}#script${i}` }); }
    catch (e) { ko(f, `script ${i} ne compile pas : ${e.message}`); }
  });

  // 2. les liens internes pointent-ils sur un fichier existant ?
  for (const m of html.matchAll(/href="([^"#:]+\.html)"/g)) {
    if (!existsSync(resolve(dir, m[1]))) ko(f, `lien mort vers ${m[1]}`);
  }

  // 3. chaque onglet a-t-il son panneau, et réciproquement ?
  const onglets = [...html.matchAll(/data-panel="([^"]+)"/g)].map(m => m[1]);
  const panneaux = [...html.matchAll(/<section class="panel[^"]*" id="([^"]+)"/g)].map(m => m[1]);
  if (onglets.length) {
    for (const o of onglets) if (!panneaux.includes(o)) ko(f, `onglet "${o}" sans panneau`);
    for (const p of panneaux) if (!onglets.includes(p)) ko(f, `panneau "${p}" sans onglet`);
    const actifs = [...html.matchAll(/<section class="panel on"/g)].length;
    if (actifs !== 1) ko(f, `${actifs} panneau(x) marqué(s) "on", il en faut exactement 1`);
  }

  // 4. une page d'exercice doit journaliser ses résultats
  if (/function logResult/.test(html)) {
    const page = html.match(/page:"([^"]+)"/);
    if (!page) ko(f, "logResult sans champ page");
    const manches = [...html.matchAll(/logResult\("([^"]+)"/g)].map(m => m[1]);
    if (onglets.length && manches.length !== onglets.length)
      ko(f, `${manches.length} appel(s) à logResult pour ${onglets.length} onglets`);
  }
  console.log(`--  ${f} : ${scripts.length} script(s), ${panneaux.length} panneau(x)`);
}
console.log(echecs ? `\n${echecs} problème(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
EOF
```

Vérifier qu'il fonctionne sur l'existant :

```bash
node /tmp/verif-grammaire/verif.mjs index.html thales.html astuces.html
```

Sortie attendue, dernière ligne : `Tout est bon.`

**Note :** `classes-grammaticales.html` et `fonctions-grammaticales.html` échouent sur la règle 4 (leur manche Caméléons ne rappelle pas `logResult`). C'est un défaut préexistant, hors périmètre de ce plan : ne pas les passer au vérificateur, ne pas les corriger ici.

### L'atelier de tracé

Cinq constantes de ce plan sont des tracés SVG dessinés à la main : `TRACES_ADMIN`,
`TRACES_RELIEF`, `TRACES_MERS` (tâches 5 et 6), `CONTINENTS` (tâche 6) et `TRACES_EUROPE`
(tâche 7). Elles ne s'écrivent pas d'un jet : elles se règlent à l'œil. Les dessiner
directement dans le carnet obligerait à rejouer une manche à chaque retouche de
coordonnée.

**À faire une seule fois, avant la tâche 5.** Écrire ce banc d'essai, qui affiche un fond
avec sa grille de repérage, ses ancres et ses étiquettes :

```bash
cat > /tmp/verif-grammaire/atelier.html <<'EOF'
<!DOCTYPE html><html lang="fr"><meta charset="utf-8">
<title>Atelier de tracé</title>
<style>
 body{margin:0;font:14px system-ui;background:#F5F6F1;color:#16233B}
 .col{display:flex;gap:16px;padding:16px;flex-wrap:wrap}
 textarea{width:min(560px,100%);height:70vh;font:12px ui-monospace,monospace}
 svg{background:#CFE2EE;border:1px solid #BFD3E4;border-radius:8px;width:min(520px,100%)}
 path{fill:#DCE7DB;stroke:#FCFCFA;stroke-width:1.2}
 .grille line{stroke:#16233B;stroke-opacity:.12}
 .ancre{fill:#DE5B4A}
 text{font:7.5px system-ui;fill:#16233B;text-anchor:middle;pointer-events:none}
 p.err{color:#C0392B;margin:6px 0}
</style>
<div class="col">
 <div>
  <p>Colle ici un tableau de zones : <code>[{id,nom,d,cx,cy}]</code></p>
  <textarea id="src">[
 {"id":"exemple","nom":"Exemple","cx":160,"cy":170,
  "d":"M120 130 L200 130 L210 200 L150 215 L110 190 Z"}
]</textarea>
  <p>viewBox : <input id="vb" value="0 0 320 340" size="14"> pas de grille : <input id="pas" value="20" size="4"></p>
  <p class="err" id="err"></p>
 </div>
 <svg id="out"></svg>
</div>
<script>
const $=s=>document.querySelector(s);
function rendu(){
  const out=$("#out"), vb=$("#vb").value.trim(), pas=+$("#pas").value||20;
  out.setAttribute("viewBox",vb);
  const [,,W,H]=vb.split(/\s+/).map(Number);
  let g='<g class="grille">';
  for(let x=0;x<=W;x+=pas)g+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}"></line>`;
  for(let y=0;y<=H;y+=pas)g+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}"></line>`;
  g+="</g>";
  let zones=[];
  try{zones=JSON.parse($("#src").value);$("#err").textContent="";}
  catch(e){$("#err").textContent="JSON invalide : "+e.message;return;}
  out.innerHTML=g+zones.map(z=>
    (z.d?`<path d="${z.d}"></path>`:"")+
    `<circle class="ancre" cx="${z.cx}" cy="${z.cy}" r="2.5"></circle>`+
    `<text x="${z.cx}" y="${z.cy-5}">${z.nom||z.id}</text>`).join("");
}
$("#src").oninput=rendu;$("#vb").oninput=rendu;$("#pas").oninput=rendu;rendu();
</script>
EOF
open /tmp/verif-grammaire/atelier.html
```

La grille au pas de 20 donne les coordonnées à l'œil, les points rouges sont les ancres
imposées par le plan. On règle le tracé jusqu'à ce que la forme soit juste, puis on recopie
le résultat dans le carnet. Ce fichier n'est pas commité.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `index.html` | *(modifié)* accueil, quatre cartes de matière |
| `histoire.html` | *(nouveau)* chapeau Histoire : trois cartes + le lien vers l'appli de la professeure |
| `histoire-dates.html` | *(nouveau)* carnet des 23 dates : frise, QCM, mémo, cartes |
| `histoire-personnages.html` | *(nouveau)* carnet des 21 personnages : qui est-ce, frise, mémo, cartes |
| `histoire-memo.html` | *(nouveau)* fiche mémo histoire, deux onglets, statique |
| `geographie.html` | *(nouveau)* chapeau Géographie : trois cartes |
| `geo-france.html` | *(nouveau)* carnet France : régions, capitales, fleuves et reliefs, mers et DROM |
| `geo-europe.html` | *(nouveau)* carnet Europe : placer, reconnaître, dans l'UE ou pas, voisins |
| `geo-memo.html` | *(nouveau)* fiche mémo géo, deux onglets, statique |
| `CLAUDE.md` | *(modifié)* documenter les nouveaux fichiers et les deux helpers |

Neuf tâches, une par livrable testable. Les tâches 2 et 3 construisent le même fichier en deux temps parce qu'un carnet complet est trop gros pour une seule passe relisible ; les tâches 5 et 6 font de même pour `geo-france.html`.

---

### Task 1 : Navigation, les deux pages chapeau

**Files:**
- Modify: `index.html:16-22` (bloc `:root`), `index.html:143-153` (les cartes)
- Create: `histoire.html`
- Create: `geographie.html`

**Interfaces:**
- Consomme : rien.
- Produit : les chemins `histoire.html` et `geographie.html`, et les liens sortants `histoire-dates.html`, `histoire-personnages.html`, `histoire-memo.html`, `geo-france.html`, `geo-europe.html`, `geo-memo.html`, que les tâches suivantes créeront. Ces six liens sont donc **morts jusqu'à la tâche 8** : c'est attendu, et le vérificateur les signalera. Ne pas les commenter pour faire taire le vérificateur.

- [ ] **Step 1 : Ajouter les deux couleurs dans `index.html`**

Dans le bloc `:root` de `index.html`, sous la ligne `--maths:#1B6F55;`, ajouter :

```css
  --histoire:#8C4A2F;
  --geo:#17697B;
```

- [ ] **Step 2 : Ajouter les deux cartes dans `index.html`**

Dans `index.html`, à la suite de la carte Maths et avant la fermeture de `</div>` de `.cards`, ajouter :

```html
      <a class="card" style="--c:var(--histoire)" href="histoire.html">
        <h2>Histoire</h2>
        <span class="go">&rarr;</span>
      </a>

      <a class="card" style="--c:var(--geo)" href="geographie.html">
        <h2>G&eacute;ographie</h2>
        <span class="go">&rarr;</span>
      </a>
```

- [ ] **Step 3 : Créer `histoire.html`**

Partir d'une copie de `maths.html`, puis appliquer ces changements :

1. `<title>` devient `Histoire, les carnets`.
2. Dans `:root`, remplacer `--maths:#1B6F55;` par `--histoire:#8C4A2F;`, et remplacer les deux occurrences de `var(--maths)` par `var(--histoire)` (dans `h1 em` et dans les cartes).
3. L'en-tête devient :

```html
    <div class="topbar"><a class="home" href="index.html">🏠 Accueil</a><p class="eyebrow">Histoire, 3<sup>e</sup></p></div>
    <h1>Une date se retient <em>par ce qu'elle change</em></h1>
    <p class="sub">Les carnets d'entraînement d'histoire, pour l'évaluation de rentrée.</p>
```

4. Les trois cartes remplacent la carte Thalès :

```html
      <a class="card" style="--c:var(--histoire)" href="histoire-dates.html">
        <span class="go">&rarr;</span>
        <p class="num">Carnet 1 &middot; rep&egrave;res</p>
        <h2>Les 23 dates</h2>
        <p>De 1914 &agrave; l'euro : reconna&icirc;tre chaque date, la relier &agrave; son &eacute;v&eacute;nement, et savoir o&ugrave; elle tombe sur la frise.</p>
        <ul class="modes">
          <li>Frise</li>
          <li>En contexte</li>
          <li>M&eacute;mo</li>
          <li>Cartes</li>
        </ul>
      </a>

      <a class="card" style="--c:var(--histoire)" href="histoire-personnages.html">
        <span class="go">&rarr;</span>
        <p class="num">Carnet 2 &middot; personnages</p>
        <h2>Les 21 personnages</h2>
        <p>Clemenceau, Jean Moulin, Simone Veil, Gorbatchev : savoir dire en deux phrases ce qu'ils ont fait, et &agrave; quelle &eacute;poque.</p>
        <ul class="modes">
          <li>Qui est-ce&nbsp;?</li>
          <li>Frise</li>
          <li>M&eacute;mo</li>
          <li>Cartes</li>
        </ul>
      </a>

      <a class="card" style="--c:var(--histoire)" href="histoire-memo.html">
        <span class="go">&rarr;</span>
        <p class="num">Fiche</p>
        <h2>Le m&eacute;mo d'histoire</h2>
        <p>Les 23 dates rang&eacute;es par p&eacute;riode et les 21 personnages avec leur r&ocirc;le, &agrave; relire avant l'&eacute;valuation.</p>
      </a>
```

5. Juste après la fermeture de `</div>` de `.cards`, à l'intérieur de `.sheet`, ajouter le lien vers l'application recommandée :

```html
      <p class="lien-prof">L'appli conseill&eacute;e par la professeure :
        <a href="https://kerlian123.github.io/Fiches-personnages-et-v-nements-histoire---mission-brevet/index.html" target="_blank" rel="noopener">fiches personnages et &eacute;v&eacute;nements</a> (site externe).</p>
```

6. Et le style correspondant, à la fin du `<style>` avant la media query :

```css
.lien-prof{
  margin:16px 0 0;font-size:13px;color:var(--ink-soft);line-height:1.6
}
.lien-prof a{color:var(--histoire);font-weight:700}
```

- [ ] **Step 4 : Créer `geographie.html`**

Même méthode que le step 3, à partir d'une copie de `maths.html` :

1. `<title>` devient `Géographie, les carnets`.
2. Dans `:root`, remplacer `--maths:#1B6F55;` par `--geo:#17697B;` et les `var(--maths)` par `var(--geo)`.
3. L'en-tête :

```html
    <div class="topbar"><a class="home" href="index.html">🏠 Accueil</a><p class="eyebrow">G&eacute;ographie, 3<sup>e</sup></p></div>
    <h1>Une carte se retient <em>avec le doigt</em></h1>
    <p class="sub">Les carnets d'entraînement de géographie : nommer, et surtout placer.</p>
```

4. Les trois cartes :

```html
      <a class="card" style="--c:var(--geo)" href="geo-france.html">
        <span class="go">&rarr;</span>
        <p class="num">Carnet 1 &middot; la France</p>
        <h2>La carte de France</h2>
        <p>Les 13 r&eacute;gions et leurs capitales, les fleuves, les reliefs, les mers qui bordent le pays et les cinq DROM.</p>
        <ul class="modes">
          <li>Les r&eacute;gions</li>
          <li>Les capitales</li>
          <li>Fleuves et reliefs</li>
          <li>Mers et DROM</li>
        </ul>
      </a>

      <a class="card" style="--c:var(--geo)" href="geo-europe.html">
        <span class="go">&rarr;</span>
        <p class="num">Carnet 2 &middot; l'Europe</p>
        <h2>L'Europe et l'Union</h2>
        <p>Placer les 27 pays de l'Union europ&eacute;enne, les reconna&icirc;tre, distinguer qui en est membre, et retrouver les voisins de la France.</p>
        <ul class="modes">
          <li>Placer</li>
          <li>Reconna&icirc;tre</li>
          <li>Dans l'UE&nbsp;?</li>
          <li>Les voisins</li>
        </ul>
      </a>

      <a class="card" style="--c:var(--geo)" href="geo-memo.html">
        <span class="go">&rarr;</span>
        <p class="num">Fiche</p>
        <h2>Le m&eacute;mo de g&eacute;o</h2>
        <p>Les listes compl&egrave;tes : r&eacute;gions et capitales, fleuves, reliefs, mers, DROM, et les 27 pays de l'Union.</p>
      </a>
```

- [ ] **Step 5 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs index.html
```

Attendu : `Tout est bon.` (`index.html` ne pointe que sur des fichiers qui existent maintenant).

```bash
node /tmp/verif-grammaire/verif.mjs histoire.html geographie.html
```

Attendu : exactement six lignes `KO ... lien mort vers ...` pour `histoire-dates.html`, `histoire-personnages.html`, `histoire-memo.html`, `geo-france.html`, `geo-europe.html`, `geo-memo.html`, et rien d'autre. Toute autre erreur est un vrai problème à corriger.

- [ ] **Step 6 : Vérifier dans le navigateur**

```bash
open index.html
```

Contrôler : quatre cartes, chacune de sa couleur ; le clic sur Histoire et sur Géographie ouvre la bonne page chapeau ; le bouton 🏠 revient à l'accueil ; à 360 px de large, les titres ne débordent pas.

- [ ] **Step 7 : Commit**

```bash
git add index.html histoire.html geographie.html
git commit -m "Ajoute les rubriques Histoire et Géographie à l'accueil

Deux nouvelles matières et leurs pages chapeau, sur le modèle de
maths.html. Les liens vers les carnets sont posés maintenant, les
carnets arrivent ensuite."
```

---

### Task 2 : `histoire-dates.html`, le socle et la manche Frise

**Files:**
- Create: `histoire-dates.html`
- Read for reference: `thales.html:10-203` (CSS), `thales.html:228-236` (outils), `thales.html:393-445` (gamification), `thales.html:447-501` (une manche complète)

**Interfaces:**
- Consomme : `histoire.html` (le bouton 🏠 y retourne).
- Produit, pour les tâches 3 et 4 :
  - `TRANCHES` : `{[id]: {label, court, de, a, v}}` sur les ids `t1`…`t5`.
  - `friseSVG(opts)` où `opts = {bonne, choisie, an}` ; tous les champs sont optionnels ; retourne une chaîne de balisage SVG. Chaque tranche cliquable porte `data-tr="t1"`…`data-tr="t5"`.
  - `DATES` : tableau de `{d, label, t, w}`.
  - Les helpers `$`, `shuffle`, `pick`, `esc`, `rnd`, `chrono`, `confetti`, `showVerdict`, `bilanHTML`, `logResult`, identiques à ceux de `thales.html` sauf `page:"histoire-dates"`.

- [ ] **Step 1 : Créer le squelette**

Copier `thales.html` vers `histoire-dates.html`, puis :

1. `<title>` : `Les 23 dates`.
2. Dans `:root`, remplacer `--maths:#1B6F55;` par le bloc de couleurs des cinq tranches :

```css
  --histoire:#8C4A2F;
  --t1:#7C3A2E;
  --t2:#A6702B;
  --t3:#4A5F8A;
  --t4:#8C4A2F;
  --t5:#1B6F55;
```

3. Remplacer partout `var(--maths)` par `var(--histoire)`.
4. Supprimer le bloc CSS `/* ---------- fractions ---------- */` (`thales.html:112-119`) et le bloc `/* ---------- saisie ---------- */` (`thales.html:157-165`) : ce carnet n'a ni fraction ni champ numérique.
5. Supprimer du `<script>` les blocs `/* ============ figures SVG ============ */` (`thales.html:238-284`), `/* ============ donnees ============ */` (`thales.html:286-392`) et les quatre manches (`thales.html:447-663`), ainsi que les helpers `frac` et `eq3`. Garder `$`, `shuffle`, `pick`, `esc`, `chrono`, `rnd`, tout le bloc gamification, et le bloc `/* onglets */`.
6. L'en-tête devient :

```html
    <div class="topbar"><a class="home" href="histoire.html">🏠 Histoire</a><p class="eyebrow">Histoire, 3<sup>e</sup></p></div>
    <h1>Les 23 dates <em>et leur place</em></h1>
    <p class="sub">Quatre entraînements : situer sur la frise, relier date et événement, apparier, réviser en cartes.</p>
    <nav role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-panel="frise">Frise</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="quiz">En contexte</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="memo">Mémo</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="cartes">Cartes</button>
    </nav>
```

7. Les panneaux :

```html
  <div class="sheet">
    <section class="panel on" id="frise"></section>
    <section class="panel" id="quiz"></section>
    <section class="panel" id="memo"></section>
    <section class="panel" id="cartes"></section>
  </div>
```

8. Dans le bloc `/* onglets */`, remplacer les quatre `if` par :

```js
    if(t.dataset.panel==="frise")friIntro();
    if(t.dataset.panel==="quiz")quizIntro();
    if(t.dataset.panel==="memo")memoIntro();
    if(t.dataset.panel==="cartes")cartesIntro();
```

9. Dans `logResult`, remplacer `page:"thales"` par `page:"histoire-dates"`.
10. Remplacer `CHEERS` et `OOPS` par des messages d'histoire :

```js
const CHEERS=[["🎉","Bravo !"],["⭐","Super !"],["🚀","Excellent !"],["🏆","Champion !"],["📜","L'Histoire retient ton nom !"],["🔥","Trop fort !"],["🌟","Génial !"],["⏳","Pile au bon moment !"]];
const OOPS=[["😅","Oups, presque !"],["🙈","Pas cette fois !"],["🤔","Hmm, regarde la frise..."],["🐢","On y va doucement !"],["🧐","Presque ! Lis la correction."]];
```

- [ ] **Step 2 : Écrire les données**

À la place du bloc `/* ============ donnees ============ */` supprimé, écrire :

```js
/* ============ donnees ============ */
const TRANCHES={
  t1:{label:"1914-1918 · la Grande Guerre",court:"1914-1918",de:1914,a:1918,v:"--t1"},
  t2:{label:"1919-1938 · l'entre-deux-guerres",court:"1919-1938",de:1919,a:1938,v:"--t2"},
  t3:{label:"1939-1945 · la Seconde Guerre mondiale",court:"1939-1945",de:1939,a:1945,v:"--t3"},
  t4:{label:"1946-1975 · la guerre froide s'installe",court:"1946-1975",de:1946,a:1975,v:"--t4"},
  t5:{label:"1976-2002 · la détente et l'Europe",court:"1976-2002",de:1976,a:2002,v:"--t5"}
};
const TORDRE=["t1","t2","t3","t4","t5"];

/* an = année servant au repère sur l'axe ; d = la date telle qu'elle est écrite sur la feuille */
const DATES=[
 {d:"1914",an:1914,t:"t1",label:"début de la Première Guerre mondiale",w:"L'attentat de Sarajevo entraîne toute l'Europe dans la guerre en août 1914."},
 {d:"1916",an:1916,t:"t1",label:"bataille de Verdun",w:"Dix mois de combats, la bataille la plus longue de la guerre, symbole de l'enfer des tranchées."},
 {d:"1917",an:1917,t:"t1",label:"révolutions russes",w:"En février le tsar tombe, en octobre les bolcheviks de Lénine prennent le pouvoir."},
 {d:"11 novembre 1918",an:1918,t:"t1",label:"armistice",w:"L'armistice arrête les combats. Ce n'est pas encore la paix : le traité de Versailles est signé en 1919."},
 {d:"1929",an:1929,t:"t2",label:"crise économique mondiale",w:"Le krach de Wall Street en octobre 1929 jette des millions de gens au chômage et fragilise les démocraties."},
 {d:"1933",an:1933,t:"t2",label:"arrivée d'Hitler au pouvoir",w:"Hitler devient chancelier en janvier 1933 et installe en quelques mois une dictature raciste."},
 {d:"1936",an:1936,t:"t2",label:"élection du Front populaire en France",w:"La gauche unie gagne les élections : congés payés, semaine de 40 heures, conventions collectives."},
 {d:"1939-1945",an:1942,t:"t3",label:"Seconde Guerre mondiale",w:"Six ans de guerre mondiale, déclenchée par l'invasion de la Pologne le 1er septembre 1939."},
 {d:"18 juin 1940",an:1940,t:"t3",label:"appel du général de Gaulle",w:"Depuis Londres, de Gaulle refuse la défaite et appelle à continuer le combat. C'est l'acte de naissance de la France libre."},
 {d:"6 juin 1944",an:1944,t:"t3",label:"débarquement en Normandie",w:"Les Alliés débarquent sur les plages normandes et ouvrent enfin un front à l'ouest."},
 {d:"1944",an:1944,t:"t3",label:"Libération de la France",w:"Paris est libéré en août 1944 ; la France retrouve sa souveraineté et rétablit la République."},
 {d:"8 mai 1945",an:1945,t:"t3",label:"capitulation allemande",w:"L'Allemagne se rend sans condition. La guerre s'achève en Europe, mais continue en Asie."},
 {d:"août 1945",an:1945,t:"t3",label:"bombardements atomiques du Japon",w:"Hiroshima le 6 août, Nagasaki le 9 août : le Japon capitule et le monde entre dans l'âge nucléaire."},
 {d:"1945",an:1945,t:"t3",label:"création de l'Organisation des Nations unies",w:"L'ONU remplace la SDN avec une mission : maintenir la paix et faire respecter les droits humains."},
 {d:"1947",an:1947,t:"t4",label:"début de la guerre froide",w:"Doctrine Truman et plan Marshall d'un côté, réplique soviétique de l'autre : le monde se coupe en deux blocs."},
 {d:"1948-1949",an:1948,t:"t4",label:"blocus de Berlin",w:"Staline coupe les accès à Berlin-Ouest ; les Occidentaux ravitaillent la ville par un pont aérien pendant onze mois."},
 {d:"1957",an:1957,t:"t4",label:"traité de Rome",w:"Six pays créent la Communauté économique européenne, l'ancêtre de l'Union européenne."},
 {d:"1961",an:1961,t:"t4",label:"construction du mur de Berlin",w:"En une nuit, la RDA mure sa frontière pour empêcher ses habitants de fuir à l'Ouest."},
 {d:"1962",an:1962,t:"t4",label:"crise de Cuba",w:"Des missiles soviétiques à Cuba amènent le monde au bord de la guerre nucléaire. Khrouchtchev recule."},
 {d:"1989",an:1989,t:"t5",label:"chute du mur de Berlin",w:"Le 9 novembre, le mur s'ouvre. C'est la fin du partage de l'Europe en deux blocs."},
 {d:"1991",an:1991,t:"t5",label:"disparition de l'Union soviétique",w:"L'URSS se dissout en quinze États indépendants. La guerre froide est finie."},
 {d:"1992",an:1992,t:"t5",label:"traité de Maastricht",w:"Il crée l'Union européenne, la citoyenneté européenne et prépare la monnaie unique."},
 {d:"2002",an:2002,t:"t5",label:"mise en circulation de l'euro",w:"Les pièces et les billets en euros remplacent les monnaies nationales dans douze pays."}
];
```

- [ ] **Step 3 : Écrire `friseSVG`**

À la place du bloc `/* ============ figures SVG ============ */` supprimé :

```js
/* ============ la frise ============ */
/* Axe 1910 -> 2010 sur 300 px utiles. Les tranches courtes (t1, t3) seraient
   des traits fins si la largeur etait strictement proportionnelle. Chaque
   tranche recoit donc d'abord le plancher, cliquable au doigt, puis le reste
   est reparti au prorata de la duree : la somme fait exactement la largeur
   utile, et la proportionnalite chronologique reste lisible (t4, trente ans,
   reste 1,4 fois plus large que t1, cinq ans).
   Ne pas normaliser apres coup : diviser par la somme des planchers annule
   le plancher lui-meme et ramene la bande la plus etroite a 41 unites. */
const FRISE_X0=20, FRISE_X1=320, FRISE_AN0=1910, FRISE_AN1=2010, FRISE_MIN=46;
const FRISE_GEO=(()=>{
  const duree=TORDRE.map(id=>TRANCHES[id].a-TRANCHES[id].de+1);
  const totalDuree=duree.reduce((s,d)=>s+d,0);
  const utile=FRISE_X1-FRISE_X0;
  const reste=utile-TORDRE.length*FRISE_MIN;
  let x=FRISE_X0;
  const geo={};
  TORDRE.forEach((id,i)=>{
    const w=FRISE_MIN+duree[i]/totalDuree*reste;
    geo[id]={x,w};
    x+=w;
  });
  return geo;
})();
/* position exacte d'une annee sur l'axe, pour le repere affiche apres reponse */
function friseX(an){
  const id=TORDRE.find(k=>an>=TRANCHES[k].de&&an<=TRANCHES[k].a)||"t5";
  const t=TRANCHES[id], g=FRISE_GEO[id];
  return g.x+(an-t.de+.5)/(t.a-t.de+1)*g.w;
}
/* opts : {bonne, choisie, an} tous optionnels */
function friseSVG(opts={}){
  const {bonne,choisie,an}=opts;
  const bandes=TORDRE.map((id,i)=>{
    const t=TRANCHES[id], g=FRISE_GEO[id];
    let cls="tr";
    if(bonne&&id===bonne)cls+=" good";
    else if(choisie&&id===choisie)cls+=" bad";
    else if(bonne)cls+=" dim";
    return `<g class="${cls}" data-tr="${id}" role="button" tabindex="0" aria-label="${esc(t.label)}">
      <rect x="${g.x.toFixed(1)}" y="34" width="${(g.w-2).toFixed(1)}" height="60" rx="5" fill="var(${t.v})"></rect>
      <text x="${(g.x+g.w/2-1).toFixed(1)}" y="68" text-anchor="middle" class="trlab">${t.court.replace("-","‑")}</text>
    </g>`;
  }).join("");
  const repere=(bonne&&an!=null)
    ? `<g class="repere"><line x1="${friseX(an).toFixed(1)}" y1="26" x2="${friseX(an).toFixed(1)}" y2="102"></line>
       <text x="${friseX(an).toFixed(1)}" y="18" text-anchor="middle" class="rlab">${an}</text></g>`
    : "";
  return `<svg viewBox="0 0 340 118" role="img" aria-label="Frise chronologique de 1910 à 2010">
    <line class="axe" x1="${FRISE_X0}" y1="102" x2="${FRISE_X1}" y2="102"></line>
    ${bandes}${repere}
    <text x="${FRISE_X0}" y="115" class="borne">1910</text>
    <text x="${FRISE_X1}" y="115" text-anchor="end" class="borne">2010</text>
  </svg>`;
}
```

- [ ] **Step 4 : Écrire le CSS de la frise**

Remplacer le bloc CSS `/* ---------- figure ---------- */` de `thales.html` par :

```css
/* ---------- frise ---------- */
.fig{margin:14px 0 4px;text-align:center}
.fig svg{width:100%;max-width:340px;height:auto;overflow:visible}
.fig .axe{stroke:var(--ink-soft);stroke-width:1}
.fig .tr rect{cursor:pointer;opacity:.82;transition:opacity .15s,transform .15s}
.fig .tr:hover rect,.fig .tr:focus rect{opacity:1}
.fig .tr:focus{outline:none}
.fig .tr:focus rect{stroke:var(--ink);stroke-width:2}
.fig .trlab{font-family:var(--sans);font-size:9.5px;font-weight:700;fill:#fff;pointer-events:none}
.fig .good rect{opacity:1;stroke:var(--ink);stroke-width:2}
.fig .bad rect{opacity:.35;stroke:var(--marge);stroke-width:2;stroke-dasharray:3 2}
.fig .dim rect{opacity:.3}
.fig .repere line{stroke:var(--ink);stroke-width:1.5;stroke-dasharray:2 2}
.fig .rlab{font-family:var(--sans);font-size:10px;font-weight:700;fill:var(--ink)}
.fig .borne{font-family:var(--sans);font-size:9px;fill:var(--ink-soft)}
.revealed .fig .tr rect{cursor:default}
@media (prefers-reduced-motion:reduce){
  .fig .tr rect{transition:none}
}
```

- [ ] **Step 5 : Écrire la manche Frise**

À la place de `/* ============ 1. reperer ============ */`, en gardant exactement la même charpente (état, intro, step, end) :

```js
/* ============ 1. la frise ============ */
const F1={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const fp=$("#frise");
function friIntro(){
  fp.innerHTML=`<div class="intro">
    <h2>Où tombe cette date ?</h2>
    <p>Dix événements, tirés au hasard dans les vingt-trois dates du programme. Pour chacun, clique la période de la frise où il se place. On ne te demande pas l'année exacte, seulement la bonne époque.</p>
    <button class="btn" id="fgo">Commencer la manche</button>
  </div>`;
  $("#fgo").onclick=friStart;
}
function friStart(){
  F1.list=pick(DATES,10);F1.i=0;F1.score=0;F1.errs=[];F1.streak=0;F1.t0=Date.now();friStep();
}
function friStep(){
  if(F1.i>=F1.list.length)return friEnd();
  const q=F1.list[F1.i];
  fp.innerHTML=`
    <div class="status"><span>Événement <b>${F1.i+1}</b>/${F1.list.length}</span><span class="grow"></span><span>Points <b id="fsc">${F1.score}</b></span></div>
    <div id="fcard">
      <div class="react" id="fv"></div>
      <p class="annot" id="fan">À quelle période cet événement appartient-il ?</p>
      <p class="hyp">${esc(q.label.charAt(0).toUpperCase()+q.label.slice(1))}</p>
      <div class="fig" id="ffig">${friseSVG()}</div>
      <p class="why" id="fwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="fnext">Suivant</button></div>`;
  const repondre=id=>{
    const ok=id===q.t;
    if(ok)F1.score+=10;
    else F1.errs.push({rep:`${q.d} : ${q.label}`,w:`C'est la période ${TRANCHES[q.t].label}. ${q.w}`});
    $("#ffig").innerHTML=friseSVG({bonne:q.t,choisie:id,an:q.an});
    showVerdict(ok,"#fv",F1);
    $("#fcard").classList.add("revealed");
    $("#fan").textContent=`${q.d} : ${q.label}`;
    $("#fwhy").innerHTML=(ok?"":`<em>Non, c'était ${TRANCHES[q.t].court}. </em>`)+q.w;
    $("#fsc").textContent=F1.score;
    const n=$("#fnext");n.classList.remove("hidden");
    n.textContent=F1.i===F1.list.length-1?"Voir le bilan":"Suivant";
    n.onclick=()=>{F1.i++;friStep();};
    n.focus({preventScroll:true});
  };
  fp.querySelectorAll("#ffig .tr").forEach(g=>{
    g.onclick=()=>repondre(g.dataset.tr);
    g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();repondre(g.dataset.tr);}};
  });
}
function friEnd(){
  F1.secs=Math.round((Date.now()-F1.t0)/1000);
  logResult("frise",F1.score,F1.list.length-F1.errs.length,F1.list.length,F1.secs);
  fp.innerHTML=bilanHTML(F1,"Tu situes tes dates. Passe à « En contexte » pour les relier à leur événement.");
  $("#again",fp).onclick=friStart;
}
```

- [ ] **Step 6 : Neutraliser provisoirement les trois autres onglets**

Pour que la page charge, ajouter en fin de script trois intros minimales qui seront remplacées à la tâche 3 :

```js
function quizIntro(){$("#quiz").innerHTML=`<div class="intro"><h2>Bientôt</h2><p>Cette manche arrive à la tâche suivante.</p></div>`;}
function memoIntro(){$("#memo").innerHTML=`<div class="intro"><h2>Bientôt</h2><p>Cette manche arrive à la tâche suivante.</p></div>`;}
function cartesIntro(){$("#cartes").innerHTML=`<div class="intro"><h2>Bientôt</h2><p>Cette manche arrive à la tâche suivante.</p></div>`;}
```

Et l'amorçage du premier panneau, en toute fin de script :

```js
friIntro();
```

- [ ] **Step 7 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs histoire-dates.html
```

Attendu : une ligne `KO ... 1 appel(s) à logResult pour 4 onglets` (les trois autres manches n'existent pas encore) et rien d'autre. Si le script ne compile pas, corriger avant de continuer.

- [ ] **Step 8 : Vérifier dans le navigateur**

```bash
open histoire-dates.html
```

Contrôler, en jouant une manche entière de dix événements :
- les cinq bandes de la frise sont visibles, lisibles, et aucune n'est plus étroite que le doigt ;
- après réponse, la bonne bande est encadrée, la mauvaise est barrée, et le repère pointillé tombe bien dans la bonne bande ;
- la série (« 🔥 3 d'affilée ! ») apparaît à partir de trois bonnes réponses ;
- le bilan liste les erreurs et « Nouvelle manche » relance ;
- à 360 px de large, la frise n'est pas coupée.

- [ ] **Step 9 : Commit**

```bash
git add histoire-dates.html
git commit -m "Ajoute le carnet des dates et sa frise chronologique

Les 23 dates du programme, réparties en cinq périodes, et une frise
SVG cliquable où l'élève situe chaque événement. Les trois autres
manches suivent."
```

---

### Task 3 : `histoire-dates.html`, les manches En contexte, Mémo et Cartes

**Files:**
- Modify: `histoire-dates.html` (remplacer les trois `Intro` provisoires de la tâche 2)
- Read for reference: `classes-grammaticales.html` (manches `quiz`, `memo`, `cartes` : la mécanique du QCM, du memory et des flashcards Leitner y est déjà écrite)

**Interfaces:**
- Consomme : `DATES`, `TRANCHES`, `TORDRE`, `$`, `shuffle`, `pick`, `esc`, `rnd`, `chrono`, `showVerdict`, `bilanHTML`, `logResult` de la tâche 2.
- Produit : rien pour les tâches suivantes ; ce fichier est terminé après cette tâche.

- [ ] **Step 1 : La manche En contexte**

Remplacer `function quizIntro(){...}` par une manche QCM à dix questions, tirées dans les deux sens. Les distracteurs viennent en priorité de la même tranche, pour que la réponse ne se devine pas à l'époque :

```js
/* ============ 2. en contexte ============ */
const Q={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const qp=$("#quiz");
/* trois distracteurs, pris d'abord dans la meme tranche puis ailleurs */
function leurres(bonne){
  const meme=shuffle(DATES.filter(x=>x!==bonne&&x.t===bonne.t));
  const autres=shuffle(DATES.filter(x=>x!==bonne&&x.t!==bonne.t));
  return [...meme,...autres].slice(0,3);
}
function quizIntro(){
  qp.innerHTML=`<div class="intro">
    <h2>La date et l'événement</h2>
    <p>Dix questions, tirées dans les deux sens : parfois on te donne la date et tu choisis l'événement, parfois l'inverse. Attention, les propositions se ressemblent souvent : elles viennent de la même époque.</p>
    <button class="btn" id="qgo">Commencer la manche</button>
  </div>`;
  $("#qgo").onclick=quizStart;
}
function quizStart(){
  Q.list=pick(DATES,10).map(d=>({d,sens:Math.random()<.5?"date":"evt"}));
  Q.i=0;Q.score=0;Q.errs=[];Q.streak=0;Q.t0=Date.now();quizStep();
}
function quizStep(){
  if(Q.i>=Q.list.length)return quizEnd();
  const {d:q,sens}=Q.list[Q.i];
  const props=shuffle([q,...leurres(q)]);
  const enonce=sens==="date"?esc(q.d):esc(q.label.charAt(0).toUpperCase()+q.label.slice(1));
  const consigne=sens==="date"?"Que s'est-il passé cette année-là ?":"En quelle année ?";
  qp.innerHTML=`
    <div class="status"><span>Question <b>${Q.i+1}</b>/${Q.list.length}</span><span class="grow"></span><span>Points <b id="qsc">${Q.score}</b></span></div>
    <div id="qcard">
      <div class="react" id="qv"></div>
      <p class="annot">${consigne}</p>
      <p class="hyp enonce">${enonce}</p>
      <div class="choix">${props.map((p,i)=>
        `<button class="opt" data-i="${i}">${sens==="date"?esc(p.label):esc(p.d)}</button>`).join("")}</div>
      <p class="why" id="qwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="qnext">Suivante</button></div>`;
  qp.querySelectorAll(".opt").forEach((b,i)=>{
    b.onclick=()=>{
      const choisi=props[i], ok=choisi===q;
      if(ok)Q.score+=10;else Q.errs.push({rep:`${q.d} : ${q.label}`,w:q.w});
      qp.querySelectorAll(".opt").forEach((x,j)=>{
        x.disabled=true;
        if(props[j]===q)x.classList.add("good");
        else if(j===i)x.classList.add("bad");
        else x.classList.add("dim");
      });
      showVerdict(ok,"#qv",Q);
      $("#qcard").classList.add("revealed");
      $("#qwhy").innerHTML=`<b>${esc(q.d)} : ${esc(q.label)}.</b> ${q.w}`;
      $("#qsc").textContent=Q.score;
      const n=$("#qnext");n.classList.remove("hidden");
      n.textContent=Q.i===Q.list.length-1?"Voir le bilan":"Suivante";
      n.onclick=()=>{Q.i++;quizStep();};
      n.focus({preventScroll:true});
    };
  });
}
function quizEnd(){
  Q.secs=Math.round((Date.now()-Q.t0)/1000);
  logResult("quiz",Q.score,Q.list.length-Q.errs.length,Q.list.length,Q.secs);
  qp.innerHTML=bilanHTML(Q,"Tu relies date et événement sans hésiter. Va voir le mémo pour les apparier plus vite encore.");
  $("#again",qp).onclick=quizStart;
}
```

Le style des propositions est déjà dans le fichier (bloc CSS `/* ---------- choix ---------- */` hérité de `thales.html`). Ajouter seulement, à la fin de ce bloc :

```css
.enonce{font-family:var(--serif);font-size:26px;line-height:1.15;color:var(--histoire);margin:6px 0 14px}
```

- [ ] **Step 2 : La manche Mémo**

Remplacer `function memoIntro(){...}` par un memory de six paires date / événement :

```js
/* ============ 3. memo ============ */
const M={paires:[],cartes:[],ouverte:null,trouve:0,essais:0,t0:0,bloque:false,secs:0};
const mp=$("#memo");
function memoIntro(){
  mp.innerHTML=`<div class="intro">
    <h2>Six paires à retrouver</h2>
    <p>Douze cartes face cachée : six dates et les six événements qui vont avec. Retourne-les deux par deux. Moins tu fais d'essais, meilleur est ton score.</p>
    <button class="btn" id="mgo">Commencer la partie</button>
  </div>`;
  $("#mgo").onclick=memoStart;
}
function memoStart(){
  M.paires=pick(DATES,6);
  M.cartes=shuffle(M.paires.flatMap((p,i)=>[
    {p:i,face:esc(p.d),type:"date"},
    {p:i,face:esc(p.label),type:"evt"}
  ]));
  M.ouverte=null;M.trouve=0;M.essais=0;M.bloque=false;M.t0=Date.now();memoRender();
}
function memoRender(){
  mp.innerHTML=`
    <div class="status"><span>Paires <b id="mtr">${M.trouve}</b>/6</span><span class="grow"></span><span>Essais <b id="mes">${M.essais}</b></span></div>
    <div class="grille">${M.cartes.map((c,i)=>
      `<button class="mcarte ${c.type}" data-i="${i}"><span class="dos">?</span><span class="face">${c.face}</span></button>`).join("")}</div>`;
  mp.querySelectorAll(".mcarte").forEach(b=>{b.onclick=()=>memoClic(+b.dataset.i,b);});
}
function memoClic(i,btn){
  if(M.bloque||btn.classList.contains("vue")||btn.classList.contains("prise"))return;
  btn.classList.add("vue");
  if(M.ouverte===null){M.ouverte={i,btn};return;}
  M.essais++;$("#mes").textContent=M.essais;
  const a=M.ouverte, b={i,btn};
  M.ouverte=null;
  if(M.cartes[a.i].p===M.cartes[b.i].p&&a.i!==b.i){
    a.btn.classList.add("prise");b.btn.classList.add("prise");
    M.trouve++;$("#mtr").textContent=M.trouve;
    if(M.trouve===6)setTimeout(memoEnd,450);
  }else{
    M.bloque=true;
    setTimeout(()=>{a.btn.classList.remove("vue");b.btn.classList.remove("vue");M.bloque=false;},750);
  }
}
function memoEnd(){
  M.secs=Math.round((Date.now()-M.t0)/1000);
  logResult("memo",Math.max(0,120-M.essais*5),6,6,M.secs);
  const mot=M.essais<=8?"🏆 Mémoire de champion !":M.essais<=12?"🌟 Très bien joué !":"👍 Toutes les paires y sont !";
  mp.innerHTML=`<div class="bilan">
    <h2>${mot}</h2>
    <p class="bigscore">${M.essais}<span style="font-size:24px;color:var(--ink-soft)"> essais</span></p>
    <p class="meta">Six paires retrouvées en ${chrono(M.secs)}.</p>
    <p class="section-title">Les paires de cette partie</p>
    <ul class="errlist">${M.paires.map(p=>`<li><span class="rep">${esc(p.d)}</span> ${esc(p.label)}</li>`).join("")}</ul>
    <div class="row-end"><button class="btn ghost" id="again">Nouvelle partie</button></div>
  </div>`;
  $("#again",mp).onclick=memoStart;
}
```

Ajouter le CSS du memory à la fin du `<style>`, avant les media queries :

```css
/* ---------- memory ---------- */
.grille{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 4px}
.mcarte{
  position:relative;min-height:76px;padding:8px 6px;
  border:1px solid var(--rule);border-radius:8px;background:var(--paper-2);
  font-family:var(--sans);font-size:12px;font-weight:700;line-height:1.25;color:var(--ink);
  cursor:pointer;overflow:hidden
}
.mcarte .dos{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:var(--histoire);color:#fff;font-family:var(--serif);font-size:26px;
  transition:opacity .2s
}
.mcarte .face{display:block;opacity:0;transition:opacity .2s}
.mcarte.vue .dos,.mcarte.prise .dos{opacity:0;pointer-events:none}
.mcarte.vue .face,.mcarte.prise .face{opacity:1}
.mcarte.date .face{font-family:var(--serif);font-size:17px;color:var(--histoire)}
.mcarte.prise{border-color:var(--histoire);box-shadow:0 2px 0 var(--histoire);cursor:default}
@media (max-width:360px){
  .grille{grid-template-columns:repeat(2,1fr)}
}
@media (prefers-reduced-motion:reduce){
  .mcarte .dos,.mcarte .face{transition:none}
}
```

- [ ] **Step 3 : La manche Cartes**

Remplacer `function cartesIntro(){...}` par des flashcards Leitner à trois boîtes :

```js
/* ============ 4. cartes ============ */
const C={boites:[[],[],[]],courante:null,vue:false,tours:0,ratees:[],taille:0,t0:0,secs:0};
const cp=$("#cartes");
function cartesIntro(){
  cp.innerHTML=`<div class="intro">
    <h2>Réviser en cartes</h2>
    <p>Douze dates, recto la date, verso l'événement. Tu réponds dans ta tête, tu retournes, puis tu dis si tu savais. Ce que tu sais part dans la boîte suivante, ce que tu rates revient tout de suite. La manche s'arrête quand les douze sont dans la dernière boîte.</p>
    <button class="btn" id="cgo">Commencer la manche</button>
  </div>`;
  $("#cgo").onclick=cartesStart;
}
function cartesStart(){
  const tirage=pick(DATES,12);
  C.boites=[shuffle(tirage),[],[]];
  C.taille=tirage.length;C.tours=0;C.ratees=[];C.vue=false;C.t0=Date.now();
  cartesStep();
}
function cartesTire(){
  for(const b of C.boites.slice(0,2))if(b.length)return b;
  return null;
}
function cartesStep(){
  const boite=cartesTire();
  if(!boite)return cartesEnd();
  const idx=C.boites.indexOf(boite);
  C.courante={carte:boite[0],idx};
  C.vue=false;
  const restants=C.boites[0].length+C.boites[1].length;
  cp.innerHTML=`
    <div class="status"><span>Boîte <b>${idx+1}</b>/3</span><span class="grow"></span><span>Reste <b>${restants}</b></span></div>
    <div class="flash" id="cflash">
      <p class="recto">${esc(C.courante.carte.d)}</p>
      <p class="verso hidden" id="cverso">${esc(C.courante.carte.label)}<span class="detail">${C.courante.carte.w}</span></p>
    </div>
    <div class="row-end" id="cactions"><button class="btn" id="cflip">Retourner</button></div>`;
  $("#cflip").onclick=()=>{
    C.vue=true;
    $("#cverso").classList.remove("hidden");
    $("#cactions").innerHTML=`<button class="btn" id="csu">Je savais</button><button class="btn no" id="cnon">Pas su</button>`;
    $("#csu").onclick=()=>cartesJuge(true);
    $("#cnon").onclick=()=>cartesJuge(false);
  };
}
function cartesJuge(su){
  const {carte,idx}=C.courante;
  C.tours++;
  C.boites[idx].shift();
  if(su)C.boites[idx+1].push(carte);
  else{C.boites[0].push(carte);if(!C.ratees.includes(carte))C.ratees.push(carte);}
  cartesStep();
}
function cartesEnd(){
  C.secs=Math.round((Date.now()-C.t0)/1000);
  const sues=C.taille-C.ratees.length;
  logResult("cartes",C.tours,sues,C.taille,C.secs);
  cp.innerHTML=`<div class="bilan">
    <h2>${C.ratees.length===0?"🏆 Les douze du premier coup !":C.ratees.length<=3?"🌟 Belle révision !":"💪 Elles rentrent, continue !"}</h2>
    <p class="bigscore">${C.tours}<span style="font-size:24px;color:var(--ink-soft)"> retournements</span></p>
    <p class="meta">${sues} date${sues>1?"s":""} sue${sues>1?"s":""} du premier coup sur ${C.taille}, en ${chrono(C.secs)}.</p>
    ${C.ratees.length?`<p class="section-title">À revoir</p><ul class="errlist">${C.ratees.map(c=>
      `<li><span class="rep">${esc(c.d)}</span> ${esc(c.label)}</li>`).join("")}</ul>`
     :`<p class="section-title">Sans faute</p><p style="margin-top:8px">Tu peux passer aux personnages.</p>`}
    <div class="row-end"><button class="btn ghost" id="again">Nouvelle manche</button></div>
  </div>`;
  $("#again",cp).onclick=cartesStart;
}
```

Ajouter le CSS des flashcards à la fin du `<style>`, avant les media queries :

```css
/* ---------- flashcards ---------- */
.flash{
  border:1px solid var(--rule);border-left:3px solid var(--histoire);border-radius:8px;
  background:var(--paper-2);padding:26px 18px;margin:14px 0 4px;min-height:150px;
  display:flex;flex-direction:column;justify-content:center;text-align:center
}
.flash .recto{font-family:var(--serif);font-size:32px;line-height:1.1;margin:0;color:var(--histoire)}
.flash .verso{margin:16px 0 0;font-size:16px;font-weight:700;line-height:1.35;border-top:1px solid var(--rule-soft);padding-top:14px}
.flash .verso.hidden{display:none}
.flash .detail{display:block;margin-top:8px;font-weight:400;font-size:13.5px;color:var(--ink-soft)}
@media (max-width:420px){
  .flash .recto{font-size:27px}
}
```

- [ ] **Step 4 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs histoire-dates.html
```

Attendu : `Tout est bon.` Les quatre appels à `logResult` (`frise`, `quiz`, `memo`, `cartes`) sont maintenant présents.

- [ ] **Step 5 : Vérifier dans le navigateur**

```bash
open histoire-dates.html
```

Jouer les quatre manches en entier. Contrôler :
- **En contexte** : les deux sens apparaissent bien au fil des dix questions ; les trois leurres sont plausibles ; après réponse, la bonne proposition est marquée même quand on s'est trompé ;
- **Mémo** : douze cartes, un clic sur une carte déjà prise ne fait rien, deux clics rapides sur la même carte ne comptent pas une paire, la partie se termine à six paires ;
- **Cartes** : « Pas su » ramène bien la carte en boîte 1, « Je savais » la fait monter, la manche s'arrête quand tout est en boîte 3 et ne boucle pas à l'infini ;
- à 360 px, la grille du memory passe à deux colonnes.

- [ ] **Step 6 : Commit**

```bash
git add histoire-dates.html
git commit -m "Complète le carnet des dates : QCM, mémo et cartes

Les trois manches restantes. Le QCM tire dans les deux sens et pioche
ses leurres dans la même période, pour qu'on ne réponde pas au flair."
```

---

### Task 4 : `histoire-personnages.html`

**Files:**
- Create: `histoire-personnages.html`
- Read for reference: `histoire-dates.html` (tâches 2 et 3 : c'est le fichier jumeau, tout le CSS et les helpers en viennent)

**Interfaces:**
- Consomme : la structure complète de `histoire-dates.html`, recopiée, ainsi que `TRANCHES`, `TORDRE`, `friseSVG`, `friseX` et tout le CSS de la frise, du memory et des flashcards.
- Produit : rien pour les tâches suivantes.

- [ ] **Step 1 : Créer le fichier à partir du jumeau**

Copier `histoire-dates.html` vers `histoire-personnages.html`, puis :

1. `<title>` : `Les 21 personnages`.
2. Ajouter dans `:root`, sous les cinq variables de tranche, les huit couleurs de catégorie :

```css
  --gm1:#7C3A2E;
  --totalitarismes:#5B2333;
  --allies:#2F5D62;
  --resistance:#1B6F55;
  --vichy:#6B6257;
  --froide:#4A5F8A;
  --deco:#A6702B;
  --europe:#1D4E89;
```

3. L'en-tête :

```html
    <div class="topbar"><a class="home" href="histoire.html">🏠 Histoire</a><p class="eyebrow">Histoire, 3<sup>e</sup></p></div>
    <h1>Les 21 personnages <em>et leur rôle</em></h1>
    <p class="sub">Quatre entraînements : reconnaître un rôle, situer un personnage, apparier, réviser en cartes.</p>
    <nav role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-panel="qui">Qui est-ce ?</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="frise">Frise</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="memo">Mémo</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="cartes">Cartes</button>
    </nav>
```

4. Les panneaux :

```html
  <div class="sheet">
    <section class="panel on" id="qui"></section>
    <section class="panel" id="frise"></section>
    <section class="panel" id="memo"></section>
    <section class="panel" id="cartes"></section>
  </div>
```

5. Le bloc `/* onglets */` :

```js
    if(t.dataset.panel==="qui")quiIntro();
    if(t.dataset.panel==="frise")friIntro();
    if(t.dataset.panel==="memo")memoIntro();
    if(t.dataset.panel==="cartes")cartesIntro();
```

6. Dans `logResult`, `page:"histoire-personnages"`.
7. L'amorçage final devient `quiIntro();`.
8. Supprimer la constante `DATES` et la manche « En contexte » (`quizIntro`, `quizStart`, `quizStep`, `quizEnd`, `leurres`) : elles sont remplacées ci-dessous. Garder `TRANCHES`, `TORDRE`, `FRISE_GEO`, `friseX`, `friseSVG`, tout le CSS, et les manches Mémo et Cartes qui seront réadaptées au step 4.

- [ ] **Step 2 : Écrire les données**

```js
const ROLES={
  gm1:{label:"Première Guerre mondiale",v:"--gm1"},
  totalitarismes:{label:"Régimes totalitaires",v:"--totalitarismes"},
  allies:{label:"Les Alliés",v:"--allies"},
  resistance:{label:"France libre et Résistance",v:"--resistance"},
  vichy:{label:"Vichy et la collaboration",v:"--vichy"},
  froide:{label:"Guerre froide",v:"--froide"},
  deco:{label:"Décolonisation",v:"--deco"},
  europe:{label:"Construction européenne",v:"--europe"}
};

/* fait = le fait precis affiche dans la manche Frise, pour que la periode
   soit determinee meme quand la vie du personnage traverse plusieurs tranches */
const PERSONNAGES=[
 {nom:"Georges Clemenceau",annees:"1841-1929",r:"gm1",t:"t1",an:1917,
  court:"le Tigre, président du Conseil qui mène la France à la victoire de 1918",
  fait:"président du Conseil à partir de 1917",
  role:"Surnommé « le Tigre », il devient président du Conseil en 1917 et redresse le moral du pays. Il mène la France à la victoire de 1918 puis négocie le traité de Versailles."},
 {nom:"Jean Jaurès",annees:"1859-1914",r:"gm1",t:"t1",an:1914,
  court:"député socialiste et pacifiste, assassiné à la veille de la guerre",
  fait:"assassiné le 31 juillet 1914",
  role:"Député socialiste, fondateur du journal L'Humanité, il se bat jusqu'au bout pour empêcher la guerre. Il est assassiné le 31 juillet 1914, la veille de la mobilisation."},
 {nom:"Vladimir Lénine",annees:"1870-1924",r:"totalitarismes",t:"t1",an:1917,
  court:"chef des bolcheviks, il fonde le premier État communiste",
  fait:"prend le pouvoir en Russie en octobre 1917",
  role:"Chef des bolcheviks, il prend le pouvoir lors de la révolution d'Octobre 1917 et fonde le premier État communiste, qui devient l'URSS en 1922."},
 {nom:"Joseph Staline",annees:"1878-1953",r:"totalitarismes",t:"t2",an:1928,
  court:"dictateur de l'URSS, collectivisation forcée et goulag",
  fait:"prend la tête de l'URSS à partir de 1928",
  role:"Successeur de Lénine, il dirige l'URSS d'une main de fer : collectivisation forcée, goulag, culte de la personnalité. Allié des Occidentaux contre Hitler, il devient leur adversaire dès 1947."},
 {nom:"Benito Mussolini",annees:"1883-1945",r:"totalitarismes",t:"t2",an:1922,
  court:"le Duce, fondateur du fascisme italien",
  fait:"prend le pouvoir en Italie en 1922",
  role:"Fondateur du fascisme, il prend le pouvoir en Italie en 1922 après la marche sur Rome et installe une dictature. Il devient l'allié de Hitler dans la guerre."},
 {nom:"Adolf Hitler",annees:"1889-1945",r:"totalitarismes",t:"t2",an:1933,
  court:"chef du parti nazi, il déclenche la guerre et organise la Shoah",
  fait:"arrive au pouvoir en Allemagne en 1933",
  role:"Chef du parti nazi, chancelier en 1933, il installe une dictature raciste et antisémite. Il déclenche la Seconde Guerre mondiale et organise le génocide des Juifs et des Tsiganes."},
 {nom:"Franklin D. Roosevelt",annees:"1882-1945",r:"allies",t:"t3",an:1941,
  court:"président des États-Unis, le New Deal puis la guerre aux côtés des Alliés",
  fait:"engage les États-Unis dans la guerre en 1941",
  role:"Président des États-Unis de 1933 à 1945, il lance le New Deal contre la crise de 1929, puis engage son pays dans la guerre après Pearl Harbor en décembre 1941."},
 {nom:"Winston Churchill",annees:"1874-1965",r:"allies",t:"t3",an:1940,
  court:"Premier ministre britannique, il refuse tout compromis avec Hitler",
  fait:"Premier ministre britannique à partir de mai 1940",
  role:"Premier ministre britannique à partir de 1940, il refuse tout compromis avec Hitler et incarne la résistance des Alliés. En 1946, il popularise l'expression « rideau de fer »."},
 {nom:"Charles de Gaulle",annees:"1890-1970",r:"resistance",t:"t3",an:1940,
  court:"l'appel du 18 juin, la France libre, puis la Ve République",
  fait:"lance l'appel du 18 juin 1940 depuis Londres",
  role:"Général, il refuse l'armistice et lance l'appel du 18 juin 1940 depuis Londres. Il dirige la France libre, puis fonde et préside la Ve République de 1958 à 1969."},
 {nom:"Jean Moulin",annees:"1899-1943",r:"resistance",t:"t3",an:1943,
  court:"il unifie la Résistance intérieure et meurt sans parler",
  fait:"unifie la Résistance au sein du CNR en 1943",
  role:"Envoyé par de Gaulle, il unifie les mouvements de la Résistance intérieure au sein du Conseil national de la Résistance en mai 1943. Arrêté et torturé, il meurt sans avoir parlé."},
 {nom:"Lucie Aubrac",annees:"1912-2007",r:"resistance",t:"t3",an:1943,
  court:"résistante, cofondatrice de Libération-Sud",
  fait:"fait évader son mari des mains de la Gestapo en 1943",
  role:"Résistante française, cofondatrice du mouvement Libération-Sud. En 1943, elle organise l'évasion de son mari Raymond, prisonnier de la Gestapo de Lyon."},
 {nom:"Germaine Tillion",annees:"1907-2008",r:"resistance",t:"t3",an:1942,
  court:"ethnologue et résistante, déportée à Ravensbrück",
  fait:"réseau du Musée de l'Homme, déportée en 1943",
  role:"Ethnologue, elle entre dès 1940 dans le réseau du Musée de l'Homme, l'un des tout premiers de la Résistance. Déportée à Ravensbrück, elle est entrée au Panthéon en 2015."},
 {nom:"Philippe Pétain",annees:"1856-1951",r:"vichy",t:"t3",an:1940,
  court:"vainqueur de Verdun devenu chef de l'État français collaborateur",
  fait:"devient chef de l'État français en juillet 1940",
  role:"Vainqueur de Verdun en 1916, il devient en juillet 1940 chef de l'État français. Son régime de Vichy supprime la République et collabore avec l'Allemagne nazie."},
 {nom:"Harry S. Truman",annees:"1884-1972",r:"froide",t:"t4",an:1947,
  court:"président américain, la bombe atomique puis l'endiguement",
  fait:"lance la doctrine d'endiguement en 1947",
  role:"Président des États-Unis, il décide des bombardements d'Hiroshima et Nagasaki en août 1945. En 1947, sa doctrine d'endiguement ouvre la guerre froide."},
 {nom:"Nikita Khrouchtchev",annees:"1894-1971",r:"froide",t:"t4",an:1961,
  court:"dirigeant soviétique du mur de Berlin et de la crise de Cuba",
  fait:"fait construire le mur de Berlin en 1961",
  role:"Dirigeant de l'URSS, il dénonce les crimes de Staline en 1956, fait construire le mur de Berlin en 1961, puis recule lors de la crise de Cuba en 1962."},
 {nom:"Nehru",annees:"1889-1964",r:"deco",t:"t4",an:1947,
  court:"premier chef de gouvernement de l'Inde indépendante",
  fait:"Premier ministre de l'Inde indépendante en 1947",
  role:"Premier ministre de l'Inde à partir de son indépendance en 1947. Figure de la décolonisation, il est l'un des artisans du non-alignement à la conférence de Bandung en 1955."},
 {nom:"Nasser",annees:"1918-1970",r:"deco",t:"t4",an:1956,
  court:"président égyptien, il nationalise le canal de Suez",
  fait:"nationalise le canal de Suez en 1956",
  role:"Président de l'Égypte, il nationalise le canal de Suez en 1956 face aux Occidentaux. Il devient une grande figure du nationalisme arabe et du non-alignement."},
 {nom:"Robert Schuman",annees:"1886-1963",r:"europe",t:"t4",an:1950,
  court:"sa déclaration de 1950 lance la construction européenne",
  fait:"déclaration du 9 mai 1950",
  role:"Ministre français des Affaires étrangères, sa déclaration du 9 mai 1950 propose de mettre en commun le charbon et l'acier. C'est l'acte de naissance de la construction européenne."},
 {nom:"Simone Veil",annees:"1927-2017",r:"europe",t:"t5",an:1979,
  court:"rescapée d'Auschwitz, loi de 1975, première présidente du Parlement européen élu",
  fait:"première présidente du Parlement européen élu, en 1979",
  role:"Rescapée d'Auschwitz, ministre de la Santé, elle fait adopter en 1975 la loi dépénalisant l'IVG. En 1979, elle devient la première présidente du Parlement européen élu au suffrage universel."},
 {nom:"Mikhaïl Gorbatchev",annees:"1931-2022",r:"froide",t:"t5",an:1991,
  court:"dernier dirigeant de l'URSS, perestroïka et fin de la guerre froide",
  fait:"ses réformes mènent à la disparition de l'URSS en 1991",
  role:"Dernier dirigeant de l'URSS. Ses réformes, la perestroïka et la glasnost, mènent à la fin de la guerre froide et à la disparition de l'Union soviétique en 1991."},
 {nom:"François Mitterrand",annees:"1916-1996",r:"europe",t:"t5",an:1992,
  court:"président français, il fait adopter le traité de Maastricht",
  fait:"fait adopter le traité de Maastricht en 1992",
  role:"Président de la République de 1981 à 1995. Avec le chancelier allemand Helmut Kohl, il relance l'Europe et fait adopter le traité de Maastricht par référendum en 1992."}
];
```

- [ ] **Step 3 : La manche Qui est-ce ?**

```js
/* ============ 1. qui est-ce ============ */
const P={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const pp=$("#qui");
/* trois leurres, pris d'abord dans la meme categorie */
function leurresP(bon){
  const meme=shuffle(PERSONNAGES.filter(x=>x!==bon&&x.r===bon.r));
  const autres=shuffle(PERSONNAGES.filter(x=>x!==bon&&x.r!==bon.r));
  return [...meme,...autres].slice(0,3);
}
function quiIntro(){
  pp.innerHTML=`<div class="intro">
    <h2>Qui est-ce ?</h2>
    <p>Dix rôles, dix personnages. On te décrit ce qu'un personnage a fait, à toi de dire qui c'est. Les propositions viennent souvent de la même famille : lis bien.</p>
    <button class="btn" id="pgo">Commencer la manche</button>
  </div>`;
  $("#pgo").onclick=quiStart;
}
function quiStart(){
  P.list=pick(PERSONNAGES,10);P.i=0;P.score=0;P.errs=[];P.streak=0;P.t0=Date.now();quiStep();
}
function quiStep(){
  if(P.i>=P.list.length)return quiEnd();
  const q=P.list[P.i];
  const props=shuffle([q,...leurresP(q)]);
  pp.innerHTML=`
    <div class="status"><span>Personnage <b>${P.i+1}</b>/${P.list.length}</span><span class="grow"></span><span>Points <b id="psc">${P.score}</b></span></div>
    <div id="pcard">
      <div class="react" id="pv"></div>
      <p class="annot">De qui parle-t-on ?</p>
      <p class="hyp">${esc(q.role)}</p>
      <div class="choix">${props.map((x,i)=>`<button class="opt" data-i="${i}">${esc(x.nom)}</button>`).join("")}</div>
      <p class="why" id="pwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="pnext">Suivant</button></div>`;
  pp.querySelectorAll(".opt").forEach((b,i)=>{
    b.onclick=()=>{
      const ok=props[i]===q;
      if(ok)P.score+=10;else P.errs.push({rep:q.nom,w:q.court+"."});
      pp.querySelectorAll(".opt").forEach((x,j)=>{
        x.disabled=true;
        if(props[j]===q)x.classList.add("good");
        else if(j===i)x.classList.add("bad");
        else x.classList.add("dim");
      });
      showVerdict(ok,"#pv",P);
      $("#pcard").classList.add("revealed");
      $("#pwhy").innerHTML=`<b>${esc(q.nom)} (${esc(q.annees)})</b>, <span class="cat" style="color:var(${ROLES[q.r].v})">${esc(ROLES[q.r].label)}</span>.`;
      $("#psc").textContent=P.score;
      const n=$("#pnext");n.classList.remove("hidden");
      n.textContent=P.i===P.list.length-1?"Voir le bilan":"Suivant";
      n.onclick=()=>{P.i++;quiStep();};
      n.focus({preventScroll:true});
    };
  });
}
function quiEnd(){
  P.secs=Math.round((Date.now()-P.t0)/1000);
  logResult("qui",P.score,P.list.length-P.errs.length,P.list.length,P.secs);
  pp.innerHTML=bilanHTML(P,"Tu les reconnais tous. Va les situer sur la frise.");
  $("#again",pp).onclick=quiStart;
}
```

Ajouter à la fin du `<style>` :

```css
.cat{font-weight:700}
```

- [ ] **Step 4 : Adapter les manches Frise, Mémo et Cartes aux personnages**

La manche Frise recopiée de `histoire-dates.html` change sur trois points : elle tire dans `PERSONNAGES`, elle affiche le nom **et** le fait déterminant, et son intro explique pourquoi. Remplacer `friIntro`, `friStart` et l'intérieur de `friStep` par :

```js
function friIntro(){
  fp.innerHTML=`<div class="intro">
    <h2>À quelle époque ?</h2>
    <p>Dix personnages. Pour chacun, on te rappelle le fait qui l'a rendu célèbre : clique la période de la frise où ce fait se place. C'est le fait qui compte, pas toute la vie du personnage.</p>
    <button class="btn" id="fgo">Commencer la manche</button>
  </div>`;
  $("#fgo").onclick=friStart;
}
function friStart(){
  F1.list=pick(PERSONNAGES,10);F1.i=0;F1.score=0;F1.errs=[];F1.streak=0;F1.t0=Date.now();friStep();
}
```

Dans `friStep`, remplacer la ligne de l'énoncé et celles du dévoilement :

```js
    <p class="annot" id="fan">Quand ce personnage a-t-il joué ce rôle ?</p>
    <p class="hyp"><b>${esc(q.nom)}</b><span class="fait">${esc(q.fait)}</span></p>
```

et, dans la fonction `repondre` :

```js
    if(ok)F1.score+=10;
    else F1.errs.push({rep:q.nom,w:`${q.fait}, donc ${TRANCHES[q.t].court}.`});
    $("#ffig").innerHTML=friseSVG({bonne:q.t,choisie:id,an:q.an});
    showVerdict(ok,"#fv",F1);
    $("#fcard").classList.add("revealed");
    $("#fan").textContent=`${q.nom}, ${TRANCHES[q.t].court}`;
    $("#fwhy").innerHTML=(ok?"":`<em>Non, c'était ${TRANCHES[q.t].court}. </em>`)+q.role;
```

Et le bilan :

```js
  fp.innerHTML=bilanHTML(F1,"Tu les situes tous. Passe au mémo.");
```

Ajouter au `<style>` :

```css
.fait{display:block;margin-top:6px;font-weight:400;font-size:14px;color:var(--ink-soft)}
```

Pour **Mémo**, remplacer dans `memoStart` la construction des cartes :

```js
  M.paires=pick(PERSONNAGES,6);
  M.cartes=shuffle(M.paires.flatMap((p,i)=>[
    {p:i,face:esc(p.nom),type:"date"},
    {p:i,face:esc(p.court),type:"evt"}
  ]));
```

et dans `memoEnd`, la liste de rappel :

```js
    <ul class="errlist">${M.paires.map(p=>`<li><span class="rep">${esc(p.nom)}</span> ${esc(p.court)}</li>`).join("")}</ul>
```

ainsi que l'intro :

```js
    <h2>Six paires à retrouver</h2>
    <p>Douze cartes face cachée : six personnages et les six rôles qui vont avec. Retourne-les deux par deux. Moins tu fais d'essais, meilleur est ton score.</p>
```

Pour **Cartes**, remplacer dans `cartesStart` le tirage :

```js
  const tirage=pick(PERSONNAGES,12);
```

dans `cartesStep`, le recto et le verso :

```js
      <p class="recto">${esc(C.courante.carte.nom)}</p>
      <p class="verso hidden" id="cverso">${esc(C.courante.carte.court)}<span class="detail">${esc(C.courante.carte.role)}</span></p>
```

dans `cartesEnd`, la liste et le décompte :

```js
    <p class="meta">${sues} personnage${sues>1?"s":""} su${sues>1?"s":""} du premier coup sur ${C.taille}, en ${chrono(C.secs)}.</p>
    ${C.ratees.length?`<p class="section-title">À revoir</p><ul class="errlist">${C.ratees.map(c=>
      `<li><span class="rep">${esc(c.nom)}</span> ${esc(c.court)}</li>`).join("")}</ul>`
     :`<p class="section-title">Sans faute</p><p style="margin-top:8px">Les vingt et un sont dans ta tête.</p>`}
```

et l'intro :

```js
    <h2>Réviser en cartes</h2>
    <p>Douze personnages, recto le nom, verso le rôle. Tu réponds dans ta tête, tu retournes, puis tu dis si tu savais. Ce que tu rates revient tout de suite.</p>
```

Le recto d'une flashcard de personnage est plus long qu'une date : réduire sa taille dans le CSS de ce fichier :

```css
.flash .recto{font-family:var(--serif);font-size:27px;line-height:1.15;margin:0;color:var(--histoire)}
```

- [ ] **Step 5 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs histoire-personnages.html histoire.html
```

Attendu pour `histoire-personnages.html` : aucun `KO`, quatre appels à `logResult` (`qui`, `frise`, `memo`, `cartes`). Pour `histoire.html` : il ne reste qu'un lien mort, `histoire-memo.html`.

- [ ] **Step 6 : Vérifier dans le navigateur**

```bash
open histoire-personnages.html
```

Contrôler notamment que la manche Frise affiche bien le fait déterminant sous le nom : sans lui, de Gaulle, Staline et Simone Veil seraient impossibles à placer. Jouer les quatre manches.

- [ ] **Step 7 : Commit**

```bash
git add histoire-personnages.html
git commit -m "Ajoute le carnet des personnages

Les 21 personnages du programme, chacun avec son rôle rédigé, sa
catégorie et le fait daté qui permet de le situer sur la frise."
```

---

### Task 5 : `geo-france.html`, le socle, le moteur de cartes et les régions

**Files:**
- Create: `geo-france.html`
- Read for reference: `histoire-dates.html` (structure de carnet), `thales.html:238-284` (`figSVG`, le modèle d'un moteur de figures)

**Interfaces:**
- Consomme : `geographie.html` (le bouton 🏠 y retourne).
- Produit, pour la tâche 6 :
  - `mapSVG(fond, opts)` où `fond` est une des constantes `FOND_ADMIN`, `FOND_PHYSIQUE`, `FOND_MONDE`, et `opts = {bonne, choisie, surligne, etiquettes}`, tous optionnels. Retourne une chaîne SVG. Chaque zone cliquable porte `data-z="<id>"`.
  - Un fond est un objet `{viewBox, zones:[{id, nom, d, cx, cy, type}]}` où `d` est le tracé SVG, `cx`/`cy` l'ancre de l'étiquette et du halo, `type` vaut `"aire"`, `"trait"` ou `"point"`.
  - **`mapSVG` sera étendu deux fois par la suite** : la tâche 6 lui ajoute la gestion des zones `inerte:true` (visibles mais non cliquables), la tâche 7 l'option `montrerUE`. Écrire la version de base ici, les deux ajouts sont détaillés à leur tâche.
  - `REGIONS` : tableau de `{id, nom, capitale, cx, cy}`.

- [ ] **Step 1 : Créer le squelette**

Copier `histoire-dates.html` vers `geo-france.html`, puis :

1. `<title>` : `La carte de France`.
2. Dans `:root`, remplacer le bloc `--histoire` et les cinq `--t*` par :

```css
  --geo:#17697B;
  --terre:#DCE7DB;
  --terre-2:#C6D8C4;
  --eau:#CFE2EE;
  --relief:#C9A98C;
```

3. Remplacer partout `var(--histoire)` par `var(--geo)`.
4. Supprimer `TRANCHES`, `TORDRE`, `FRISE_GEO`, `friseX`, `friseSVG`, `DATES`, les quatre manches, le CSS `/* ---------- frise ---------- */`, ainsi que les blocs CSS `/* ---------- memory ---------- */` et `/* ---------- flashcards ---------- */` : aucune manche de géo ne les utilise. Garder les outils, la gamification et les onglets.
5. L'en-tête :

```html
    <div class="topbar"><a class="home" href="geographie.html">🏠 Géographie</a><p class="eyebrow">Géographie, 3<sup>e</sup></p></div>
    <h1>La France <em>au bout du doigt</em></h1>
    <p class="sub">Quatre entraînements : les régions, leurs capitales, les fleuves et les reliefs, les mers et les DROM.</p>
    <nav role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-panel="regions">Les régions</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="capitales">Les capitales</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="relief">Fleuves et reliefs</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="outremer">Mers et DROM</button>
    </nav>
```

6. Les panneaux, avec les mêmes ids ; le bloc `/* onglets */` appelle `regIntro`, `capIntro`, `relIntro`, `omIntro` ; `logResult` reçoit `page:"geo-france"` ; l'amorçage final est `regIntro();`.
7. `CHEERS` prend une touche géographique :

```js
const CHEERS=[["🎉","Bravo !"],["⭐","Super !"],["🚀","Excellent !"],["🏆","Champion !"],["🗺️","Pile au bon endroit !"],["🔥","Trop fort !"],["🌟","Génial !"],["🧭","Bien orientée !"]];
const OOPS=[["😅","Oups, presque !"],["🙈","Pas cette fois !"],["🤔","Hmm, regarde la carte..."],["🐢","On y va doucement !"],["🧐","Presque ! Lis la correction."]];
```

- [ ] **Step 2 : Écrire le moteur `mapSVG`**

```js
/* ============ moteur de cartes ============ */
/* Un fond = {viewBox, zones:[{id,nom,d,cx,cy,type}]}.
   type "aire"  : polygone plein, cliquable sur toute sa surface.
   type "trait" : polyligne (un fleuve), cliquable via un halo.
   type "point" : repere ponctuel (une ville, une ile), cliquable via un halo.
   Toute zone recoit en plus un halo circulaire de 22 px de rayon centre sur
   cx,cy : sans lui, l'Ile-de-France ou la Corse sont injouables au doigt. */
const HALO=22;
function mapSVG(fond,opts={}){
  const {bonne,choisie,surligne,etiquettes}=opts;
  const corps=fond.zones.map(z=>{
    let cls="z "+z.type;
    if(surligne&&z.id===surligne)cls+=" vise";
    if(bonne&&z.id===bonne)cls+=" good";
    else if(choisie&&z.id===choisie)cls+=" bad";
    else if(bonne)cls+=" dim";
    const forme=z.type==="trait"
      ? `<path d="${z.d}" fill="none"></path>`
      : z.type==="point"
        ? `<circle cx="${z.cx}" cy="${z.cy}" r="4.5"></circle>`
        : `<path d="${z.d}"></path>`;
    const nom=etiquettes?`<text x="${z.cx}" y="${z.cy+3}" text-anchor="middle" class="zlab">${esc(z.nom)}</text>`:"";
    return `<g class="${cls}" data-z="${z.id}" role="button" tabindex="0" aria-label="${esc(z.nom)}">
      ${forme}<circle class="halo" cx="${z.cx}" cy="${z.cy}" r="${HALO}"></circle>${nom}</g>`;
  }).join("");
  return `<svg viewBox="${fond.viewBox}" role="img" aria-label="Carte cliquable">${corps}</svg>`;
}
/* branche les gestionnaires de clic et de clavier sur une carte deja rendue */
function mapBrancher(hote,repondre){
  hote.querySelectorAll(".z").forEach(g=>{
    g.onclick=()=>repondre(g.dataset.z);
    g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();repondre(g.dataset.z);}};
  });
}
```

- [ ] **Step 3 : Écrire le CSS des cartes**

```css
/* ---------- cartes ---------- */
.enonce{font-family:var(--serif);font-size:26px;line-height:1.15;color:var(--geo);margin:6px 0 14px}
.fig{margin:14px 0 4px;text-align:center}
.fig svg{width:100%;max-width:340px;height:auto;background:var(--eau);border-radius:8px}
.fig .z path{fill:var(--terre);stroke:var(--paper-2);stroke-width:1.2;cursor:pointer;transition:fill .15s}
.fig .z.trait path{stroke:#3E7CA8;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round;fill:none}
.fig .z.point circle:not(.halo){fill:var(--ink);stroke:var(--paper-2);stroke-width:1.5}
.fig .halo{fill:transparent;cursor:pointer}
.fig .z:hover path{fill:var(--terre-2)}
.fig .z:focus{outline:none}
.fig .z:focus path{stroke:var(--ink);stroke-width:2}
.fig .z.vise path{fill:var(--geo)}
.fig .z.vise.trait path,.fig .z.vise.point circle:not(.halo){stroke:var(--geo);fill:var(--geo)}
.fig .z.good path{fill:var(--geo);stroke:var(--ink);stroke-width:2}
.fig .z.good.trait path{stroke:var(--geo);stroke-width:4;fill:none}
.fig .z.bad path{fill:var(--marge);opacity:.55}
.fig .z.bad.trait path{stroke:var(--marge);stroke-width:4;fill:none}
.fig .z.dim path{opacity:.75}
.fig .zlab{font-family:var(--sans);font-size:7.5px;font-weight:700;fill:var(--ink-soft);pointer-events:none}
.revealed .fig .z path,.revealed .fig .halo{cursor:default}
@media (prefers-reduced-motion:reduce){
  .fig .z path{transition:none}
}
```

- [ ] **Step 4 : Écrire le fond administratif**

Le tracé est schématique et dessiné à la main : ce qui compte, ce sont les **positions relatives**, données ici par les ancres `cx`/`cy`. Le repère est l'hexagone dans un `viewBox` de `0 0 320 340`, Lille en haut vers (196, 30), Brest à l'ouest vers (18, 120), Strasbourg à l'est vers (300, 105), Perpignan en bas vers (175, 322).

Dessiner les treize polygones en respectant ces ancres, qui sont aussi le centre du halo cliquable :

| id | Région | Capitale | cx | cy |
|---|---|---|---|---|
| `hdf` | Hauts-de-France | Lille | 190 | 40 |
| `nor` | Normandie | Rouen | 110 | 78 |
| `idf` | Île-de-France | Paris | 168 | 96 |
| `ge` | Grand Est | Strasbourg | 255 | 90 |
| `bre` | Bretagne | Rennes | 42 | 118 |
| `pdl` | Pays de la Loire | Nantes | 86 | 140 |
| `cvl` | Centre-Val de Loire | Orléans | 150 | 145 |
| `bfc` | Bourgogne-Franche-Comté | Dijon | 232 | 152 |
| `naq` | Nouvelle-Aquitaine | Bordeaux | 92 | 225 |
| `ara` | Auvergne-Rhône-Alpes | Lyon | 215 | 215 |
| `occ` | Occitanie | Toulouse | 150 | 280 |
| `pac` | Provence-Alpes-Côte d'Azur | Marseille | 255 | 275 |
| `cor` | Corse | Ajaccio | 305 | 315 |

```js
/* ============ donnees ============ */
/* Trace schematique : les formes sont reconnaissables et bien placees les unes
   par rapport aux autres, elles ne sont pas cartographiques. cx,cy est l'ancre
   de l'etiquette et du halo cliquable. */
const REGIONS=[
 {id:"hdf",nom:"Hauts-de-France",capitale:"Lille",cx:190,cy:40},
 {id:"nor",nom:"Normandie",capitale:"Rouen",cx:110,cy:78},
 {id:"idf",nom:"Île-de-France",capitale:"Paris",cx:168,cy:96},
 {id:"ge",nom:"Grand Est",capitale:"Strasbourg",cx:255,cy:90},
 {id:"bre",nom:"Bretagne",capitale:"Rennes",cx:42,cy:118},
 {id:"pdl",nom:"Pays de la Loire",capitale:"Nantes",cx:86,cy:140},
 {id:"cvl",nom:"Centre-Val de Loire",capitale:"Orléans",cx:150,cy:145},
 {id:"bfc",nom:"Bourgogne-Franche-Comté",capitale:"Dijon",cx:232,cy:152},
 {id:"naq",nom:"Nouvelle-Aquitaine",capitale:"Bordeaux",cx:92,cy:225},
 {id:"ara",nom:"Auvergne-Rhône-Alpes",capitale:"Lyon",cx:215,cy:215},
 {id:"occ",nom:"Occitanie",capitale:"Toulouse",cx:150,cy:280},
 {id:"pac",nom:"Provence-Alpes-Côte d'Azur",capitale:"Marseille",cx:255,cy:275},
 {id:"cor",nom:"Corse",capitale:"Ajaccio",cx:305,cy:315}
];
/* d : a completer region par region, polygones jointifs formant l'hexagone.
   Chaque entree de REGIONS recoit son trace ici. */
const FOND_ADMIN={viewBox:"0 0 320 340",zones:REGIONS.map(r=>({...r,type:"aire",d:TRACES_ADMIN[r.id]}))};
```

Écrire `TRACES_ADMIN` juste au-dessus : un objet `{id: "M ... Z"}` portant les treize tracés.

**Méthode, dans cet ordre.** Ouvrir l'atelier de tracé décrit dans les contraintes globales, viewBox `0 0 320 340`, pas de grille 20.

1. Poser d'abord le **contour de l'hexagone** comme un seul polygone jetable, en passant par les points de côte : Dunkerque (205, 22), frontière belge (232, 48), Luxembourg (262, 60), Strasbourg (300, 92), Bâle (296, 130), Genève (272, 160), Alpes du nord (282, 198), Alpes du sud (292, 250), Nice (272, 292), delta du Rhône (215, 305), Perpignan (175, 322), Pyrénées ouest (128, 302), Hendaye (95, 296), côte landaise (60, 246), Gironde (48, 205), Charente (42, 170), Vendée (52, 152), Loire-Atlantique (30, 140), pointe du Raz (10, 128), Brest nord (24, 100), Saint-Malo (62, 92), Cotentin ouest (92, 62), Cotentin nord (110, 52), baie de Seine (130, 62), Somme (150, 40), Calais (178, 26), retour à Dunkerque.
2. **Découper** ce contour de proche en proche, région par région, en partant du nord. Chaque région est un polygone fermé de cinq à huit points dont l'ancre `cx`/`cy` du tableau ci-dessus tombe à l'intérieur. Les régions voisines **partagent leurs sommets** : recopier les coordonnées d'un sommet déjà posé plutôt que d'en saisir un approchant, sinon des liserés apparaissent entre les régions.
3. La **Corse** est le seul polygone détaché : un ovale allongé du nord au sud, autour de (305, 315), entièrement à l'écart du contour.

**Exemple complet, à la bonne échelle**, pour les Hauts-de-France, qui s'appuient sur quatre points de côte et trois sommets intérieurs partagés avec la Normandie, l'Île-de-France et le Grand Est :

```js
const TRACES_ADMIN={
  hdf:"M178 26 L205 22 L232 48 L212 74 L168 66 L150 40 Z",
  /* ... les douze autres ... */
  cor:"M298 296 L312 302 L314 326 L303 336 L296 322 Z"
};
```

**Critères d'acceptation**, à vérifier dans l'atelier avant de recopier dans le carnet :

- les treize polygones dessinent ensemble une France reconnaissable, sans trou visible ni chevauchement ;
- chaque ancre rouge tombe bien dans sa région ;
- l'Île-de-France est petite mais visible, entourée par le Centre-Val de Loire, la Normandie, les Hauts-de-France et le Grand Est ;
- la Corse est détachée, au sud-est.

- [ ] **Step 5 : La manche Les régions**

```js
/* ============ 1. les regions ============ */
const G={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const gp=$("#regions");
function regIntro(){
  gp.innerHTML=`<div class="intro">
    <h2>Place les régions</h2>
    <p>Les treize régions de France métropolitaine, dans le désordre. On te donne un nom, tu cliques la région sur la carte. La carte est schématique : ce sont les positions qui comptent.</p>
    <button class="btn" id="ggo">Commencer la manche</button>
  </div>`;
  $("#ggo").onclick=regStart;
}
function regStart(){
  G.list=shuffle(REGIONS);G.i=0;G.score=0;G.errs=[];G.streak=0;G.t0=Date.now();regStep();
}
function regStep(){
  if(G.i>=G.list.length)return regEnd();
  const q=G.list[G.i];
  gp.innerHTML=`
    <div class="status"><span>Région <b>${G.i+1}</b>/${G.list.length}</span><span class="grow"></span><span>Points <b id="gsc">${G.score}</b></span></div>
    <div id="gcard">
      <div class="react" id="gv"></div>
      <p class="annot" id="gan">Clique sur cette région</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig" id="gfig">${mapSVG(FOND_ADMIN)}</div>
      <p class="why" id="gwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="gnext">Suivante</button></div>`;
  mapBrancher($("#gfig"),id=>{
    const ok=id===q.id;
    if(ok)G.score+=10;
    else G.errs.push({rep:q.nom,w:`Capitale : ${q.capitale}. Tu avais cliqué ${REGIONS.find(r=>r.id===id).nom}.`});
    $("#gfig").innerHTML=mapSVG(FOND_ADMIN,{bonne:q.id,choisie:id,etiquettes:true});
    showVerdict(ok,"#gv",G);
    $("#gcard").classList.add("revealed");
    $("#gan").textContent=`${q.nom}, capitale ${q.capitale}`;
    $("#gwhy").innerHTML=ok?`Capitale de région : <b>${esc(q.capitale)}</b>.`
      :`<em>Non, ça c'était ${esc(REGIONS.find(r=>r.id===id).nom)}. </em>${esc(q.nom)}, capitale <b>${esc(q.capitale)}</b>.`;
    $("#gsc").textContent=G.score;
    const n=$("#gnext");n.classList.remove("hidden");
    n.textContent=G.i===G.list.length-1?"Voir le bilan":"Suivante";
    n.onclick=()=>{G.i++;regStep();};
    n.focus({preventScroll:true});
  });
}
function regEnd(){
  G.secs=Math.round((Date.now()-G.t0)/1000);
  logResult("regions",G.score,G.list.length-G.errs.length,G.list.length,G.secs);
  gp.innerHTML=bilanHTML(G,"Les treize régions sont en place. Passe aux capitales.");
  $("#again",gp).onclick=regStart;
}
```

- [ ] **Step 6 : La manche Les capitales**

```js
/* ============ 2. les capitales ============ */
const K={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const kp=$("#capitales");
function capIntro(){
  kp.innerHTML=`<div class="intro">
    <h2>Chaque région, sa capitale</h2>
    <p>Treize questions. La région est surlignée sur la carte, à toi de choisir sa capitale parmi quatre villes. Les mauvaises réponses sont les capitales des régions voisines.</p>
    <button class="btn" id="kgo">Commencer la manche</button>
  </div>`;
  $("#kgo").onclick=capStart;
}
function capStart(){
  K.list=shuffle(REGIONS);K.i=0;K.score=0;K.errs=[];K.streak=0;K.t0=Date.now();capStep();
}
/* les trois leurres sont les capitales des regions les plus proches */
function capLeurres(r){
  return REGIONS.filter(x=>x!==r)
    .map(x=>({x,d:Math.hypot(x.cx-r.cx,x.cy-r.cy)}))
    .sort((a,b)=>a.d-b.d).slice(0,5)
    .map(o=>o.x);
}
function capStep(){
  if(K.i>=K.list.length)return capEnd();
  const q=K.list[K.i];
  const props=shuffle([q,...pick(capLeurres(q),3)]);
  kp.innerHTML=`
    <div class="status"><span>Région <b>${K.i+1}</b>/${K.list.length}</span><span class="grow"></span><span>Points <b id="ksc">${K.score}</b></span></div>
    <div id="kcard">
      <div class="react" id="kv"></div>
      <p class="annot">Quelle est la capitale de cette région ?</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig">${mapSVG(FOND_ADMIN,{surligne:q.id})}</div>
      <div class="choix">${props.map((p,i)=>`<button class="opt" data-i="${i}">${esc(p.capitale)}</button>`).join("")}</div>
      <p class="why" id="kwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="knext">Suivante</button></div>`;
  kp.querySelectorAll(".opt").forEach((b,i)=>{
    b.onclick=()=>{
      const ok=props[i]===q;
      if(ok)K.score+=10;else K.errs.push({rep:q.nom,w:`Sa capitale est ${q.capitale}.`});
      kp.querySelectorAll(".opt").forEach((x,j)=>{
        x.disabled=true;
        if(props[j]===q)x.classList.add("good");
        else if(j===i)x.classList.add("bad");
        else x.classList.add("dim");
      });
      showVerdict(ok,"#kv",K);
      $("#kcard").classList.add("revealed");
      $("#kwhy").innerHTML=`<b>${esc(q.nom)}</b>, capitale <b>${esc(q.capitale)}</b>.`;
      $("#ksc").textContent=K.score;
      const n=$("#knext");n.classList.remove("hidden");
      n.textContent=K.i===K.list.length-1?"Voir le bilan":"Suivante";
      n.onclick=()=>{K.i++;capStep();};
      n.focus({preventScroll:true});
    };
  });
}
function capEnd(){
  K.secs=Math.round((Date.now()-K.t0)/1000);
  logResult("capitales",K.score,K.list.length-K.errs.length,K.list.length,K.secs);
  kp.innerHTML=bilanHTML(K,"Treize régions, treize capitales. Passe aux fleuves.");
  $("#again",kp).onclick=capStart;
}
```

- [ ] **Step 7 : Neutraliser provisoirement les deux derniers onglets**

```js
function relIntro(){$("#relief").innerHTML=`<div class="intro"><h2>Bientôt</h2><p>Cette manche arrive à la tâche suivante.</p></div>`;}
function omIntro(){$("#outremer").innerHTML=`<div class="intro"><h2>Bientôt</h2><p>Cette manche arrive à la tâche suivante.</p></div>`;}
```

- [ ] **Step 8 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs geo-france.html
```

Attendu : une ligne `KO ... 2 appel(s) à logResult pour 4 onglets`, rien d'autre.

- [ ] **Step 9 : Vérifier dans le navigateur**

```bash
open geo-france.html
```

C'est le contrôle le plus important du plan, parce que la carte est dessinée à la main :
- la France est reconnaissable, les treize régions sont jointives, sans trou ni chevauchement ;
- chaque région est atteignable au doigt, y compris l'Île-de-France et la Corse ;
- après réponse, les étiquettes s'affichent et restent lisibles ;
- dans la manche Capitales, la région surlignée est bien celle du nom affiché ;
- à 360 px de large, la carte tient sans débordement horizontal.

- [ ] **Step 10 : Commit**

```bash
git add geo-france.html
git commit -m "Ajoute le carnet de la carte de France : régions et capitales

Un moteur de cartes SVG cliquables sur le modèle de figSVG, un fond
administratif schématique à treize régions, et les deux premières
manches."
```

---

### Task 6 : `geo-france.html`, les manches Fleuves et reliefs, Mers et DROM

**Files:**
- Modify: `geo-france.html` (remplacer `relIntro` et `omIntro`)

**Interfaces:**
- Consomme : `mapSVG`, `mapBrancher`, `FOND_ADMIN`, `HALO`, et le CSS des cartes, tous écrits à la tâche 5.
- Produit : rien pour les tâches suivantes.

- [ ] **Step 1 : Écrire le fond physique**

Même repère que `FOND_ADMIN` (`viewBox "0 0 320 340"`), pour que les deux cartes soient superposables mentalement. Ancres à respecter :

| id | Élément | type | cx | cy |
|---|---|---|---|---|
| `seine` | la Seine | trait | 150 | 82 |
| `loire` | la Loire | trait | 118 | 148 |
| `garonne` | la Garonne | trait | 96 | 258 |
| `rhone` | le Rhône | trait | 224 | 240 |
| `armoricain` | le Massif Armoricain | aire | 60 | 120 |
| `parisien` | le Bassin parisien | aire | 150 | 105 |
| `aquitain` | le Bassin aquitain | aire | 90 | 240 |
| `central` | le Massif Central | aire | 175 | 225 |
| `vosges` | les Vosges | aire | 268 | 110 |
| `jura` | le Jura | aire | 262 | 168 |
| `alpes` | les Alpes | aire | 255 | 235 |
| `pyrenees` | les Pyrénées | aire | 135 | 310 |

Les quatre fleuves sont des `<path>` ouverts qui suivent ces parcours :

- **Seine** : source en Bourgogne (215, 140) puis (185, 112), Paris (168, 92), Rouen (118, 68), embouchure dans la Manche (92, 58).
- **Loire** : source au Massif Central (190, 215) puis (168, 165), Orléans (150, 130), Tours (120, 145), Nantes (72, 152), embouchure atlantique (40, 158).
- **Garonne** : Pyrénées (140, 300), Toulouse (128, 285), (105, 255), Bordeaux (78, 232), estuaire de la Gironde (52, 220).
- **Rhône** : lac Léman (272, 168), Lyon (215, 200), (218, 240), Avignon (218, 270), delta méditerranéen (215, 305).

```js
const FLEUVES=[
 {id:"seine",nom:"la Seine",type:"trait",cx:150,cy:82,d:"M215 140 L185 112 L168 92 L118 68 L92 58"},
 {id:"loire",nom:"la Loire",type:"trait",cx:118,cy:148,d:"M190 215 L168 165 L150 130 L120 145 L72 152 L40 158"},
 {id:"garonne",nom:"la Garonne",type:"trait",cx:96,cy:258,d:"M140 300 L128 285 L105 255 L78 232 L52 220"},
 {id:"rhone",nom:"le Rhône",type:"trait",cx:224,cy:240,d:"M272 168 L215 200 L218 240 L218 270 L215 305"}
];
const RELIEFS=[
 {id:"armoricain",nom:"le Massif Armoricain",cx:60,cy:120},
 {id:"parisien",nom:"le Bassin parisien",cx:150,cy:105},
 {id:"aquitain",nom:"le Bassin aquitain",cx:90,cy:240},
 {id:"central",nom:"le Massif Central",cx:175,cy:225},
 {id:"vosges",nom:"les Vosges",cx:268,cy:110},
 {id:"jura",nom:"le Jura",cx:262,cy:168},
 {id:"alpes",nom:"les Alpes",cx:255,cy:235},
 {id:"pyrenees",nom:"les Pyrénées",cx:135,cy:310}
];
/* TRACES_RELIEF : un ovale ou une bande allongee par relief, centre sur cx,cy.
   Les massifs (Vosges, Jura, Alpes, Pyrenees) sont des bandes etroites orientees
   comme sur la carte du PDF ; les bassins sont de larges aplats. */
const FOND_PHYSIQUE={viewBox:"0 0 320 340",zones:[
  ...RELIEFS.map(r=>({...r,type:"aire",d:TRACES_RELIEF[r.id]})),
  ...FLEUVES
]};
```

Écrire `TRACES_RELIEF` au-dessus, dans l'atelier, même viewBox que le fond administratif.

**Méthode.** Deux familles de formes, et aucune contrainte de jointivité cette fois : les reliefs sont des taches posées sur la carte, elles peuvent se toucher ou laisser du vide.

- Les **bassins** (`parisien`, `aquitain`) et les **massifs anciens** (`armoricain`, `central`) sont de larges aplats arrondis, cinq à sept points, débordant largement autour de leur ancre.
- Les **chaînes** (`vosges`, `jura`, `alpes`, `pyrenees`) sont des bandes étroites, longues d'environ 70 px et larges de 22 px, orientées comme sur la carte du PDF : Vosges et Jura verticales, Alpes en diagonale du nord-est au sud-ouest, Pyrénées horizontales.

**Exemple complet, à la bonne échelle**, une chaîne étroite et un large bassin :

```js
const TRACES_RELIEF={
  pyrenees:"M104 306 L168 314 L172 328 L106 320 Z",
  aquitain:"M62 208 L118 214 L126 258 L88 276 L58 250 Z",
  /* ... les six autres ... */
};
```

Les reliefs sont listés **avant** les fleuves dans le tableau `zones`, pour que les fleuves se dessinent par-dessus les aplats.

**Critères d'acceptation :** chaque bande de chaîne est assez épaisse pour être visible, chaque ancre rouge tombe dans sa forme, et les quatre fleuves du step suivant restent lisibles par-dessus. Ajouter au CSS le remplissage propre aux reliefs :

```css
.fig .z.aire path{fill:var(--terre)}
#relief .fig .z.aire path{fill:var(--relief);opacity:.75}
#relief .fig .z.aire.good path{opacity:1}
```

- [ ] **Step 2 : La manche Fleuves et reliefs**

```js
/* ============ 3. fleuves et reliefs ============ */
const L={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const lp=$("#relief");
const RELIEF_TOUT=[...FLEUVES,...RELIEFS.map(r=>({...r,type:"aire"}))];
function relIntro(){
  lp.innerHTML=`<div class="intro">
    <h2>Fleuves et reliefs</h2>
    <p>Les quatre grands fleuves et les huit ensembles de relief de la carte physique. On te donne un nom, tu cliques dessus. Les fleuves sont les traits bleus.</p>
    <button class="btn" id="lgo">Commencer la manche</button>
  </div>`;
  $("#lgo").onclick=relStart;
}
function relStart(){
  L.list=shuffle(RELIEF_TOUT);L.i=0;L.score=0;L.errs=[];L.streak=0;L.t0=Date.now();relStep();
}
function relStep(){
  if(L.i>=L.list.length)return relEnd();
  const q=L.list[L.i];
  lp.innerHTML=`
    <div class="status"><span>Repère <b>${L.i+1}</b>/${L.list.length}</span><span class="grow"></span><span>Points <b id="lsc">${L.score}</b></span></div>
    <div id="lcard">
      <div class="react" id="lv"></div>
      <p class="annot" id="lan">Clique sur ce repère</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig" id="lfig">${mapSVG(FOND_PHYSIQUE)}</div>
      <p class="why" id="lwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="lnext">Suivant</button></div>`;
  mapBrancher($("#lfig"),id=>{
    const ok=id===q.id;
    const clique=RELIEF_TOUT.find(z=>z.id===id);
    if(ok)L.score+=10;else L.errs.push({rep:q.nom,w:`Tu avais cliqué ${clique.nom}.`});
    $("#lfig").innerHTML=mapSVG(FOND_PHYSIQUE,{bonne:q.id,choisie:id,etiquettes:true});
    showVerdict(ok,"#lv",L);
    $("#lcard").classList.add("revealed");
    $("#lan").textContent=q.nom.charAt(0).toUpperCase()+q.nom.slice(1);
    $("#lwhy").innerHTML=ok?"":`<em>Non, ça c'était ${esc(clique.nom)}.</em>`;
    $("#lsc").textContent=L.score;
    const n=$("#lnext");n.classList.remove("hidden");
    n.textContent=L.i===L.list.length-1?"Voir le bilan":"Suivant";
    n.onclick=()=>{L.i++;relStep();};
    n.focus({preventScroll:true});
  });
}
function relEnd(){
  L.secs=Math.round((Date.now()-L.t0)/1000);
  logResult("relief",L.score,L.list.length-L.errs.length,L.list.length,L.secs);
  lp.innerHTML=bilanHTML(L,"Fleuves et massifs en place. Reste les mers et l'outre-mer.");
  $("#again",lp).onclick=relStart;
}
```

- [ ] **Step 3 : Écrire le fond du monde et les données mers et DROM**

La manche enchaîne deux cartes : d'abord les quatre façades maritimes sur l'hexagone, puis les cinq DROM sur un planisphère très simplifié.

```js
const MERS=[
 {id:"nord",nom:"la mer du Nord",cx:215,cy:12,
  w:"Elle borde le nord des Hauts-de-France, au-delà du détroit du Pas-de-Calais."},
 {id:"manche",nom:"la Manche",cx:110,cy:28,
  w:"Entre la Normandie, la Bretagne et l'Angleterre. C'est une mer, pas un océan."},
 {id:"atlantique",nom:"l'océan Atlantique",cx:22,cy:205,
  w:"Il borde la Bretagne, les Pays de la Loire et la Nouvelle-Aquitaine."},
 {id:"mediterranee",nom:"la mer Méditerranée",cx:210,cy:332,
  w:"Elle borde l'Occitanie, la Provence-Alpes-Côte d'Azur et la Corse."}
];
/* les quatre facades sont des aplats d'eau autour de l'hexagone, ajoutes au fond
   administratif : les regions restent visibles dessous comme reperes */
const FOND_MERS={viewBox:"0 0 320 340",zones:[
  ...REGIONS.map(r=>({...r,type:"aire",d:TRACES_ADMIN[r.id],inerte:true})),
  ...MERS.map(m=>({...m,type:"aire",d:TRACES_MERS[m.id]}))
]};

const DROM=[
 {id:"gua",nom:"la Guadeloupe",chef:"Basse-Terre",cx:88,cy:92,
  w:"Aux Antilles, dans la mer des Caraïbes. Chef-lieu : Basse-Terre."},
 {id:"mar",nom:"la Martinique",chef:"Fort-de-France",cx:92,cy:104,
  w:"Aux Antilles également, juste au sud de la Guadeloupe. Chef-lieu : Fort-de-France."},
 {id:"guy",nom:"la Guyane",chef:"Cayenne",cx:106,cy:116,
  w:"En Amérique du Sud, entre le Brésil et le Suriname. C'est le plus vaste des DROM."},
 {id:"may",nom:"Mayotte",chef:"Mamoudzou",cx:218,cy:118,
  w:"Dans l'océan Indien, entre l'Afrique et Madagascar. Département depuis 2011."},
 {id:"reu",nom:"La Réunion",chef:"Saint-Denis",cx:230,cy:126,
  w:"Dans l'océan Indien, à l'est de Madagascar. Chef-lieu : Saint-Denis."}
];
/* planisphere tres simplifie : des masses continentales grises et les cinq DROM
   en points cliquables. La France metropolitaine y figure comme repere inerte. */
const FOND_MONDE={viewBox:"0 0 360 180",zones:[
  ...CONTINENTS,
  ...DROM.map(d=>({...d,type:"point",d:""}))
]};
```

Écrire au-dessus `TRACES_MERS` puis `CONTINENTS`, toujours dans l'atelier.

**`TRACES_MERS`**, viewBox `0 0 320 340` : quatre aplats d'eau qui remplissent les marges autour de l'hexagone, sans le recouvrir. Chacun doit être assez large pour rester cliquable : au moins 44 px dans sa plus petite dimension.

- `nord` : bande en haut à droite, au-dessus des Hauts-de-France, de (185, 0) à (320, 45) environ.
- `manche` : bande en haut à gauche, au-dessus de la Normandie et du Cotentin, de (0, 0) à (185, 55) environ.
- `atlantique` : bande verticale le long du flanc ouest, de (0, 55) à (55, 300) environ, en épousant la côte bretonne et landaise.
- `mediterranee` : bande en bas, sous l'Occitanie et Provence-Alpes-Côte d'Azur, de (110, 300) à (320, 340) environ, en laissant la Corse dedans.

**Exemple complet, à la bonne échelle** :

```js
const TRACES_MERS={
  manche:"M0 0 L185 0 L178 26 L130 62 L110 52 L92 62 L62 92 L24 100 L0 66 Z",
  /* ... les trois autres ... */
};
```

**`CONTINENTS`**, viewBox `0 0 360 180` : un planisphère très grossier, uniquement là pour situer les DROM. Quatre à six masses grises, `type:"aire"` et `inerte:true`, sans nom affiché. Repères de position : Amérique du Nord vers (75, 55), Amérique du Sud vers (105, 125), Europe vers (176, 55), Afrique vers (180, 105), Asie vers (255, 60), Océanie vers (300, 130). La France métropolitaine est un petit rectangle repère vers (176, 62), lui aussi inerte.

```js
const CONTINENTS=[
 {id:"amsud",nom:"Amérique du Sud",type:"aire",inerte:true,cx:105,cy:125,
  d:"M88 100 L120 96 L126 128 L106 158 L92 140 Z"},
 /* ... les autres masses, puis le repère France ... */
];
```

**Critères d'acceptation :** sur le planisphère, les cinq ancres de DROM tombent au bon endroit (Guadeloupe et Martinique dans les Caraïbes à l'ouest, Guyane accrochée à l'Amérique du Sud, Mayotte et La Réunion dans l'océan Indien), et les deux ancres antillaises restent distinctes l'une de l'autre malgré leur proximité.

Les zones marquées `inerte:true` ne doivent pas être cliquables. Compléter `mapSVG` en conséquence, juste après le calcul de `cls` :

```js
    if(z.inerte)return `<g class="z inerte ${z.type}"><path d="${z.d}"></path></g>`;
```

et ajouter au CSS :

```css
.fig .z.inerte path{fill:var(--terre);stroke:var(--paper-2);stroke-width:1;cursor:default;pointer-events:none;opacity:.6}
```

- [ ] **Step 4 : La manche Mers et DROM**

```js
/* ============ 4. mers et DROM ============ */
const O={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const op=$("#outremer");
function omIntro(){
  op.innerHTML=`<div class="intro">
    <h2>Les mers, puis l'outre-mer</h2>
    <p>D'abord les quatre mers et océan qui bordent la France, sur la carte de l'hexagone. Ensuite les cinq départements et régions d'outre-mer, à retrouver sur le planisphère.</p>
    <button class="btn" id="ogo">Commencer la manche</button>
  </div>`;
  $("#ogo").onclick=omStart;
}
function omStart(){
  O.list=[...shuffle(MERS).map(m=>({...m,fond:"mers"})),...shuffle(DROM).map(d=>({...d,fond:"monde"}))];
  O.i=0;O.score=0;O.errs=[];O.streak=0;O.t0=Date.now();omStep();
}
function omStep(){
  if(O.i>=O.list.length)return omEnd();
  const q=O.list[O.i];
  const fond=q.fond==="mers"?FOND_MERS:FOND_MONDE;
  const cible=q.fond==="mers"?MERS:DROM;
  op.innerHTML=`
    <div class="status"><span>${q.fond==="mers"?"Mer":"DROM"} <b>${O.i+1}</b>/${O.list.length}</span><span class="grow"></span><span>Points <b id="osc">${O.score}</b></span></div>
    <div id="ocard">
      <div class="react" id="ov"></div>
      <p class="annot" id="oan">${q.fond==="mers"?"Clique sur cette mer":"Clique sur ce territoire"}</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig" id="ofig">${mapSVG(fond)}</div>
      <p class="why" id="owhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="onext">Suivant</button></div>`;
  mapBrancher($("#ofig"),id=>{
    const ok=id===q.id;
    const clique=cible.find(z=>z.id===id);
    if(ok)O.score+=10;else O.errs.push({rep:q.nom,w:q.w});
    $("#ofig").innerHTML=mapSVG(fond,{bonne:q.id,choisie:id,etiquettes:true});
    showVerdict(ok,"#ov",O);
    $("#ocard").classList.add("revealed");
    $("#oan").textContent=q.nom.charAt(0).toUpperCase()+q.nom.slice(1);
    $("#owhy").innerHTML=(ok?"":`<em>Non, ça c'était ${esc(clique?clique.nom:"ailleurs")}. </em>`)+q.w;
    $("#osc").textContent=O.score;
    const n=$("#onext");n.classList.remove("hidden");
    n.textContent=O.i===O.list.length-1?"Voir le bilan":"Suivant";
    n.onclick=()=>{O.i++;omStep();};
    n.focus({preventScroll:true});
  });
}
function omEnd(){
  O.secs=Math.round((Date.now()-O.t0)/1000);
  logResult("outremer",O.score,O.list.length-O.errs.length,O.list.length,O.secs);
  op.innerHTML=bilanHTML(O,"Tu connais tes façades maritimes et tes cinq DROM. Passe à l'Europe.");
  $("#again",op).onclick=omStart;
}
```

- [ ] **Step 5 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs geo-france.html
```

Attendu : `Tout est bon.` Quatre appels à `logResult` : `regions`, `capitales`, `relief`, `outremer`.

- [ ] **Step 6 : Vérifier dans le navigateur**

```bash
open geo-france.html
```

- **Fleuves et reliefs** : les quatre fleuves sont cliquables sur toute leur longueur grâce au halo, pas seulement au milieu ; un fleuve passe visuellement par-dessus les aplats de relief ; le Rhône descend bien vers la Méditerranée et la Loire va bien vers l'ouest.
- **Mers et DROM** : les régions restent visibles sous les aplats d'eau mais ne réagissent pas au clic ; les cinq DROM sont distincts sur le planisphère, en particulier Guadeloupe et Martinique qui sont proches.
- Les douze repères de la manche 3 et les neuf de la manche 4 passent tous sans écran vide.

- [ ] **Step 7 : Commit**

```bash
git add geo-france.html
git commit -m "Complète le carnet de France : fleuves, reliefs, mers et DROM

Un fond physique et un planisphère simplifié s'ajoutent au fond
administratif. Les zones inertes servent de repère sans être cliquables."
```

---

### Task 7 : `geo-europe.html`

**Files:**
- Create: `geo-europe.html`
- Read for reference: `geo-france.html` (tâches 5 et 6 : le moteur `mapSVG`, `mapBrancher`, le CSS des cartes)

**Interfaces:**
- Consomme : la structure complète de `geo-france.html`, recopiée, dont `mapSVG`, `mapBrancher`, `HALO` et tout le CSS des cartes.
- Produit : rien pour les tâches suivantes.

- [ ] **Step 1 : Créer le fichier à partir du jumeau**

Copier `geo-france.html` vers `geo-europe.html`, puis :

1. `<title>` : `L'Europe et l'Union`.
2. Supprimer `REGIONS`, `TRACES_ADMIN`, `FOND_ADMIN`, `FLEUVES`, `RELIEFS`, `TRACES_RELIEF`, `FOND_PHYSIQUE`, `MERS`, `TRACES_MERS`, `FOND_MERS`, `DROM`, `CONTINENTS`, `FOND_MONDE` et les quatre manches. Garder les outils, la gamification, `mapSVG`, `mapBrancher`, `HALO`, tout le CSS.
3. L'en-tête :

```html
    <div class="topbar"><a class="home" href="geographie.html">🏠 Géographie</a><p class="eyebrow">Géographie, 3<sup>e</sup></p></div>
    <h1>L'Europe <em>et son Union</em></h1>
    <p class="sub">Quatre entraînements : placer les pays de l'Union, les reconnaître, savoir qui en est membre, retrouver les voisins de la France.</p>
    <nav role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-panel="placer">Placer</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="nommer">Reconnaître</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="membre">Dans l'UE ?</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="voisins">Les voisins</button>
    </nav>
```

4. Panneaux `placer`, `nommer`, `membre`, `voisins` ; le bloc `/* onglets */` appelle `plaIntro`, `nomIntro`, `memIntro`, `voiIntro` ; `logResult` reçoit `page:"geo-europe"` ; l'amorçage final est `plaIntro();`.

- [ ] **Step 2 : Écrire le fond d'Europe**

`viewBox "0 0 360 320"`. Repère : Islande en haut à gauche, Finlande en haut à droite, Portugal en bas à gauche, Chypre en bas à droite. Ancres à respecter, elles fixent les positions relatives :

```js
/* ue : true pour les 27 membres, false pour les autres pays affiches sur la carte.
   Trace schematique : formes reconnaissables, positions relatives justes, pas
   de frontieres exactes. */
const PAYS=[
 {id:"pt",nom:"Portugal",ue:true,cx:28,cy:232},
 {id:"es",nom:"Espagne",ue:true,cx:58,cy:235},
 {id:"fr",nom:"France",ue:true,cx:98,cy:185},
 {id:"ie",nom:"Irlande",ue:true,cx:48,cy:92},
 {id:"be",nom:"Belgique",ue:true,cx:110,cy:140},
 {id:"nl",nom:"Pays-Bas",ue:true,cx:114,cy:124},
 {id:"lu",nom:"Luxembourg",ue:true,cx:122,cy:152},
 {id:"de",nom:"Allemagne",ue:true,cx:145,cy:140},
 {id:"dk",nom:"Danemark",ue:true,cx:144,cy:100},
 {id:"se",nom:"Suède",ue:true,cx:172,cy:66},
 {id:"fi",nom:"Finlande",ue:true,cx:205,cy:52},
 {id:"ee",nom:"Estonie",ue:true,cx:212,cy:88},
 {id:"lv",nom:"Lettonie",ue:true,cx:212,cy:104},
 {id:"lt",nom:"Lituanie",ue:true,cx:208,cy:118},
 {id:"pl",nom:"Pologne",ue:true,cx:185,cy:132},
 {id:"cz",nom:"Tchéquie",ue:true,cx:168,cy:156},
 {id:"sk",nom:"Slovaquie",ue:true,cx:192,cy:162},
 {id:"at",nom:"Autriche",ue:true,cx:162,cy:175},
 {id:"hu",nom:"Hongrie",ue:true,cx:192,cy:180},
 {id:"si",nom:"Slovénie",ue:true,cx:166,cy:190},
 {id:"hr",nom:"Croatie",ue:true,cx:176,cy:200},
 {id:"ro",nom:"Roumanie",ue:true,cx:216,cy:186},
 {id:"bg",nom:"Bulgarie",ue:true,cx:214,cy:212},
 {id:"gr",nom:"Grèce",ue:true,cx:203,cy:258},
 {id:"it",nom:"Italie",ue:true,cx:155,cy:225},
 {id:"mt",nom:"Malte",ue:true,cx:163,cy:285},
 {id:"cy",nom:"Chypre",ue:true,cx:258,cy:275},
 {id:"gb",nom:"Royaume-Uni",ue:false,cx:76,cy:88,w:"Membre de 1973 à 2020, il est sorti de l'Union après le Brexit."},
 {id:"ch",nom:"Suisse",ue:false,cx:135,cy:178,w:"Au cœur de l'Europe, mais elle n'a jamais adhéré à l'Union."},
 {id:"no",nom:"Norvège",ue:false,cx:148,cy:52,w:"Elle a refusé l'adhésion par référendum, à deux reprises."},
 {id:"is",nom:"Islande",ue:false,cx:30,cy:32,w:"Île de l'Atlantique nord, elle n'est pas membre de l'Union."},
 {id:"rs",nom:"Serbie",ue:false,cx:196,cy:205,w:"Candidate à l'adhésion, pas encore membre."},
 {id:"ba",nom:"Bosnie-Herzégovine",ue:false,cx:182,cy:212,w:"Candidate à l'adhésion, pas encore membre."},
 {id:"al",nom:"Albanie",ue:false,cx:192,cy:235,w:"Candidate à l'adhésion, pas encore membre."},
 {id:"mk",nom:"Macédoine du Nord",ue:false,cx:200,cy:228,w:"Candidate à l'adhésion, pas encore membre."},
 {id:"me",nom:"Monténégro",ue:false,cx:188,cy:220,w:"Candidat à l'adhésion, pas encore membre."},
 {id:"ua",nom:"Ukraine",ue:false,cx:240,cy:158,w:"Candidate depuis 2022, pas encore membre."},
 {id:"md",nom:"Moldavie",ue:false,cx:228,cy:172,w:"Candidate depuis 2022, pas encore membre."},
 {id:"by",nom:"Biélorussie",ue:false,cx:218,cy:132,w:"Pas membre et pas candidate."},
 {id:"tr",nom:"Turquie",ue:false,cx:250,cy:245,w:"Candidate de longue date, les négociations sont à l'arrêt."}
];
const UE=PAYS.filter(p=>p.ue);
const FOND_EUROPE={viewBox:"0 0 360 320",zones:PAYS.map(p=>({...p,type:"aire",d:TRACES_EUROPE[p.id]}))};
```

Écrire `TRACES_EUROPE` au-dessus, dans l'atelier, viewBox `0 0 360 320`, pas de grille 20 : un polygone par pays, centré sur son ancre.

**Méthode.** Poser d'abord les cinq formes que l'œil reconnaît immédiatement, elles servent de calage à toutes les autres :

1. la **péninsule ibérique**, un bloc large en bas à gauche, découpé en Portugal (bande ouest étroite) et Espagne ;
2. la **botte italienne**, une diagonale du nord-ouest au sud-est de (140, 200) à (175, 258), avec la Sicile détachée vers (160, 268) ;
3. la **Scandinavie**, deux bandes verticales accolées, Norvège à l'ouest, Suède à l'est, surmontant le Danemark ;
4. les **îles britanniques**, deux formes détachées du continent : Irlande à l'ouest, Royaume-Uni allongé du sud-ouest au nord-est ;
5. la **Grèce**, avec sa côte découpée, en bas au centre-droit.

Remplir ensuite le centre du continent de proche en proche, les pays voisins partageant leurs sommets comme pour les régions de France. Malte et Chypre sont deux petites îles détachées ; le Luxembourg est le plus petit polygone continental, coincé entre Belgique, France et Allemagne. Ces trois-là ne sont jouables que grâce à leur halo de 22 px : vérifier au doigt.

**Exemple complet, à la bonne échelle**, une île minuscule et un pays continental :

```js
const TRACES_EUROPE={
  mt:"M160 282 L166 281 L167 288 L161 289 Z",
  pt:"M18 212 L38 214 L38 252 L22 254 Z",
  /* ... les trente-neuf autres ... */
};
```

**Critères d'acceptation :** la silhouette générale de l'Europe se reconnaît sans étiquettes ; les îles britanniques, la Sicile, Malte, Chypre et l'Islande sont bien détachées du continent ; chaque ancre rouge tombe dans son pays ; aucun pays n'est réduit à un trait invisible.

Distinguer visuellement membres et non-membres dans le CSS :

```css
#membre .fig .z path{fill:var(--terre)}
.fig .z.horsue path{fill:#E2E0DA}
```

et, dans `mapSVG`, ajouter la classe quand la zone le demande, juste après le calcul de `cls` :

```js
    if(z.ue===false)cls+=" horsue";
```

Attention : cette classe ne doit **pas** être posée dans les manches 1, 2 et 3, sinon la réponse à « Dans l'UE ou pas ? » se lit sur la couleur. Passer donc `opts.montrerUE` et ne l'appliquer que dans la manche 4 :

```js
    if(opts.montrerUE&&z.ue===false)cls+=" horsue";
```

- [ ] **Step 3 : La manche Placer**

```js
/* ============ 1. placer ============ */
const A={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const ap=$("#placer");
function plaIntro(){
  ap.innerHTML=`<div class="intro">
    <h2>Place les pays de l'Union</h2>
    <p>Douze pays tirés parmi les vingt-sept membres. On te donne un nom, tu cliques le pays sur la carte. La carte est schématique : ce sont les positions qui comptent.</p>
    <button class="btn" id="ago">Commencer la manche</button>
  </div>`;
  $("#ago").onclick=plaStart;
}
function plaStart(){
  A.list=pick(UE,12);A.i=0;A.score=0;A.errs=[];A.streak=0;A.t0=Date.now();plaStep();
}
function plaStep(){
  if(A.i>=A.list.length)return plaEnd();
  const q=A.list[A.i];
  ap.innerHTML=`
    <div class="status"><span>Pays <b>${A.i+1}</b>/${A.list.length}</span><span class="grow"></span><span>Points <b id="asc">${A.score}</b></span></div>
    <div id="acard">
      <div class="react" id="av"></div>
      <p class="annot" id="aan">Clique sur ce pays</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig" id="afig">${mapSVG(FOND_EUROPE)}</div>
      <p class="why" id="awhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="anext">Suivant</button></div>`;
  mapBrancher($("#afig"),id=>{
    const ok=id===q.id;
    const clique=PAYS.find(p=>p.id===id);
    if(ok)A.score+=10;else A.errs.push({rep:q.nom,w:`Tu avais cliqué ${clique.nom}.`});
    $("#afig").innerHTML=mapSVG(FOND_EUROPE,{bonne:q.id,choisie:id,etiquettes:true});
    showVerdict(ok,"#av",A);
    $("#acard").classList.add("revealed");
    $("#aan").textContent=q.nom;
    $("#awhy").innerHTML=ok?"":`<em>Non, ça c'était ${esc(clique.nom)}.</em>`;
    $("#asc").textContent=A.score;
    const n=$("#anext");n.classList.remove("hidden");
    n.textContent=A.i===A.list.length-1?"Voir le bilan":"Suivant";
    n.onclick=()=>{A.i++;plaStep();};
    n.focus({preventScroll:true});
  });
}
function plaEnd(){
  A.secs=Math.round((Date.now()-A.t0)/1000);
  logResult("placer",A.score,A.list.length-A.errs.length,A.list.length,A.secs);
  ap.innerHTML=bilanHTML(A,"Tu places les vingt-sept. Passe à « Reconnaître », c'est le sens inverse.");
  $("#again",ap).onclick=plaStart;
}
```

- [ ] **Step 4 : La manche Reconnaître**

Même charpente, sens inverse : le pays est surligné, quatre noms proposés, les leurres étant les pays les plus proches.

```js
/* ============ 2. reconnaitre ============ */
const N={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const np=$("#nommer");
function voisinsDe(p,n){
  return PAYS.filter(x=>x!==p&&x.ue)
    .map(x=>({x,d:Math.hypot(x.cx-p.cx,x.cy-p.cy)}))
    .sort((a,b)=>a.d-b.d).slice(0,n).map(o=>o.x);
}
function nomIntro(){
  np.innerHTML=`<div class="intro">
    <h2>Reconnais le pays</h2>
    <p>Douze pays de l'Union. Cette fois le pays est surligné sur la carte, à toi de dire son nom. Les propositions sont ses voisins : regarde bien la forme et la position.</p>
    <button class="btn" id="ngo">Commencer la manche</button>
  </div>`;
  $("#ngo").onclick=nomStart;
}
function nomStart(){
  N.list=pick(UE,12);N.i=0;N.score=0;N.errs=[];N.streak=0;N.t0=Date.now();nomStep();
}
function nomStep(){
  if(N.i>=N.list.length)return nomEnd();
  const q=N.list[N.i];
  const props=shuffle([q,...pick(voisinsDe(q,5),3)]);
  np.innerHTML=`
    <div class="status"><span>Pays <b>${N.i+1}</b>/${N.list.length}</span><span class="grow"></span><span>Points <b id="nsc">${N.score}</b></span></div>
    <div id="ncard">
      <div class="react" id="nv"></div>
      <p class="annot">Quel est ce pays ?</p>
      <div class="fig">${mapSVG(FOND_EUROPE,{surligne:q.id})}</div>
      <div class="choix">${props.map((p,i)=>`<button class="opt" data-i="${i}">${esc(p.nom)}</button>`).join("")}</div>
      <p class="why" id="nwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="nnext">Suivant</button></div>`;
  np.querySelectorAll(".opt").forEach((b,i)=>{
    b.onclick=()=>{
      const ok=props[i]===q;
      if(ok)N.score+=10;else N.errs.push({rep:q.nom,w:"Revois sa position sur la carte."});
      np.querySelectorAll(".opt").forEach((x,j)=>{
        x.disabled=true;
        if(props[j]===q)x.classList.add("good");
        else if(j===i)x.classList.add("bad");
        else x.classList.add("dim");
      });
      showVerdict(ok,"#nv",N);
      $("#ncard").classList.add("revealed");
      $("#nwhy").innerHTML=`C'était <b>${esc(q.nom)}</b>.`;
      $("#nsc").textContent=N.score;
      const n=$("#nnext");n.classList.remove("hidden");
      n.textContent=N.i===N.list.length-1?"Voir le bilan":"Suivant";
      n.onclick=()=>{N.i++;nomStep();};
      n.focus({preventScroll:true});
    };
  });
}
function nomEnd(){
  N.secs=Math.round((Date.now()-N.t0)/1000);
  logResult("nommer",N.score,N.list.length-N.errs.length,N.list.length,N.secs);
  np.innerHTML=bilanHTML(N,"Tu les reconnais. Va voir qui est vraiment dans l'Union.");
  $("#again",np).onclick=nomStart;
}
```

- [ ] **Step 5 : La manche Dans l'UE ?**

Douze pays, moitié membres, moitié non-membres, réponse Oui ou Non. La carte n'affiche **pas** la distinction de couleur pendant la question.

```js
/* ============ 3. dans l'UE ? ============ */
const U={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const up=$("#membre");
function memIntro(){
  up.innerHTML=`<div class="intro">
    <h2>Dans l'Union, ou pas ?</h2>
    <p>Douze pays, six membres et six non-membres, dans le désordre. Le pays est surligné : réponds oui ou non. Attention au Royaume-Uni, à la Suisse et à la Norvège, qui sont en Europe sans être dans l'Union.</p>
    <button class="btn" id="ugo">Commencer la manche</button>
  </div>`;
  $("#ugo").onclick=memStart;
}
function memStart(){
  U.list=shuffle([...pick(PAYS.filter(p=>p.ue),6),...pick(PAYS.filter(p=>!p.ue),6)]);
  U.i=0;U.score=0;U.errs=[];U.streak=0;U.t0=Date.now();memStep();
}
function memStep(){
  if(U.i>=U.list.length)return memEnd();
  const q=U.list[U.i];
  up.innerHTML=`
    <div class="status"><span>Pays <b>${U.i+1}</b>/${U.list.length}</span><span class="grow"></span><span>Points <b id="usc">${U.score}</b></span></div>
    <div id="ucard">
      <div class="react" id="uv"></div>
      <p class="annot" id="uan">Ce pays est-il membre de l'Union européenne ?</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig">${mapSVG(FOND_EUROPE,{surligne:q.id})}</div>
      <p class="why" id="uwhy"></p>
    </div>
    <div class="judge"><button class="btn" data-v="1">Oui</button><button class="btn no" data-v="0">Non</button></div>
    <div class="row-end"><button class="btn hidden" id="unext">Suivant</button></div>`;
  up.querySelectorAll(".judge .btn").forEach(b=>{
    b.onclick=()=>{
      const ok=(b.dataset.v==="1")===q.ue;
      if(ok)U.score+=10;
      else U.errs.push({rep:q.nom,w:q.ue?"Il est bien membre de l'Union européenne.":q.w});
      up.querySelectorAll(".judge .btn").forEach(x=>{
        x.disabled=true;
        if((x.dataset.v==="1")===q.ue)x.classList.add("good");
        else if(x===b)x.classList.add("bad");
        else x.classList.add("dim");
      });
      showVerdict(ok,"#uv",U);
      $("#ucard").classList.add("revealed");
      $("#uan").textContent=q.ue?`${q.nom} : membre de l'Union`:`${q.nom} : hors de l'Union`;
      $("#uwhy").innerHTML=q.ue?"Il fait partie des vingt-sept.":esc(q.w);
      $("#usc").textContent=U.score;
      const n=$("#unext");n.classList.remove("hidden");
      n.textContent=U.i===U.list.length-1?"Voir le bilan":"Suivant";
      n.onclick=()=>{U.i++;memStep();};
      n.focus({preventScroll:true});
    };
  });
}
function memEnd(){
  U.secs=Math.round((Date.now()-U.t0)/1000);
  logResult("membre",U.score,U.list.length-U.errs.length,U.list.length,U.secs);
  up.innerHTML=bilanHTML(U,"Tu ne confonds plus l'Europe et l'Union. Reste les voisins de la France.");
  $("#again",up).onclick=memStart;
}
```

- [ ] **Step 6 : La manche Les voisins**

Sept pays bordent la France sur la carte du PDF. La manche demande de les cliquer un par un ; la carte montre cette fois les non-membres en gris, puisque la question ne porte plus sur l'appartenance à l'Union.

```js
/* ============ 4. les voisins de la France ============ */
const V={list:[],i:0,score:0,errs:[],t0:0,streak:0,secs:0};
const vp=$("#voisins");
const VOISINS=[
 {id:"be",w:"Elle borde le nord de la France, des Hauts-de-France au Grand Est."},
 {id:"lu",w:"Le plus petit des voisins, coincé entre la Belgique et l'Allemagne."},
 {id:"de",w:"Elle borde le Grand Est, de l'autre côté du Rhin."},
 {id:"ch",w:"Elle borde la Bourgogne-Franche-Comté et l'Auvergne-Rhône-Alpes."},
 {id:"it",w:"Elle borde l'Auvergne-Rhône-Alpes et Provence-Alpes-Côte d'Azur, par les Alpes."},
 {id:"es",w:"Elle borde la Nouvelle-Aquitaine et l'Occitanie, par les Pyrénées."},
 {id:"gb",w:"Il n'a pas de frontière terrestre avec la France : il lui fait face de l'autre côté de la Manche."}
].map(v=>({...PAYS.find(p=>p.id===v.id),w:v.w}));
function voiIntro(){
  vp.innerHTML=`<div class="intro">
    <h2>Les voisins de la France</h2>
    <p>Sept pays entourent la France sur la carte. Clique celui qu'on te nomme. Les pays qui ne sont pas dans l'Union sont en gris : ici, ça n'a pas d'importance.</p>
    <button class="btn" id="vgo">Commencer la manche</button>
  </div>`;
  $("#vgo").onclick=voiStart;
}
function voiStart(){
  V.list=shuffle(VOISINS);V.i=0;V.score=0;V.errs=[];V.streak=0;V.t0=Date.now();voiStep();
}
function voiStep(){
  if(V.i>=V.list.length)return voiEnd();
  const q=V.list[V.i];
  vp.innerHTML=`
    <div class="status"><span>Voisin <b>${V.i+1}</b>/${V.list.length}</span><span class="grow"></span><span>Points <b id="vsc">${V.score}</b></span></div>
    <div id="vcard">
      <div class="react" id="vv"></div>
      <p class="annot" id="van">Clique sur ce voisin de la France</p>
      <p class="hyp enonce">${esc(q.nom)}</p>
      <div class="fig" id="vfig">${mapSVG(FOND_EUROPE,{surligne:"fr",montrerUE:true})}</div>
      <p class="why" id="vwhy"></p>
    </div>
    <div class="row-end"><button class="btn hidden" id="vnext">Suivant</button></div>`;
  mapBrancher($("#vfig"),id=>{
    const ok=id===q.id;
    const clique=PAYS.find(p=>p.id===id);
    if(ok)V.score+=10;else V.errs.push({rep:q.nom,w:q.w});
    $("#vfig").innerHTML=mapSVG(FOND_EUROPE,{bonne:q.id,choisie:id,etiquettes:true,montrerUE:true});
    showVerdict(ok,"#vv",V);
    $("#vcard").classList.add("revealed");
    $("#van").textContent=q.nom;
    $("#vwhy").innerHTML=(ok?"":`<em>Non, ça c'était ${esc(clique.nom)}. </em>`)+q.w;
    $("#vsc").textContent=V.score;
    const n=$("#vnext");n.classList.remove("hidden");
    n.textContent=V.i===V.list.length-1?"Voir le bilan":"Suivant";
    n.onclick=()=>{V.i++;voiStep();};
    n.focus({preventScroll:true});
  });
}
function voiEnd(){
  V.secs=Math.round((Date.now()-V.t0)/1000);
  logResult("voisins",V.score,V.list.length-V.errs.length,V.list.length,V.secs);
  vp.innerHTML=bilanHTML(V,"La France et ses sept voisins, c'est acquis.");
  $("#again",vp).onclick=voiStart;
}
```

- [ ] **Step 7 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs geo-europe.html geographie.html
```

Attendu pour `geo-europe.html` : `Tout est bon.`, quatre appels à `logResult` (`placer`, `nommer`, `membre`, `voisins`). Pour `geographie.html` : il ne reste qu'un lien mort, `geo-memo.html`.

- [ ] **Step 8 : Vérifier dans le navigateur**

```bash
open geo-europe.html
```

Point de contrôle décisif : dans la manche **Dans l'UE ?**, les non-membres ne doivent **pas** être grisés pendant la question, sinon l'exercice n'a plus d'intérêt. Ils le sont en revanche dans **Les voisins**. Contrôler aussi que Malte, Chypre et le Luxembourg sont cliquables au doigt grâce à leur halo, et que la silhouette de l'Europe reste lisible à 360 px.

- [ ] **Step 9 : Commit**

```bash
git add geo-europe.html
git commit -m "Ajoute le carnet de l'Europe

Les 27 pays de l'Union à placer et à reconnaître, la distinction avec
les pays européens non membres, et les sept voisins de la France."
```

---

### Task 8 : les deux fiches mémo

**Files:**
- Create: `histoire-memo.html`
- Create: `geo-memo.html`
- Read for reference: `astuces.html` (structure exacte d'une fiche à onglets sans score)

**Interfaces:**
- Consomme : les données rédigées aux tâches 2, 4, 5 et 6, recopiées ici en HTML statique. Les listes doivent être **identiques** à celles des carnets : mêmes dates, mêmes rôles, mêmes capitales.
- Produit : les deux derniers liens attendus par `histoire.html` et `geographie.html`.

- [ ] **Step 1 : Créer `histoire-memo.html`**

Copier `astuces.html`, puis :

1. `<title>` : `Le mémo d'histoire`.
2. Accent `--histoire:#8C4A2F` à la place des accents de classes et de fonctions, et les huit couleurs de catégorie de la tâche 4.
3. En-tête : bouton `🏠 Histoire` vers `histoire.html`, titre `Le mémo <em>d'histoire</em>`, sous-titre « Tout ce qu'il faut savoir pour l'évaluation de rentrée, sur une seule page. »
4. Deux onglets : `dates` (« Les 23 dates ») et `personnages` (« Les 21 personnages »).
5. Onglet **dates** : les cinq périodes en cinq blocs, chacun titré par son libellé (`1914-1918 · la Grande Guerre`, etc.) et suivi de ses dates sous la forme `<b>1916</b> bataille de Verdun`, avec l'explication `w` en dessous en petit. Reprendre mot pour mot les 23 entrées de `DATES` écrites à la tâche 2.
6. Onglet **personnages** : les 21 personnages groupés par catégorie, dans l'ordre `gm1`, `totalitarismes`, `allies`, `resistance`, `vichy`, `froide`, `deco`, `europe`. Pour chacun : le nom dans la couleur de sa catégorie, les années, puis le rôle rédigé. Reprendre mot pour mot les champs `nom`, `annees` et `role` de la tâche 4.
7. Section **Ne confonds pas**, en bas de chaque onglet, dans le style déjà présent dans `astuces.html` :
   - onglet dates : armistice (11 novembre 1918, on arrête de se battre) ≠ capitulation (8 mai 1945, on se rend sans condition) ; révolutions russes de 1917 ≠ création de l'URSS en 1922 ; chute du mur de Berlin en 1989 ≠ disparition de l'URSS en 1991 ; traité de Rome en 1957, qui crée la CEE ≠ traité de Maastricht en 1992, qui crée l'Union européenne ;
   - onglet personnages : Pétain, chef de l'État français qui collabore ≠ de Gaulle, chef de la France libre qui refuse l'armistice ; Lénine, qui fonde l'URSS ≠ Staline, qui la transforme en dictature totalitaire ; Truman, qui lance l'endiguement ≠ Gorbatchev, qui met fin à la guerre froide ; Schuman, qui lance la construction européenne en 1950 ≠ Simone Veil, première présidente du Parlement européen élu en 1979.

- [ ] **Step 2 : Créer `geo-memo.html`**

Copier `astuces.html`, puis :

1. `<title>` : `Le mémo de géo`.
2. Accent `--geo:#17697B`.
3. En-tête : bouton `🏠 Géographie` vers `geographie.html`, titre `Le mémo <em>de géo</em>`, sous-titre « Les listes à connaître par cœur, France et Europe. »
4. Deux onglets : `france` et `europe`.
5. Onglet **france**, cinq blocs :
   - les 13 régions et leur capitale, en tableau à deux colonnes, dans l'ordre alphabétique des régions ;
   - les 4 fleuves, chacun avec son parcours en une ligne (la Seine : Bourgogne, Paris, Rouen, la Manche ; la Loire : Massif Central, Orléans, Nantes, l'Atlantique ; la Garonne : Pyrénées, Toulouse, Bordeaux, la Gironde ; le Rhône : lac Léman, Lyon, Avignon, la Méditerranée) ;
   - les 8 ensembles de relief, en séparant les massifs anciens et bas (Massif Armoricain, Massif Central, Vosges) des chaînes jeunes et hautes (Alpes, Pyrénées, Jura) et des bassins sédimentaires (Bassin parisien, Bassin aquitain) ;
   - les 4 mers et océan qui bordent la France, avec les régions qu'ils touchent ;
   - les 5 DROM avec leur chef-lieu et leur océan, en reprenant les champs `nom`, `chef` et `w` de la tâche 6.
6. Onglet **europe** : les 27 pays de l'Union, en liste alphabétique, avec l'année d'entrée omise (hors périmètre) ; puis un bloc « En Europe, mais pas dans l'Union » listant les treize pays de `PAYS` dont `ue` vaut `false`, chacun avec sa raison, reprise du champ `w` de la tâche 7.
7. Section **Ne confonds pas** :
   - onglet france : région ≠ département (13 régions, 101 départements) ; capitale de région, qui est le chef-lieu, ≠ plus grande ville de la région (en Normandie, le chef-lieu est Rouen alors que Le Havre est très peuplée) ; DROM, qui sont des départements de plein exercice, ≠ COM, qui ont un statut particulier ; la Manche, qui est une mer, ≠ l'océan Atlantique ;
   - onglet europe : l'Europe, qui est un continent, ≠ l'Union européenne, qui est une organisation de 27 États ; l'Union européenne ≠ la zone euro, qui est plus petite (la Suède est dans l'Union sans être dans l'euro) ; l'Union européenne ≠ l'espace Schengen (la Suisse et la Norvège sont dans Schengen sans être dans l'Union).

- [ ] **Step 3 : Vérifier**

```bash
node /tmp/verif-grammaire/verif.mjs histoire-memo.html geo-memo.html histoire.html geographie.html index.html
```

Attendu : `Tout est bon.` Plus aucun lien mort nulle part.

- [ ] **Step 4 : Contrôler la cohérence des données**

Les fiches recopient à la main ce que les carnets contiennent en JavaScript : la moindre divergence est un piège pour l'élève. Contrôler que les nombres annoncés sont les bons :

```bash
grep -c 'capitale:' geo-france.html   # attendu : 13
node -e 'for(const [f,m] of [["geo-europe.html",/ue:true/g],["geo-europe.html",/ue:false/g],["histoire-dates.html",/^ \{d:"/gm],["histoire-personnages.html",/^ \{nom:"/gm]]){const h=require("fs").readFileSync(f,"utf8");console.log(f,m,(h.match(m)||[]).length)}'
```

Attendu, dans l'ordre : 27 membres de l'Union, 13 pays européens non membres, 23 dates, 21 personnages.

Puis relire côte à côte les treize couples région / capitale dans `geo-france.html` et dans `geo-memo.html`, et les vingt et un rôles dans `histoire-personnages.html` et dans `histoire-memo.html`. Corriger toute divergence dans la fiche, en prenant le carnet pour référence.

- [ ] **Step 5 : Vérifier dans le navigateur**

```bash
open histoire-memo.html geo-memo.html
```

Contrôler : les deux onglets basculent ; aucun score ni confetti n'apparaît ; les listes tiennent à 360 px sans débordement horizontal ; les couleurs de catégorie correspondent bien à celles des carnets.

- [ ] **Step 6 : Commit**

```bash
git add histoire-memo.html geo-memo.html
git commit -m "Ajoute les deux fiches mémo d'histoire et de géo

Les listes complètes à relire avant l'évaluation, avec les sections
Ne confonds pas : armistice et capitulation, Union européenne et
espace Schengen, région et département."
```

---

### Task 9 : documentation et relecture d'ensemble

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:**
- Consomme : les huit fichiers créés.
- Produit : la documentation que lira la prochaine session.

- [ ] **Step 1 : Mettre à jour la section « Structure » de `CLAUDE.md`**

Remplacer les deux premières puces par :

```markdown
- `index.html` : page chapeau, quatre cartes (Français, Maths, Histoire, Géographie).
- `francais.html` : rubrique Français, cartes vers les deux carnets et la boîte à astuces.
- `maths.html` : rubrique Maths, carte vers le carnet Thalès.
- `histoire.html` : rubrique Histoire (accent terre de Sienne `--histoire: #8C4A2F`), cartes vers les deux carnets et le mémo, plus le lien externe vers l'appli recommandée par la professeure.
- `geographie.html` : rubrique Géographie (accent bleu canard `--geo: #17697B`), cartes vers les deux carnets et le mémo.
```

Et ajouter, après la puce de `thales.html` :

```markdown
- `histoire-dates.html` et `histoire-personnages.html` : les deux carnets d'histoire, tirés du programme de révision de rentrée (`docs/3eme revisions histoire geographie FR_compressed (1).pdf`). Ils partagent un moteur de frise `friseSVG(opts)` qui découpe 1910-2010 en cinq tranches cliquables (`TRANCHES`, ids `t1` à `t5`), avec une largeur minimale par tranche pour rester utilisable au doigt. Le premier porte les 23 dates, le second les 21 personnages, chacun avec son rôle rédigé et le fait daté qui permet de le situer.
- `geo-france.html` et `geo-europe.html` : les deux carnets de géo. Ils partagent un moteur de cartes `mapSVG(fond, opts)` et son compagnon `mapBrancher(hote, repondre)` : un fond est un objet `{viewBox, zones}` dont chaque zone porte un tracé `d`, une ancre `cx`/`cy` et un type (`aire`, `trait`, `point`). Chaque zone reçoit un halo circulaire cliquable de 22 px, sans quoi l'Île-de-France, Malte ou le Luxembourg seraient injouables sur un téléphone. Les tracés sont schématiques et dessinés à la main : positions relatives justes, frontières approximatives.
- `histoire-memo.html` et `geo-memo.html` : fiches mémo statiques sur le modèle d'`astuces.html` (deux onglets, pas de score, pas d'appel Google Sheets). Elles recopient à la main les données des carnets : **toute modification d'une donnée dans un carnet doit être reportée dans la fiche correspondante.**
```

- [ ] **Step 2 : Ajouter une section sur les familles de fichiers jumeaux**

Dans `CLAUDE.md`, sous la section « Architecture des deux carnets (fichiers jumeaux) », renommer la section en « Architecture des carnets (fichiers jumeaux) » et ajouter en fin de section :

```markdown
Il y a maintenant trois familles de jumeaux, et la règle vaut pour chacune : **toute modification de comportement partagé doit être reportée à la main dans tous les fichiers de la famille.**

- Grammaire : `classes-grammaticales.html` et `fonctions-grammaticales.html` (quatre manches : En contexte, Caméléons/Déplacements, Mémo, Cartes).
- Histoire : `histoire-dates.html` et `histoire-personnages.html` (moteur `friseSVG` commun).
- Géographie : `geo-france.html` et `geo-europe.html` (moteur `mapSVG` commun).

`thales.html` reste seul de son espèce, avec son moteur `figSVG`.
```

- [ ] **Step 3 : Compléter la section « Gamification et suivi »**

Remplacer la puce sur `logResult` par :

```markdown
- Les résultats de chaque manche sont envoyés à Google Sheets via `logResult()` : POST `no-cors` vers `SHEET_URL` (Google Apps Script), avec `page` valant `"classes"`, `"fonctions"`, `"thales"`, `"histoire-dates"`, `"histoire-personnages"`, `"geo-france"` ou `"geo-europe"`. Toute nouvelle activité doit appeler `logResult` en fin de manche. **Défaut connu :** la manche Caméléons/Déplacements des deux carnets de grammaire (`camEnd`) ne l'appelle pas encore.
```

- [ ] **Step 4 : Mettre à jour `README.md`**

Lire le fichier, puis y refléter les quatre matières au lieu de deux, en gardant son ton et sa longueur actuels.

- [ ] **Step 5 : Relire l'ensemble**

```bash
node /tmp/verif-grammaire/verif.mjs index.html histoire.html geographie.html histoire-dates.html histoire-personnages.html histoire-memo.html geo-france.html geo-europe.html geo-memo.html
```

Attendu : `Tout est bon.`

Chercher les tirets cadratins interdits par le `CLAUDE.md` global :

```bash
grep -n '—' *.html
```

Attendu : aucune sortie.

- [ ] **Step 6 : Parcours complet dans le navigateur**

```bash
open index.html
```

Depuis l'accueil, atteindre chacune des huit pages nouvelles en ne cliquant que sur des liens, et revenir à l'accueil depuis chacune. Jouer au moins une question de chacune des seize manches. Refaire le parcours dans une fenêtre réduite à 360 px de large.

- [ ] **Step 7 : Commit**

```bash
git add CLAUDE.md README.md
git commit -m "Documente les rubriques Histoire et Géographie

Les trois familles de fichiers jumeaux, les deux nouveaux moteurs
friseSVG et mapSVG, et la liste des valeurs de page envoyées à
Google Sheets."
```

---

## Ce que le plan ne fait pas

- Il ne corrige pas l'absence d'appel à `logResult` dans `camEnd()` des deux carnets de grammaire (`classes-grammaticales.html:581`, `fonctions-grammaticales.html:569`). Le défaut est documenté à la tâche 9 mais laissé en l'état : c'est un autre sujet, à traiter séparément.
- Il n'ajoute ni capitales européennes, ni dates d'adhésion à l'Union, ni repères historiques hors du PDF.
- Il ne cherche pas l'exactitude cartographique : les tracés sont dessinés à la main et assumés comme schématiques.
