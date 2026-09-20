# Carnet « Masse volumique » — plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUISE : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour dérouler ce plan tâche par tâche. Les étapes sont des cases à cocher (`- [ ]`).

**But :** sortir la masse volumique du carnet « États de la matière » et en faire un carnet de cinq manches, `masse-volumique.html`, avec deux moteurs de figures et un script de contrôle.

**Architecture :** `masse-volumique.html` est un jumeau d'`etats-matiere.html` : il reprend tels quels l'en-tête, le CSS, les helpers, la gamification et le constructeur `creeManche`, et n'apporte que ses propres moteurs SVG, ses données et ses cinq manches. Un site statique sans build : on vérifie en ouvrant la page dans un navigateur, et par des scripts Node dans `outils/`.

**Pile technique :** HTML/CSS/JS inline, sans dépendance ni build. Node ≥ 18 pour les scripts de contrôle (`node:fs`, modules ESM `.mjs`). Pas de framework de test : la vérification passe par `outils/verifie-masse.mjs`, `outils/coherence.mjs` et l'œil dans le navigateur.

## Contraintes globales

- Tout le contenu visible est en **français**, messages de commit compris.
- Aucune dépendance, aucun build, aucun fichier externe : CSS et JS restent **inline** dans la page.
- Les fichiers jumeaux (`etats-matiere.html` et `masse-volumique.html`) partagent `creeManche`, `appareil()`, `confetti`, `bilanHTML` et le CSS : **toute retouche d'un comportement partagé se reporte à la main dans les deux**.
- Les tableaux de données (`FORMULE`, `MESURER`, `UNITES`, `IDENTIFIER`, `FLOTTER`, `METAUX`, `LIQUIDES`) ne contiennent **que des littéraux** (pas d'appel de fonction, pas de variable) : `outils/verifie-masse.mjs` et `outils/coherence.mjs` les évaluent hors de la page. Chacun se termine par une ligne contenant exactement `];`.
- Les figures sont construites dans `prep(q)`, jamais stockées dans les données.
- Cible principale : un téléphone. Points de rupture à 420 px et 360 px, `prefers-reduced-motion` respecté.
- Accent de la matière : `--pc: #5F4B8B`. Rouge de correction : `--marge`.
- Masses volumiques de référence, en g/cm³ : aluminium 2,7 · zinc 7,1 · fer 7,9 · laiton 8,2 · cuivre 8,9 · argent 10,5 · or 19,3 · éthanol 0,8 · huile 0,9 · eau 1 · sirop 1,3 · glace 0,92.
- `logResult` envoie `page:"masse-volumique"` et `game` valant `formule`, `mesurer`, `unites`, `identifier` ou `flotter`.

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `masse-volumique.html` (créé) | Le carnet : en-tête, cinq onglets, deux moteurs SVG, sept tableaux de données, cinq manches. |
| `outils/verifie-masse.mjs` (créé) | Contrôle du carnet : le script compile, chaque question est bien formée, les tables de valeurs sont triées. |
| `outils/coherence.mjs` (modifié) | Accepte désormais les nombres écrits à la virgule dans les fiches mémo. |
| `etats-matiere.html` (modifié) | Perd sa sixième manche. |
| `physique-chimie.html` (modifié) | Gagne la carte du carnet 2, la carte du carnet 1 perd un mode. |
| `pc-memo.html` (modifié) | Gagne un troisième onglet « Masse volumique ». |
| `CLAUDE.md` (modifié) | Nouvelle page, quatrième famille de jumeaux, nouvelles commandes de contrôle. |

---

### Tâche 1 : le squelette du carnet et la manche « La formule »

**Fichiers :**
- Créer : `masse-volumique.html`
- Créer : `outils/verifie-masse.mjs`
- Lire : `etats-matiere.html` (source de la copie)

**Interfaces :**
- Consomme : rien.
- Produit : le fichier `masse-volumique.html` avec quatre ancres de montage utilisées par les tâches suivantes, écrites exactement ainsi :
  - `/* ============ moteurs ============ */`
  - `/* ============ donnees ============ */`
  - `/* ============ les manches ============ */`
  - `  /* fin des manches */` (dernière ligne à l'intérieur de `const MANCHES={`)
  Produit aussi `const METAUX` et `const LIQUIDES` (`[{nom:String, rho:Number}]`, `LIQUIDES` portant en plus `col:String`), le helper `const fr=n=>String(n).replace(".",",")`, et `outils/verifie-masse.mjs` (usage : `node outils/verifie-masse.mjs [fichier]`, sortie `le carnet est conforme`, code 0).

- [ ] **Étape 1 : assembler le squelette depuis le carnet jumeau**

Les trois tranches reprises d'`etats-matiere.html` sont : les lignes 1 à 229 (en-tête, corps, helpers), 413 à 538 (gamification et `creeManche`), 579 à la fin (branchement des onglets).

```bash
python3 - <<'PY'
src = open('etats-matiere.html', encoding='utf8').read().split('\n')
tete    = src[0:229]     # lignes 1-229 : head, body, outils
moteur  = src[412:538]   # lignes 413-538 : gamification + creeManche
onglets = src[578:]      # lignes 579-fin : onglets + demarrage
open('masse-volumique.html', 'w', encoding='utf8').write('\n'.join(
    tete
    + ['/* ============ moteurs ============ */', '']
    + ['/* ============ donnees ============ */', '']
    + moteur
    + ['/* ============ les manches ============ */', 'const MANCHES={', '  /* fin des manches */', '};', '']
    + onglets))
PY
```

- [ ] **Étape 2 : adapter l'en-tête, les onglets et les panneaux**

```bash
python3 - <<'PY'
p = 'masse-volumique.html'
s = open(p, encoding='utf8').read()
s = s.replace('<title>Les états de la matière</title>', '<title>La masse volumique</title>')
s = s.replace("<h1>La matière change <em>d'état</em></h1>", '<h1>Chaque matière a sa <em>masse volumique</em></h1>')
s = s.replace('<p class="sub">Six entraînements : les trois états, les changements d\'état, la courbe de l\'eau, les mélanges, la masse volumique.</p>',
              '<p class="sub">Cinq entraînements : la formule, la mesure d\'un volume, les unités, l\'identification d\'un métal, flotter ou couler.</p>')
s = s.replace('/* ---------- onglets (deux rangees de trois) ---------- */', '/* ---------- onglets (deux rangees) ---------- */')
s = s.replace('page:"etats-matiere"', 'page:"masse-volumique"')
s = s.replace('MANCHES.etats.intro();', 'MANCHES.formule.intro();')

nav = '''    <nav role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-panel="formule">La formule</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="mesurer">Mesurer</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="unites">Les unités</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="identifier">Identifier</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="flotter">Flotter ou couler</button>
    </nav>'''
debut, fin = s.index('    <nav role="tablist">'), s.index('</nav>') + len('</nav>')
s = s[:debut] + nav + s[fin:]

panels = '''    <section class="panel on" id="formule"></section>
    <section class="panel" id="mesurer"></section>
    <section class="panel" id="unites"></section>
    <section class="panel" id="identifier"></section>
    <section class="panel" id="flotter"></section>'''
debut = s.index('    <section class="panel on"')
fin = s.index('</section>', s.rindex('<section class="panel"')) + len('</section>')
s = s[:debut] + panels + s[fin:]
open(p, 'w', encoding='utf8').write(s)
PY
```

- [ ] **Étape 3 : écrire les tables de valeurs et les questions de la manche**

Insérer ce bloc juste après l'ancre `/* ============ donnees ============ */`.

```js
const METAUX=[
  {nom:"Aluminium",rho:2.7},
  {nom:"Zinc",rho:7.1},
  {nom:"Fer",rho:7.9},
  {nom:"Laiton",rho:8.2},
  {nom:"Cuivre",rho:8.9},
  {nom:"Argent",rho:10.5},
  {nom:"Or",rho:19.3}
];
const LIQUIDES=[
  {nom:"Éthanol",rho:0.8,col:"#E4E0F2"},
  {nom:"Huile",rho:0.9,col:"#F0E2B0"},
  {nom:"Eau",rho:1,col:"#CFE3F2"},
  {nom:"Sirop",rho:1.3,col:"#E9B7A4"}
];
const fr=n=>String(n).replace(".",",");
const liq=nom=>LIQUIDES.find(l=>l.nom===nom);

const FORMULE=[
  {kind:"qcm",q:"Comment calcule-t-on la masse volumique ρ d'un objet ?",ch:["ρ = m ÷ V","ρ = V ÷ m","ρ = m × V"],good:0,rep:"ρ = m ÷ V.",
   w:"La masse volumique est la masse divisée par le volume. Elle s'exprime en g/cm³ (ou en kg/m³)."},
  {kind:"qcm",q:"Une bouteille d'un litre d'eau et une bouteille de deux litres d'eau. Que dire de leur masse volumique ?",ch:["La même : 1 g/cm³ pour les deux","Deux fois plus grande pour la grande bouteille","Deux fois plus grande pour la petite bouteille"],good:0,rep:"La même : 1 g/cm³.",
   w:"La <em>masse</em> dépend de la quantité, la <em>masse volumique</em> non : elle caractérise la matière. Deux litres d'eau pèsent deux fois plus, mais c'est toujours de l'eau, donc toujours 1 g/cm³."},
  {kind:"num",q:"Un pavé de fer a un volume de 10 cm³ et une masse de 79 g. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:7.9,unit:"g/cm³",rep:"ρ = 7,9 g/cm³",
   w:"ρ = m ÷ V = 79 ÷ 10 = <em>7,9 g/cm³</em>. C'est bien la masse volumique du fer."},
  {kind:"num",q:"La masse volumique de l'eau vaut 1 g/cm³. <em>Quelle est la masse de 250 cm³ d'eau, en g ?</em>",ans:250,unit:"g",rep:"m = 250 g",
   w:"m = ρ × V = 1 × 250 = <em>250 g</em>. Avec l'eau, masse en grammes et volume en cm³ ont la même valeur."},
  {kind:"num",q:"La masse volumique de l'huile vaut 0,9 g/cm³. <em>Quelle est la masse de 200 cm³ d'huile, en g ?</em>",ans:180,unit:"g",rep:"m = 180 g",
   w:"m = ρ × V = 0,9 × 200 = <em>180 g</em> : moins lourd que le même volume d'eau (200 g)."},
  {kind:"num",q:"L'aluminium a une masse volumique de 2,7 g/cm³. <em>Quelle est la masse d'un bloc de 30 cm³, en g ?</em>",ans:81,unit:"g",rep:"m = 81 g",
   w:"m = ρ × V = 2,7 × 30 = <em>81 g</em>. Le même bloc en fer (7,9) pèserait 237 g : presque trois fois plus."},
  {kind:"num",q:"La masse volumique du fer vaut 7,9 g/cm³. <em>Quel volume, en cm³, occupent 158 g de fer ?</em>",ans:20,unit:"cm³",rep:"V = 20 cm³",
   w:"V = m ÷ ρ = 158 ÷ 7,9 = <em>20 cm³</em>. La formule se retourne dans les trois sens : ρ = m ÷ V, m = ρ × V, V = m ÷ ρ."},
  {kind:"qcm",q:"Quelle est environ la masse d'un litre d'air ?",ch:["1,3 g","130 g","0 g : un gaz ne pèse rien"],good:0,rep:"Environ 1,3 g.",
   w:"L'air a une masse : environ 1,3 g par litre. C'est peu, mais ce n'est pas rien : un gaz se pèse."}
];
```

- [ ] **Étape 4 : brancher la manche**

Insérer avant l'ancre `  /* fin des manches */`, à l'intérieur de `const MANCHES={`.

```js
  formule:creeManche({panel:"#formule",game:"formule",donnees:FORMULE,
    titre:"ρ = m ÷ V.",
    texte:"Huit questions pour installer la formule et la retourner dans tous les sens. La calculatrice est autorisée : pour les calculs, tape ta réponse.",
    bravo:"Rien à revoir. Passe à la manche suivante : mesurer un volume pour de vrai.",
    prep:q=>({...q,annot:q.kind==="num"?"À toi de calculer":"La masse volumique",fig:null,hyp:q.q})}),
```

- [ ] **Étape 5 : écrire le script de contrôle**

Créer `outils/verifie-masse.mjs` :

```js
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
```

- [ ] **Étape 6 : lancer le contrôle**

```bash
node outils/verifie-masse.mjs
```

Attendu : `1 manche(s) contrôlée(s) : le carnet est conforme.`

- [ ] **Étape 7 : vérifier dans le navigateur**

```bash
open masse-volumique.html
```

À contrôler : cinq onglets sur deux rangées, l'onglet « La formule » actif et son écran d'intro affiché ; « Commencer la manche » enchaîne huit questions ; une question à saisie accepte `7,9` comme `7.9` ; le bilan s'affiche à la fin. Les quatre autres onglets sont vides pour l'instant, c'est normal : leurs manches arrivent aux tâches suivantes, et cliquer dessus lèvera une erreur dans la console tant que `MANCHES` ne les contient pas.

- [ ] **Étape 8 : commiter**

```bash
git add masse-volumique.html outils/verifie-masse.mjs
git commit -m "Ouvre le carnet Masse volumique avec la manche de la formule"
```

---

### Tâche 2 : le moteur d'éprouvettes et la manche « Mesurer »

**Fichiers :**
- Modifier : `masse-volumique.html` (CSS des figures, ancre `/* ============ moteurs ============ */`, ancre `/* ============ donnees ============ */`, ancre `  /* fin des manches */`)

**Interfaces :**
- Consomme : les ancres et `fr()` de la tâche 1.
- Produit : `eprouvette(o)` où `o = {tubes:[{v:Number, label:String, solide:Boolean}], max:Number, loupe:Boolean}` et renvoie une chaîne SVG ; `const MESURER` (8 questions).

- [ ] **Étape 1 : ajouter le CSS des éprouvettes**

Insérer ces lignes juste avant `/* ---------- reactions ---------- */` dans le `<style>` :

```css
.fig .tube{fill:none;stroke:var(--ink);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.fig .liq{fill:#CFE3F2}
.fig .menis{fill:none;stroke:#7FA8CA;stroke-width:1.5}
.fig .solide{fill:var(--pc);opacity:.8}
.fig .loupe{fill:var(--paper-2);stroke:var(--ink);stroke-width:1.5}
.fig .lire{stroke:var(--marge);stroke-width:1.5;stroke-dasharray:5 4}
```

- [ ] **Étape 2 : écrire le moteur**

Insérer après l'ancre `/* ============ moteurs ============ */` :

```js
/* une ou deux eprouvettes graduees, avec le solide immerge et la loupe sur le menisque */
function eprouvette(o){
  const max=o.max||110, tubes=o.tubes, W=54, H=150, Y0=182;
  const xs = tubes.length===1 ? (o.loupe?[104]:[160]) : [92,228];
  const y = v => Y0-(v/max)*H;
  let b="";
  tubes.forEach((t,i)=>{
    const x=xs[i]-W/2, ys=y(t.v);
    b+=`<rect class="liq" x="${x+2}" y="${ys}" width="${W-4}" height="${Y0-ys}"/>`;
    if(t.solide)b+=`<rect class="solide" x="${x+13}" y="${Y0-24}" width="${W-26}" height="21" rx="3"/>`;
    b+=`<path class="menis" d="M ${x+2} ${ys} Q ${xs[i]} ${ys+6} ${x+W-2} ${ys}"/>`;
    b+=`<path class="tube" d="M ${x} ${Y0-H-14} L ${x} ${Y0-8} Q ${x} ${Y0} ${x+8} ${Y0} L ${x+W-8} ${Y0} Q ${x+W} ${Y0} ${x+W} ${Y0-8} L ${x+W} ${Y0-H-14}"/>`;
    for(let v=0;v<=max;v+=10){
      const gros=v%20===0;
      b+=`<line class="axe" x1="${x+W}" x2="${x+W-(gros?11:6)}" y1="${y(v)}" y2="${y(v)}"/>`;
      if(gros&&v>0)b+=`<text class="tick" x="${x+W+4}" y="${y(v)}" dominant-baseline="middle">${v}</text>`;
    }
    b+=`<text class="axlab" x="${xs[i]}" y="205" text-anchor="middle">${t.label}</text>`;
  });
  if(o.loupe){
    const LX=214,LY=44,LW=84,LH=78,surf=LY+30;
    b+=`<rect class="loupe" x="${LX}" y="${LY}" width="${LW}" height="${LH}" rx="12"/>`;
    b+=`<path class="liq" d="M ${LX+3} ${surf} Q ${LX+LW/2} ${surf+15} ${LX+LW-3} ${surf} L ${LX+LW-3} ${LY+LH-3} L ${LX+3} ${LY+LH-3} Z"/>`;
    b+=`<path class="menis" d="M ${LX+3} ${surf} Q ${LX+LW/2} ${surf+15} ${LX+LW-3} ${surf}"/>`;
    b+=`<line class="lire" x1="${LX-8}" x2="${LX+LW+8}" y1="${surf+14}" y2="${surf+14}"/>`;
    b+=`<text class="axlab" x="${LX+LW/2}" y="${LY+LH+18}" text-anchor="middle">on lit ici</text>`;
  }
  return `<svg viewBox="0 0 320 212" role="img" aria-label="Éprouvette graduée">${b}</svg>`;
}
```

- [ ] **Étape 3 : écrire les questions**

Insérer après l'ancre `/* ============ donnees ============ */`, à la suite de `FORMULE` :

```js
const MESURER=[
  {kind:"qcm",fig:{tubes:[{v:60,label:"éprouvette graduée"}]},q:"Avec quel instrument mesure-t-on précisément le volume d'un liquide ?",ch:["Une éprouvette graduée","Un thermomètre","Une balance"],good:0,rep:"Une éprouvette graduée.",
   w:"Le thermomètre mesure une température, la balance une masse. Pour un volume, c'est l'éprouvette graduée : ses traits sont gradués en mL."},
  {kind:"qcm",fig:{tubes:[{v:60,label:"la surface est incurvée"}],loupe:true},q:"La surface du liquide est incurvée. Où lit-on le volume ?",ch:["Au bas de la courbe, l'œil bien en face","En haut, là où le liquide touche le verre","Au milieu, à vue d'œil"],good:0,rep:"Au bas du ménisque, l'œil en face.",
   w:"Cette courbe s'appelle le <em>ménisque</em>. On lit toujours le trait au bas du ménisque, en plaçant l'œil à sa hauteur : de biais, on lit faux."},
  {kind:"qcm",fig:null,q:"Avant de peser un liquide, on pose l'éprouvette vide sur la balance et on appuie sur « tare ». Pourquoi ?",ch:["Pour que la balance oublie la masse de l'éprouvette","Pour régler la balance en grammes","Pour vérifier le volume"],good:0,rep:"Pour ne peser que le liquide.",
   w:"La tare remet l'affichage à zéro avec l'éprouvette vide dessus. Ce qu'on lit ensuite est la masse du liquide seul, sans le verre."},
  {kind:"num",fig:{tubes:[{v:62,label:"V₁ : avant"},{v:76,label:"V₂ : avec le solide",solide:true}]},q:"On plonge un solide dans l'éprouvette. <em>Quel est son volume, en cm³ ?</em>",ans:14,unit:"cm³",rep:"V = 14 cm³",
   w:"Le solide chasse l'eau : le niveau monte d'exactement son volume. V = 76 − 62 = <em>14 mL</em>, et 1 mL = 1 cm³, donc 14 cm³."},
  {kind:"num",fig:{tubes:[{v:62,label:"V₁ : avant"},{v:76,label:"V₂ : avec le solide",solide:true}]},q:"Ce même solide a une masse de 37,8 g, et il occupe 14 cm³. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:2.7,unit:"g/cm³",rep:"ρ = 2,7 g/cm³",
   w:"ρ = m ÷ V = 37,8 ÷ 14 = <em>2,7 g/cm³</em> : c'est de l'aluminium. Peser, mesurer, diviser : trois gestes et la matière est identifiée."},
  {kind:"qcm",fig:{tubes:[{v:62,label:"V₁ : avant"},{v:76,label:"V₂ : avec le solide",solide:true}]},q:"Pourquoi le solide doit-il être entièrement sous l'eau ?",ch:["Sinon il ne chasse pas tout son volume","Sinon il devient plus léger","Sinon l'eau s'évapore"],good:0,rep:"Sinon il ne chasse pas tout son volume.",
   w:"Le niveau ne monte que du volume réellement immergé. Un solide qui dépasse fausse la mesure : on le maintient sous l'eau, par exemple avec une aiguille."},
  {kind:"num",fig:null,q:"Un pavé de fer mesure 2 cm sur 3 cm sur 5 cm. <em>Quel est son volume, en cm³ ?</em>",ans:30,unit:"cm³",rep:"V = 30 cm³",
   w:"Pour un solide bien régulier, pas besoin d'eau : V = 2 × 3 × 5 = <em>30 cm³</em>. Ce pavé pèse 237 g, donc ρ = 237 ÷ 30 = 7,9 g/cm³, du fer."},
  {kind:"num",fig:{tubes:[{v:100,label:"100 mL pesés : 80 g"}]},q:"Dans une éprouvette tarée, 100 mL de liquide pèsent 80 g. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:0.8,unit:"g/cm³",rep:"ρ = 0,8 g/cm³",
   w:"ρ = 80 ÷ 100 = <em>0,8 g/cm³</em>. C'est plus léger que l'eau : ce liquide flotterait dessus. À 0,8, c'est de l'éthanol."}
];
```

- [ ] **Étape 4 : brancher la manche**

Insérer avant `  /* fin des manches */`, après l'entrée `formule` :

```js
  mesurer:creeManche({panel:"#mesurer",game:"mesurer",donnees:MESURER,
    titre:"Mesurer pour de vrai.",
    texte:"L'éprouvette, le ménisque, la tare, et le grand classique : trouver le volume d'un solide en le plongeant dans l'eau.",
    bravo:"Rien à revoir. Direction les unités, là où les erreurs coûtent le plus cher.",
    prep:q=>({...q,annot:q.kind==="num"?"À toi de calculer":"Mesurer un volume",fig:q.fig?eprouvette(q.fig):null,hyp:q.q})}),
```

- [ ] **Étape 5 : lancer le contrôle**

```bash
node outils/verifie-masse.mjs
```

Attendu : `2 manche(s) contrôlée(s) : le carnet est conforme.`

- [ ] **Étape 6 : vérifier dans le navigateur**

```bash
open masse-volumique.html
```

Onglet « Mesurer » : les deux éprouvettes du déplacement d'eau doivent montrer un niveau nettement plus haut à droite, avec le solide violet posé au fond ; les graduations chiffrées (20, 40, 60, 80, 100) restent lisibles et ne débordent pas du cadre ; la question sur le ménisque affiche la loupe à droite avec le trait rouge « on lit ici » au bas de la courbe. Rétrécir la fenêtre à 360 px de large : rien ne doit déborder.

- [ ] **Étape 7 : commiter**

```bash
git add masse-volumique.html
git commit -m "Ajoute la manche Mesurer et son moteur d'éprouvettes"
```

---

### Tâche 3 : la manche « Les unités »

**Fichiers :**
- Modifier : `masse-volumique.html` (ancre `/* ============ donnees ============ */`, ancre `  /* fin des manches */`)

**Interfaces :**
- Consomme : les ancres de la tâche 1.
- Produit : `const UNITES` (8 questions). Aucune figure, aucun moteur.

- [ ] **Étape 1 : écrire les questions**

Insérer après `MESURER` :

```js
const UNITES=[
  {kind:"qcm",q:"1 mL, c'est aussi…",ch:["1 cm³","1 dm³","10 cm³"],good:0,rep:"1 mL = 1 cm³.",
   w:"Le millilitre et le centimètre cube sont deux noms du même volume. C'est ce qui permet de passer d'une éprouvette (en mL) à un calcul en cm³ sans rien convertir."},
  {kind:"qcm",q:"1 L, c'est aussi…",ch:["1 dm³, soit 1000 cm³","1 m³","100 cm³"],good:0,rep:"1 L = 1 dm³ = 1000 cm³.",
   w:"Un litre est un cube de 10 cm de côté : 10 × 10 × 10 = 1000 cm³. Et 1 m³ vaut 1000 L : un mètre cube d'eau pèse une tonne."},
  {kind:"num",q:"L'aluminium a une masse volumique de 2,7 g/cm³. <em>Combien cela fait-il en kg/m³ ?</em>",ans:2700,unit:"kg/m³",rep:"2700 kg/m³",
   w:"On multiplie par 1000 : 2,7 g/cm³ = <em>2700 kg/m³</em>. Un mètre cube contient un million de cm³, mais un kilo vaut mille grammes : il reste le facteur 1000."},
  {kind:"num",q:"L'eau a une masse volumique de 1000 kg/m³. <em>Combien cela fait-il en g/cm³ ?</em>",ans:1,unit:"g/cm³",rep:"1 g/cm³",
   w:"On divise par 1000 : 1000 kg/m³ = <em>1 g/cm³</em>. Les deux écritures disent la même chose, c'est l'unité choisie qui change."},
  {kind:"num",q:"Une canette contient 33 cL. <em>Combien cela fait-il en mL ?</em>",ans:330,unit:"mL",rep:"330 mL",
   w:"Un centilitre vaut 10 millilitres : 33 × 10 = <em>330 mL</em>, donc 330 cm³."},
  {kind:"qcm",q:"L'essence a une masse volumique de 0,69 g/mL. Quelle est la masse d'un litre d'essence ?",ch:["690 g","69 g","6,9 g"],good:0,rep:"690 g.",
   w:"Un litre vaut <em>1000</em> mL, pas 100 : 0,69 × 1000 = <em>690 g</em>. C'est l'erreur la plus fréquente du chapitre, un facteur 10 qui s'envole."},
  {kind:"num",q:"L'huile a une masse volumique de 0,9 g/cm³. <em>Quelle est la masse d'une bouteille de 1,5 L, en g ?</em>",ans:1350,unit:"g",rep:"m = 1350 g",
   w:"D'abord la conversion : 1,5 L = 1500 cm³. Ensuite la formule : m = 0,9 × 1500 = <em>1350 g</em>, soit 1,35 kg."},
  {kind:"qcm",q:"Quelle est l'unité de masse volumique du système international ?",ch:["Le kg/m³","Le g/cm³","Le g/L"],good:0,rep:"Le kg/m³.",
   w:"Le système international combine le kilogramme et le mètre cube. En classe on utilise surtout le g/cm³, plus pratique, mais les deux sont justes à condition d'écrire l'unité."}
];
```

- [ ] **Étape 2 : brancher la manche**

Insérer avant `  /* fin des manches */`, après l'entrée `mesurer` :

```js
  unites:creeManche({panel:"#unites",game:"unites",donnees:UNITES,
    titre:"Les unités, sans se tromper.",
    texte:"mL et cm³, L et dm³, g/cm³ et kg/m³. Huit questions pour ne plus perdre de points sur un facteur 1000.",
    bravo:"Rien à revoir. Maintenant, sers-toi de tout ça pour reconnaître un métal.",
    prep:q=>({...q,annot:q.kind==="num"?"À toi de convertir":"Les unités",fig:null,hyp:q.q})}),
```

- [ ] **Étape 3 : lancer le contrôle**

```bash
node outils/verifie-masse.mjs
```

Attendu : `3 manche(s) contrôlée(s) : le carnet est conforme.`

- [ ] **Étape 4 : vérifier dans le navigateur**

```bash
open masse-volumique.html
```

Onglet « Les unités » : les huit questions s'enchaînent, la saisie `2700` est acceptée, et la question sur l'essence affiche bien `690 g` en premier choix. Vérifier qu'une réponse fausse affiche l'explication complète en dessous.

- [ ] **Étape 5 : commiter**

```bash
git add masse-volumique.html
git commit -m "Ajoute la manche des unités et de leurs conversions"
```

---

### Tâche 4 : la manche « Identifier » et son tableau de métaux

**Fichiers :**
- Modifier : `masse-volumique.html` (CSS des figures, ancre `/* ============ moteurs ============ */`, ancre `/* ============ donnees ============ */`, ancre `  /* fin des manches */`)

**Interfaces :**
- Consomme : `METAUX` et `fr()` de la tâche 1.
- Produit : `tableauMetaux()` (renvoie du HTML, pas du SVG) ; `const IDENTIFIER` (8 questions).

- [ ] **Étape 1 : ajouter le CSS du tableau**

Insérer juste avant `/* ---------- reactions ---------- */` :

```css
.fig .metaux{display:flex;flex-wrap:wrap;gap:6px}
.fig .metaux span{
  flex:1 1 30%;display:flex;justify-content:space-between;gap:8px;
  border:1px solid var(--rule);border-radius:9px;background:var(--paper-2);
  padding:6px 9px;font-size:13.5px
}
.fig .metaux b{font-weight:700}
.fig .metaux i{font-style:normal;color:var(--ink-soft)}
.fig .legende{margin:6px 0 0;font-size:12px;color:var(--ink-soft);text-align:right}
```

- [ ] **Étape 2 : écrire le tableau**

Insérer après l'ancre `/* ============ moteurs ============ */`, à la suite d'`eprouvette` :

```js
/* le tableau des metaux, en HTML : sept colonnes de SVG seraient illisibles sur un telephone */
function tableauMetaux(){
  return `<div class="metaux">${METAUX.map(m=>`<span><b>${m.nom}</b><i>${fr(m.rho)}</i></span>`).join("")}</div>`+
         `<p class="legende">masses volumiques en g/cm³</p>`;
}
```

- [ ] **Étape 3 : écrire les questions**

Insérer après `UNITES` :

```js
const IDENTIFIER=[
  {kind:"num",q:"Un bijou de 54 g occupe 20 cm³. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:2.7,unit:"g/cm³",rep:"ρ = 2,7 g/cm³",
   w:"ρ = 54 ÷ 20 = <em>2,7 g/cm³</em> : de l'aluminium, pas de l'argent (10,5). Un bijou en argent de ce volume pèserait 210 g, quatre fois plus."},
  {kind:"qcm",q:"Un cylindre a une masse volumique de 8,9 g/cm³. De quel métal s'agit-il ?",ch:["Du cuivre","De l'argent","Du zinc"],good:0,rep:"Du cuivre.",
   w:"8,9 g/cm³, c'est la ligne du cuivre. L'argent est à 10,5 et le zinc à 7,1 : aucune confusion possible, les valeurs sont bien séparées."},
  {kind:"num",q:"Une pièce dorée pèse 41 g et occupe 5 cm³. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:8.2,unit:"g/cm³",rep:"ρ = 8,2 g/cm³",
   w:"ρ = 41 ÷ 5 = <em>8,2 g/cm³</em> : du laiton, un alliage jaune. L'or est à 19,3, plus de deux fois plus lourd : cette pièce n'est pas en or."},
  {kind:"num",q:"Un petit lingot pèse 386 g et occupe 20 cm³. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:19.3,unit:"g/cm³",rep:"ρ = 19,3 g/cm³",
   w:"ρ = 386 ÷ 20 = <em>19,3 g/cm³</em> : cette fois c'est bien de l'or. Un volume grand comme une boîte d'allumettes pèse près de 400 g."},
  {kind:"num",q:"Une couronne pèse 210 g et occupe 20 cm³. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:10.5,unit:"g/cm³",rep:"ρ = 10,5 g/cm³",
   w:"ρ = 210 ÷ 20 = <em>10,5 g/cm³</em> : de l'argent. C'est exactement la question posée à Archimède, à qui l'on demandait si la couronne du roi était en or."},
  {kind:"num",q:"Un morceau de zinc pèse 71 g. <em>Quel volume occupe-t-il, en cm³ ?</em>",ans:10,unit:"cm³",rep:"V = 10 cm³",
   w:"V = m ÷ ρ = 71 ÷ 7,1 = <em>10 cm³</em>. Le tableau se lit aussi dans ce sens : il donne le volume quand on connaît la masse."},
  {kind:"qcm",q:"Deux objets de tailles très différentes ont tous les deux une masse volumique de 7,1 g/cm³. Sont-ils du même métal ?",ch:["Oui : la masse volumique ne dépend pas de la taille","Non, puisque le gros est plus lourd","On ne peut pas le savoir"],good:0,rep:"Oui : tous les deux en zinc.",
   w:"C'est tout l'intérêt de cette grandeur : elle caractérise la matière, pas l'objet. Gros ou petit, du zinc reste à 7,1 g/cm³."},
  {kind:"qcm",q:"Un objet flotte sur l'eau. Peut-il être en l'un de ces métaux ?",ch:["Non : ils ont tous une masse volumique supérieure à 1","Oui, en aluminium","Oui, en zinc"],good:0,rep:"Non, aucun.",
   w:"Le plus léger du tableau, l'aluminium, est à 2,7 : presque trois fois l'eau. Un objet métallique qui flotte est forcément creux, comme une coque de bateau."}
];
```

- [ ] **Étape 4 : brancher la manche**

Insérer avant `  /* fin des manches */`, après l'entrée `unites` :

```js
  identifier:creeManche({panel:"#identifier",game:"identifier",donnees:IDENTIFIER,
    titre:"Reconnaître un métal.",
    texte:"Le tableau reste sous tes yeux pendant toute la manche. À toi de calculer, puis de dire de quel métal il s'agit.",
    bravo:"Rien à revoir. Dernière manche : qui flotte, qui coule, et pourquoi.",
    prep:q=>({...q,annot:q.kind==="num"?"À toi de calculer":"Identifier la matière",fig:tableauMetaux(),hyp:q.q})}),
```

- [ ] **Étape 5 : lancer le contrôle**

```bash
node outils/verifie-masse.mjs
```

Attendu : `4 manche(s) contrôlée(s) : le carnet est conforme.`

- [ ] **Étape 6 : vérifier dans le navigateur**

```bash
open masse-volumique.html
```

Onglet « Identifier » : les sept métaux s'affichent en pastilles sur trois colonnes, triés du plus léger au plus lourd, avec la légende « masses volumiques en g/cm³ » sous le bloc. À 360 px de large, les pastilles passent à deux colonnes sans que « Aluminium » ne déborde.

- [ ] **Étape 7 : commiter**

```bash
git add masse-volumique.html
git commit -m "Ajoute la manche d'identification des métaux"
```

---

### Tâche 5 : le moteur de verre et la manche « Flotter ou couler »

**Fichiers :**
- Modifier : `masse-volumique.html` (CSS des figures, ancre `/* ============ moteurs ============ */`, ancre `/* ============ donnees ============ */`, ancre `  /* fin des manches */`)

**Interfaces :**
- Consomme : `LIQUIDES`, `liq()` et `fr()` de la tâche 1.
- Produit : `verre(o)` où `o = {couches:[String], objet:{nom:String, rho:Number}|null}` et renvoie une chaîne SVG ; `const FLOTTER` (8 questions).

- [ ] **Étape 1 : ajouter le CSS du verre**

Insérer juste avant `/* ---------- reactions ---------- */` :

```css
.fig .verre{fill:none;stroke:var(--ink);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.fig .couchelab{font:700 12px var(--sans);fill:var(--ink)}
.fig .objet{fill:var(--marge);stroke:var(--ink);stroke-width:1.2}
.fig .objetlab{font:700 11px var(--sans);fill:var(--ink)}
```

La couleur de chaque couche arrive par un attribut `fill` posé sur le `<rect>` : ne jamais écrire de règle `.fig .couche{fill:...}`, une règle CSS l'emporterait sur l'attribut et toutes les couches deviendraient de la même couleur.

- [ ] **Étape 2 : écrire le moteur**

Insérer après l'ancre `/* ============ moteurs ============ */`, à la suite de `tableauMetaux` :

```js
/* un becher, ses couches de liquides, et l'objet place par la regle : il flotte
   sur la premiere couche plus dense que lui, sinon il repose au fond */
function verre(o){
  const X=104,W=112,YT=44,YB=188;
  const cs=o.couches.map(liq).sort((a,b)=>a.rho-b.rho);
  const h=(YB-YT)/cs.length;
  let b="";
  cs.forEach((c,i)=>{
    const y=YT+i*h;
    b+=`<rect class="couche" x="${X+3}" y="${y}" width="${W-6}" height="${h}" fill="${c.col}"/>`;
    b+=`<text class="couchelab" x="${X+11}" y="${y+h/2}" dominant-baseline="central">${c.nom} ${fr(c.rho)}</text>`;
  });
  b+=`<path class="verre" d="M ${X} ${YT-22} L ${X} ${YB-10} Q ${X} ${YB} ${X+10} ${YB} L ${X+W-10} ${YB} Q ${X+W} ${YB} ${X+W} ${YB-10} L ${X+W} ${YT-22}"/>`;
  if(o.objet){
    const k=cs.findIndex(c=>c.rho>o.objet.rho);
    const cy=k<0?YB-13:YT+k*h;
    b+=`<circle class="objet" cx="${X+W-26}" cy="${cy}" r="11"/>`;
    b+=`<text class="objetlab" x="${X+W+6}" y="${cy}" dominant-baseline="central">${o.objet.nom} ${fr(o.objet.rho)}</text>`;
  }
  return `<svg viewBox="0 0 320 212" role="img" aria-label="Verre contenant des liquides">${b}</svg>`;
}
```

- [ ] **Étape 3 : écrire les questions**

Insérer après `IDENTIFIER`. Le champ `fig` décrit la figure de la question, `figApres` celle de la révélation.

```js
const FLOTTER=[
  {kind:"qcm",fig:{couches:["Eau"]},q:"À quelle condition un objet flotte-t-il dans un liquide ?",ch:["Si sa masse volumique est plus faible que celle du liquide","S'il pèse moins d'un kilo","S'il est creux"],good:0,rep:"Si sa masse volumique est la plus faible.",
   w:"C'est une comparaison, pas une question de poids : un tronc d'arbre flotte, une bille d'acier coule. Ce qui compte, c'est ρ de l'objet face à ρ du liquide."},
  {kind:"qcm",fig:{couches:["Eau"]},figApres:{couches:["Eau","Huile"]},q:"On verse de l'huile (0,9) dans un verre d'eau (1). Que se passe-t-il ?",ch:["L'huile reste au-dessus de l'eau","L'huile descend au fond","Les deux se mélangent"],good:0,rep:"L'huile reste au-dessus.",
   w:"0,9 contre 1 : à volume égal l'huile est plus légère, donc elle surnage. Et comme les deux ne sont pas miscibles, on voit nettement deux couches."},
  {kind:"qcm",fig:{couches:["Eau"]},figApres:{couches:["Sirop","Eau"]},q:"On verse doucement du sirop (1,3) dans un verre d'eau (1). Où va-t-il ?",ch:["Au fond du verre","À la surface","Il reste au milieu"],good:0,rep:"Au fond du verre.",
   w:"Le sirop est plus dense que l'eau : il plonge. C'est pour cela qu'un sirop versé sans remuer forme une couche colorée au fond du verre."},
  {kind:"qcm",fig:{couches:["Huile","Eau","Sirop"]},figApres:{couches:["Huile","Eau","Sirop"],objet:{nom:"Bille",rho:0.95}},q:"Une bille de masse volumique 0,95 g/cm³ tombe dans ce verre. Où s'arrête-t-elle ?",ch:["Entre l'huile et l'eau","Au fond, dans le sirop","Tout en haut, sur l'huile"],good:0,rep:"Entre l'huile et l'eau.",
   w:"Elle traverse tout ce qui est plus léger qu'elle (l'huile, 0,9) et s'arrête sur le premier liquide plus lourd (l'eau, 1). Chaque objet trouve son étage."},
  {kind:"qcm",fig:{couches:["Eau"],objet:{nom:"Glaçon",rho:0.92}},q:"Pourquoi un glaçon flotte-t-il sur l'eau ?",ch:["L'eau solide (0,92) est moins dense que l'eau liquide (1)","Parce qu'il est froid","Parce qu'il contient de l'air"],good:0,rep:"L'eau solide est moins dense que l'eau liquide.",
   w:"C'est une exception célèbre : en gelant, l'eau <em>augmente</em> de volume, donc sa masse volumique baisse. Presque toutes les autres matières font l'inverse."},
  {kind:"qcm",fig:{couches:["Eau"]},q:"L'acier a une masse volumique de 7,8 g/cm³. Pourquoi un bateau en acier flotte-t-il ?",ch:["Sa coque enferme de l'air : l'ensemble a une masse volumique inférieure à 1","Parce que l'acier flotte","Parce que ses moteurs le soulèvent"],good:0,rep:"Sa coque enferme beaucoup d'air.",
   w:"On ne compare pas l'acier à l'eau, mais le bateau entier à l'eau : coque et air compris, son volume est énorme pour sa masse. Une plaque d'acier pleine, elle, coule."},
  {kind:"num",fig:{couches:["Eau"]},q:"Un cube de 100 cm³ pèse 120 g. <em>Calcule sa masse volumique, en g/cm³.</em>",ans:1.2,unit:"g/cm³",rep:"ρ = 1,2 g/cm³",
   w:"ρ = 120 ÷ 100 = <em>1,2 g/cm³</em>, plus que l'eau : ce cube coule. Le calcul répond à la question avant même de le tremper."},
  {kind:"qcm",fig:{couches:["Eau"]},q:"Le chêne a une masse volumique de 0,7 g/cm³, l'ébène 1,2. Lequel coule dans l'eau ?",ch:["L'ébène","Le chêne","Aucun : le bois flotte toujours"],good:0,rep:"L'ébène.",
   w:"L'ébène est un bois si dense qu'il coule. « Le bois flotte » est une règle de la vie courante, pas une loi : seule la comparaison des masses volumiques tranche."}
];
```

- [ ] **Étape 4 : brancher la manche**

Insérer avant `  /* fin des manches */`, après l'entrée `identifier` :

```js
  flotter:creeManche({panel:"#flotter",game:"flotter",donnees:FLOTTER,
    titre:"Flotter ou couler ?",
    texte:"Huit questions pour comprendre qui surnage et qui plonge. Le verre se remplit après ta réponse.",
    bravo:"Rien à revoir. Formule, mesure, unités, métaux, flottaison : le chapitre est à toi.",
    prep:q=>({...q,annot:q.kind==="num"?"À toi de calculer":"Flotter ou couler",
      fig:verre(q.fig),figApres:q.figApres?verre(q.figApres):null,hyp:q.q})}),
```

- [ ] **Étape 5 : lancer le contrôle**

```bash
node outils/verifie-masse.mjs
```

Attendu : `5 manche(s) contrôlée(s) : le carnet est conforme.`

- [ ] **Étape 6 : vérifier dans le navigateur**

```bash
open masse-volumique.html
```

Onglet « Flotter ou couler » : le verre montre ses couches dans le bon ordre, la plus légère en haut (huile jaune, eau bleue, sirop rose). Sur la question de la bille, la figure ne montre que les trois couches ; après la réponse, la bille rouge apparaît **à la frontière entre l'huile et l'eau**, pas ailleurs. Sur la question du glaçon, l'objet est posé au sommet de l'eau dès l'affichage.

- [ ] **Étape 7 : commiter**

```bash
git add masse-volumique.html
git commit -m "Ajoute la manche Flotter ou couler et son moteur de verre"
```

---

### Tâche 6 : retirer la manche du carnet 1 et ouvrir la carte du carnet 2

**Fichiers :**
- Modifier : `etats-matiere.html`
- Modifier : `physique-chimie.html`

**Interfaces :**
- Consomme : `masse-volumique.html`, livré par les tâches 1 à 5.
- Produit : un carnet 1 à cinq manches, et la carte d'entrée du carnet 2.

- [ ] **Étape 1 : retirer l'onglet, le panneau, les données et la manche**

```bash
python3 - <<'PY'
import re
p = 'etats-matiere.html'
s = open(p, encoding='utf8').read()
s = s.replace('      <button class="tab" role="tab" aria-selected="false" data-panel="masse">Masse volumique</button>\n', '')
s = s.replace('    <section class="panel" id="masse"></section>\n', '')
s = re.sub(r'const MASSE=\[[\s\S]*?\n\];\n\n', '', s)
s = re.sub(r'\n  masse:creeManche\(\{[\s\S]*?\n\};', '\n};', s)
s = s.replace('rep:q.rep,w:q.w})}),\n};', 'rep:q.rep,w:q.w})})\n};')
s = s.replace("<p class=\"sub\">Six entraînements : les trois états, les changements d'état, la courbe de l'eau, les mélanges, la masse volumique.</p>",
              "<p class=\"sub\">Cinq entraînements : les trois états, les changements d'état, les situations de tous les jours, la courbe de l'eau, les mélanges.</p>")
s = s.replace('/* ============ les six manches ============ */', '/* ============ les cinq manches ============ */')
s = s.replace('/* ---------- onglets (deux rangees de trois) ---------- */', '/* ---------- onglets (deux rangees) ---------- */')
s = s.replace('bravo:"Rien à revoir. Dernière manche : la masse volumique.",',
              'bravo:"Rien à revoir. États, changements, courbe et mélanges : le chapitre est à toi. La masse volumique a son propre carnet.",')
open(p, 'w', encoding='utf8').write(s)
PY
grep -n "masse volumique" etats-matiere.html
```

Attendu : aucune ligne. Le mot « masse » seul subsiste dans la manche Mélanges (la conservation de la masse à la dissolution), c'est normal.

- [ ] **Étape 2 : contrôler le carnet 1**

`outils/verifie-masse.mjs` ne contrôle que le carnet 2 ; ici, ce qu'il faut vérifier est que la suppression n'a pas cassé le script du carnet 1.

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('etats-matiere.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];new Function(s);console.log('le script compile');"
```

Attendu : `le script compile`. En cas d'erreur de syntaxe, relire la fin de `const MANCHES={` : c'est la virgule de l'avant-dernière entrée qui traîne.

- [ ] **Étape 3 : ajouter la carte du carnet 2 et corriger celle du carnet 1**

Dans `physique-chimie.html`, retirer la ligne `<li>Masse volumique</li>` de la carte du carnet 1, retirer `, la masse volumique` de son résumé, puis insérer cette carte entre celle du carnet 1 et celle du mémo :

```html
      <a class="card" style="--c:var(--pc)" href="masse-volumique.html">
        <span class="go">&rarr;</span>
        <p class="num">Carnet 2 &middot; mesurer la mati&egrave;re</p>
        <h2>La masse volumique</h2>
        <p>&rho; = m &divide; V, la mesure d'un volume par d&eacute;placement d'eau, les conversions d'unit&eacute;s, l'identification d'un m&eacute;tal, et pourquoi &ccedil;a flotte ou &ccedil;a coule.</p>
        <ul class="modes">
          <li>La formule</li>
          <li>Mesurer</li>
          <li>Les unit&eacute;s</li>
          <li>Identifier</li>
          <li>Flotter ou couler</li>
        </ul>
      </a>
```

- [ ] **Étape 4 : vérifier dans le navigateur**

```bash
open physique-chimie.html
```

Trois cartes : carnet 1 (cinq modes, sans « Masse volumique »), carnet 2 (cinq modes), mémo. Cliquer sur le carnet 1 : la barre affiche cinq onglets, aucun ne parle de masse volumique, et la manche Mélanges se termine par le nouveau mot de fin. Cliquer sur le carnet 2 : il s'ouvre sur « La formule ».

- [ ] **Étape 5 : commiter**

```bash
git add etats-matiere.html physique-chimie.html
git commit -m "Sort la masse volumique du carnet des états et ouvre le carnet 2"
```

---

### Tâche 7 : le troisième onglet du mémo et le contrôle de cohérence

**Fichiers :**
- Modifier : `pc-memo.html`
- Modifier : `outils/coherence.mjs`

**Interfaces :**
- Consomme : `METAUX` et `LIQUIDES` de `masse-volumique.html`.
- Produit : un mémo à trois onglets, et un `coherence.mjs` qui accepte les nombres écrits à la virgule.

- [ ] **Étape 1 : apprendre la virgule au script de cohérence**

Dans `outils/coherence.mjs`, remplacer le corps de la double boucle par :

```js
for (const it of items) {
  for (const c of cles) {
    const brut = it[c];
    const v = norm(brut);
    // un nombre s'ecrit 7.9 en JS et 7,9 dans une fiche : les deux ecritures conviennent
    const variantes = typeof brut === "number" ? [v, v.replace(".", ",")] : [v];
    if (v && !variantes.some(x => texteMemo.includes(x))) {
      console.error(`ABSENT de ${memo} : ${nomTableau}.${c} = « ${it[c]} »`);
      manquants++;
    }
  }
}
```

- [ ] **Étape 2 : vérifier que les contrôles existants passent toujours**

```bash
node outils/coherence.mjs histoire-dates.html DATES d,label histoire-memo.html
node outils/coherence.mjs geo-france.html REGIONS nom,capitale geo-memo.html
node outils/coherence.mjs etats-matiere.html CHG label pc-memo.html
```

Attendu : les trois se terminent par `la fiche est à jour.`

- [ ] **Étape 3 : ajouter le troisième onglet**

Dans `pc-memo.html`, remplacer le bloc `<nav role="tablist">` par :

```html
    <nav role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-panel="etats">États</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="melanges">Mélanges</button>
      <button class="tab" role="tab" aria-selected="false" data-panel="masse">Masse volumique</button>
    </nav>
```

Le sous-titre `<p class="sub">` devient :

```html
    <p class="sub">L'essentiel des chapitres États de la matière et Masse volumique, à relire avant un contrôle.</p>
```

- [ ] **Étape 4 : déplacer et enrichir la section**

Supprimer de la section `#melanges` le groupe `<h2>La masse volumique</h2>` (du `<div class="groupe">` qui le contient jusqu'à son `</div>`, table `valeurs` et bloc « Pourquoi l'huile flotte » compris) ainsi que le bloc `<div class="vs">` contenant `<h3>Masse ou masse volumique ?</h3>`. Puis ajouter, après `</section>` de `#melanges` :

```html
    <section class="panel" id="masse">

      <div class="groupe">
        <h2>La formule</h2>
        <div class="item"><b>&rho; = m &divide; V</b><span class="w">La masse divis&eacute;e par le volume, en g/cm&sup3;. Elle se retourne&nbsp;: m = &rho; &times; V, et V = m &divide; &rho;.</span></div>
        <div class="item"><b>Elle caract&eacute;rise la mati&egrave;re</b><span class="w">Elle ne d&eacute;pend pas de la quantit&eacute;&nbsp;: un litre d'eau et deux litres d'eau ont la m&ecirc;me masse volumique, 1 g/cm&sup3;.</span></div>
      </div>

      <div class="groupe">
        <h2>Mesurer</h2>
        <div class="item"><b>Un liquide</b><span class="w">On verse un volume connu dans une &eacute;prouvette gradu&eacute;e pr&eacute;alablement tar&eacute;e, et on p&egrave;se. On lit le volume au bas du m&eacute;nisque, l'&oelig;il bien en face.</span></div>
        <div class="item"><b>Un solide r&eacute;gulier</b><span class="w">On calcule son volume&nbsp;: pour un pav&eacute;, longueur &times; largeur &times; hauteur.</span></div>
        <div class="item"><b>Un solide quelconque</b><span class="w">Par d&eacute;placement d'eau&nbsp;: on note le niveau avant, on plonge le solide enti&egrave;rement, on note le niveau apr&egrave;s. La diff&eacute;rence est son volume.</span></div>
      </div>

      <div class="groupe">
        <h2>Les unit&eacute;s</h2>
        <div class="item"><b>1 mL = 1 cm&sup3;</b><span class="w">Et 1 L = 1 dm&sup3; = 1000 cm&sup3;. Un centilitre vaut 10 millilitres.</span></div>
        <div class="item"><b>g/cm&sup3; et kg/m&sup3;</b><span class="w">On multiplie par 1000 pour passer des g/cm&sup3; aux kg/m&sup3;&nbsp;: 2,7 g/cm&sup3; = 2700 kg/m&sup3;. Le kg/m&sup3; est l'unit&eacute; du syst&egrave;me international.</span></div>
      </div>

      <div class="groupe">
        <h2>Les m&eacute;taux</h2>
        <table class="valeurs">
          <tr><td>Aluminium</td><td>2,7 g/cm&sup3;</td></tr>
          <tr><td>Zinc</td><td>7,1 g/cm&sup3;</td></tr>
          <tr><td>Fer</td><td>7,9 g/cm&sup3;</td></tr>
          <tr><td>Laiton</td><td>8,2 g/cm&sup3;</td></tr>
          <tr><td>Cuivre</td><td>8,9 g/cm&sup3;</td></tr>
          <tr><td>Argent</td><td>10,5 g/cm&sup3;</td></tr>
          <tr><td>Or</td><td>19,3 g/cm&sup3;</td></tr>
        </table>
      </div>

      <div class="groupe">
        <h2>Les liquides</h2>
        <table class="valeurs">
          <tr><td>&Eacute;thanol</td><td>0,8 g/cm&sup3;</td></tr>
          <tr><td>Huile</td><td>0,9 g/cm&sup3;</td></tr>
          <tr><td>Eau</td><td>1 g/cm&sup3;</td></tr>
          <tr><td>Sirop</td><td>1,3 g/cm&sup3;</td></tr>
        </table>
        <div class="item" style="margin-top:10px"><b>Flotter ou couler</b><span class="w">Un objet flotte si sa masse volumique est plus faible que celle du liquide. La gla&ccedil;on fait exception&nbsp;: l'eau solide (0,92) est moins dense que l'eau liquide (1).</span></div>
      </div>

      <p class="section-title">Ne confonds pas</p>

      <div class="vs">
        <h3>Masse ou masse volumique&nbsp;?</h3>
        <p>La <b>masse</b> d&eacute;pend de la quantit&eacute;&nbsp;: deux litres d'eau p&egrave;sent deux fois plus qu'un. La <b>masse volumique</b> caract&eacute;rise la mati&egrave;re&nbsp;: elle vaut 1 g/cm&sup3; pour l'eau, quelle que soit la quantit&eacute;.</p>
      </div>

      <div class="vs">
        <h3>0,69 g/mL, combien au litre&nbsp;?</h3>
        <p>Un litre vaut <b>1000</b> mL, pas 100&nbsp;: 0,69 &times; 1000 = <b>690 g</b>. C'est l'erreur la plus fr&eacute;quente du chapitre.</p>
      </div>

    </section>
```

- [ ] **Étape 5 : lancer les contrôles de cohérence du nouveau carnet**

```bash
node outils/coherence.mjs masse-volumique.html METAUX nom,rho pc-memo.html
node outils/coherence.mjs masse-volumique.html LIQUIDES nom,rho pc-memo.html
```

Attendu : les deux se terminent par `la fiche est à jour.` Si une valeur est signalée absente, c'est que la table du mémo et celle du carnet ont divergé : c'est exactement ce que le script est là pour attraper, corriger le mémo.

- [ ] **Étape 6 : vérifier dans le navigateur**

```bash
open pc-memo.html
```

Trois onglets qui tiennent sur une seule rangée, même sur un écran de 360 px. L'onglet « Masse volumique » affiche les cinq groupes et les deux encadrés « Ne confonds pas ». L'onglet « Mélanges » ne parle plus de masse volumique.

- [ ] **Étape 7 : commiter**

```bash
git add pc-memo.html outils/coherence.mjs
git commit -m "Ajoute l'onglet Masse volumique au mémo et la virgule au contrôle de cohérence"
```

---

### Tâche 8 : mettre la documentation à jour

**Fichiers :**
- Modifier : `CLAUDE.md`

**Interfaces :**
- Consomme : tout ce qui précède.
- Produit : rien de nouveau, la documentation reflète le dépôt.

- [ ] **Étape 1 : décrire la nouvelle page**

Dans la liste des pages de `CLAUDE.md`, après l'entrée `etats-matiere.html`, ajouter :

```markdown
- `masse-volumique.html` : deuxième carnet de physique-chimie, cinq manches sur la masse volumique (La formule, Mesurer, Les unités, Identifier, Flotter ou couler). Jumeau d'`etats-matiere.html` : même CSS, même constructeur `creeManche`, mêmes helpers. Deux moteurs de figures lui sont propres : `eprouvette(o)` (une ou deux éprouvettes graduées, solide immergé, loupe sur le ménisque) et `verre(o)` (bécher à couches de liquides). Dans `verre`, **l'objet n'est jamais positionné à la main** : le moteur le pose au-dessus de la première couche plus dense que lui, ce qui rend une figure physiquement fausse impossible à produire. Les tables `METAUX` et `LIQUIDES` sont la source unique des valeurs, pour les figures comme pour le contrôle de cohérence.
```

Dans l'entrée `etats-matiere.html`, remplacer « en six manches » par « en cinq manches » et retirer « Masse volumique (ρ = m ÷ V, calculs en saisie) » de l'énumération, ainsi que la phrase « La barre passe en deux rangées de trois onglets. » qui devient « La barre passe en deux rangées d'onglets. »

- [ ] **Étape 2 : déclarer la quatrième famille de jumeaux**

Dans la section « Architecture des carnets », à la liste des familles, ajouter :

```markdown
- Physique-Chimie : `etats-matiere.html` et `masse-volumique.html` (constructeur `creeManche` et helpers communs).
```

Et retirer `etats-matiere.html` de la phrase qui le présente comme seul de son espèce, qui devient : « `thales.html` (moteurs `figSVG` et `figDuoSVG`) reste seul de son espèce. »

- [ ] **Étape 3 : compléter le suivi et les commandes de contrôle**

Dans le paragraphe sur `logResult`, ajouter `"masse-volumique"` à la liste des valeurs de `page`, et remplacer « identique dans les huit carnets » par « identique dans les neuf carnets ».

Dans le bloc de commandes de contrôle, ajouter :

```bash
node outils/coherence.mjs masse-volumique.html METAUX nom,rho pc-memo.html
node outils/coherence.mjs masse-volumique.html LIQUIDES nom,rho pc-memo.html
node outils/verifie-masse.mjs
```

Et compléter la phrase qui suit le bloc : le script `outils/verifie-masse.mjs` contrôle `masse-volumique.html` (compilation du script, forme de chaque question, tables triées) et doit se terminer par `le carnet est conforme`.

- [ ] **Étape 4 : passer toute la batterie de contrôles**

```bash
node outils/coherence.mjs histoire-dates.html DATES d,label histoire-memo.html
node outils/coherence.mjs histoire-personnages.html PERSONNAGES nom,annees,role histoire-memo.html
node outils/coherence.mjs geo-france.html REGIONS nom,capitale geo-memo.html
node outils/coherence.mjs geo-france.html RELIEFS nom geo-memo.html
node outils/coherence.mjs geo-france.html FLEUVES nom geo-memo.html
node outils/coherence.mjs geo-france.html MERS nom geo-memo.html
node outils/coherence.mjs geo-france.html DROM nom,chef geo-memo.html
node outils/coherence.mjs geo-europe.html PAYS nom geo-memo.html
node outils/coherence.mjs etats-matiere.html CHG label pc-memo.html
node outils/coherence.mjs masse-volumique.html METAUX nom,rho pc-memo.html
node outils/coherence.mjs masse-volumique.html LIQUIDES nom,rho pc-memo.html
node outils/verifie-banque.mjs
node outils/verifie-masse.mjs
```

Attendu : chaque ligne de cohérence se termine par `la fiche est à jour.`, `verifie-banque.mjs` par `La banque est conforme`, et `verifie-masse.mjs` par `5 manche(s) contrôlée(s) : le carnet est conforme.`

- [ ] **Étape 5 : parcours complet dans le navigateur**

```bash
open index.html
```

Accueil → Physique-Chimie → carnet 2 : jouer une manche entière de chacun des cinq onglets, sur une fenêtre étroite (360 px). Vérifier le bouton 🏠, les confettis, le message de série au bout de trois bonnes réponses, le bilan et son bouton « Rejouer ».

- [ ] **Étape 6 : commiter**

```bash
git add CLAUDE.md
git commit -m "Documente le carnet Masse volumique et ses contrôles"
```
