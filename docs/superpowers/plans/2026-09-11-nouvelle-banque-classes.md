# Nouvelle banque de phrases des classes grammaticales : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Remplacer intégralement les trois banques de données (`QUIZ`, `CAM`, `MEMO`) de `classes-grammaticales.html` par du contenu neuf, un cran au-dessus en difficulté, sans toucher au code.

**Architecture :** Un script de contrôle `outils/verifie-banque.mjs` (même technique d'extraction que `outils/coherence.mjs`) vérifie effectifs, cibles `[[...]]`, classes et caméléons ; il échoue sur la banque actuelle, puis passe au vert au fil des remplacements. Les trois tableaux sont remplacés l'un après l'autre, un commit par tableau.

**Tech Stack :** HTML/JS inline (aucun build), Node pour le script de contrôle.

**Spec :** `docs/superpowers/specs/2026-09-11-nouvelle-banque-classes-design.md`

## Global Constraints

- Tout le contenu visible et les messages de commit sont en français.
- Apostrophes droites (`'`) dans les chaînes JS, comme dans le fichier actuel ; aucune entité HTML.
- Une seule cible `[[...]]` par phrase (`phraseHTML` ne remplace que la première).
- Chaque `c` est un id de `CLASSES` : nom, verbe, adjectif, determinant, pronom, adverbe, preposition, conjonction, interjection.
- Aucun changement de code : ni helpers, ni CSS, ni tirage, ni `logResult`. `fonctions-grammaticales.html` n'est pas touché.
- Jamais de tiret cadratin dans le contenu rédigé.

---

### Task 1 : Script de contrôle `outils/verifie-banque.mjs`

**Files:**
- Create: `outils/verifie-banque.mjs`

**Interfaces:**
- Consumes: `classes-grammaticales.html` (tableaux `QUIZ`, `CAM`, `MEMO` extraits par regex, comme dans `outils/coherence.mjs`).
- Produces: commande `node outils/verifie-banque.mjs`, exit 0 et message « La banque est conforme : 54 phrases, 13 caméléons, 9 exemples. » quand tout est bon, exit 1 sinon. Les tâches 2 à 4 s'appuient dessus.

- [ ] **Step 1 : Écrire le script**

Créer `outils/verifie-banque.mjs` avec ce contenu exact :

```js
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
```

- [ ] **Step 2 : Le lancer contre la banque actuelle, il doit échouer**

Run: `node outils/verifie-banque.mjs`
Expected: exit 1, avec au moins « QUIZ compte 50 phrases au lieu de 54 », des effectifs par classe faux (preposition 5, conjonction 5, interjection 4), 13 lignes « CAM : ... figurait déjà dans l'ancienne banque » et 9 lignes « MEMO : ... reprend l'ancien exemple ».

- [ ] **Step 3 : Commit**

```bash
git add outils/verifie-banque.mjs
git commit -m "Ajoute le script de contrôle de la banque des classes grammaticales"
```

---

### Task 2 : Remplacer `QUIZ` (54 phrases neuves)

**Files:**
- Modify: `classes-grammaticales.html` (bloc `const QUIZ = [...];`, lignes 296-347 avant modification)

**Interfaces:**
- Consumes: `node outils/verifie-banque.mjs` (Task 1).
- Produces: tableau `QUIZ` de 54 items `{s, c, w}`, consommé tel quel par les manches En contexte et Cartes.

- [ ] **Step 1 : Remplacer le bloc `const QUIZ = [...];` par celui-ci, à l'identique**

```js
const QUIZ = [
  {s:"Nous avons pris le [[goûter]] dans la cuisine.", c:"nom", w:"Précédé d'un déterminant, cet infinitif est devenu un nom."},
  {s:"Elle a rendu son [[devoir]] en retard.", c:"nom", w:"Après le possessif son, devoir n'est plus un verbe : c'est un nom."},
  {s:"Le [[pouvoir]] use ceux qui l'exercent.", c:"nom", w:"Un infinitif précédé d'un déterminant devient un nom."},
  {s:"Une longue [[marche]] nous attendait.", c:"nom", w:"Déterminant devant, adjectif accordé : c'est le nom, pas le verbe marcher."},
  {s:"Son [[départ]] a laissé un grand vide.", c:"nom", w:"Nom abstrait : il désigne une action mais ne se conjugue pas."},
  {s:"La [[douceur]] de sa voix m'a calmée.", c:"nom", w:"Nom formé sur l'adjectif douce : il désigne une qualité."},
  {s:"Nous avons [[fini]] avant la sonnerie.", c:"verbe", w:"Participe passé avec l'auxiliaire avoir : il fait partie du verbe finir au passé composé."},
  {s:"[[Écoute]] bien la consigne.", c:"verbe", w:"Impératif : on peut le conjuguer. Avec un déterminant, une écoute serait un nom."},
  {s:"Devant nos questions, elle [[demeure]] silencieuse.", c:"verbe", w:"Verbe d'état : il relie le sujet à l'attribut silencieuse. Une demeure serait un nom."},
  {s:"Il [[neige]] depuis ce matin.", c:"verbe", w:"Verbe impersonnel : il se conjugue, il neigeait. Ce n'est pas ici le nom la neige."},
  {s:"Tu [[souris]] chaque fois qu'il parle.", c:"verbe", w:"Conjugué à la 2e personne : ce n'est pas le nom une souris."},
  {s:"Le vent [[souffle]] sur la falaise.", c:"verbe", w:"On peut changer le temps : le vent soufflait. Un souffle serait un nom."},
  {s:"Il poussa la porte [[fermée]] du garage.", c:"adjectif", w:"Participe passé employé comme adjectif : sans auxiliaire, il s'accorde avec porte."},
  {s:"Cette histoire [[captivante]] nous a tenus éveillés.", c:"adjectif", w:"Participe présent devenu adjectif : il s'accorde, captivante au féminin."},
  {s:"Les randonneurs, [[épuisés]], firent une pause.", c:"adjectif", w:"Apposé entre virgules, il qualifie randonneurs et s'accorde avec lui."},
  {s:"La rue restait [[déserte]] à cette heure.", c:"adjectif", w:"Attribut du sujet après le verbe d'état rester."},
  {s:"Je trouve ce film [[ennuyeux]].", c:"adjectif", w:"Attribut du COD ce film : il le qualifie à travers le verbe trouver."},
  {s:"L'eau [[glacée]] du torrent coupait le souffle.", c:"adjectif", w:"Participe passé employé comme adjectif, accordé avec eau."},
  {s:"[[Leur]] maison donne sur la mer.", c:"determinant", w:"Devant un nom, leur est un déterminant possessif. Devant un verbe, ce serait un pronom."},
  {s:"[[Tout]] le quartier était en fête.", c:"determinant", w:"Suivi de le + nom : tout est ici un déterminant."},
  {s:"[[Chaque]] matin, elle relit ses notes.", c:"determinant", w:"Déterminant distributif, toujours suivi d'un nom singulier."},
  {s:"[[Certains]] élèves préfèrent l'oral.", c:"determinant", w:"Devant un nom, certains est un déterminant indéfini. Seul, ce serait un pronom."},
  {s:"[[Plusieurs]] réponses étaient possibles.", c:"determinant", w:"Déterminant indéfini devant le nom réponses."},
  {s:"[[Quel]] beau but il a marqué !", c:"determinant", w:"Déterminant exclamatif, accolé au groupe nominal beau but."},
  {s:"Des cerises ? J'[[en]] ai cueilli un plein panier.", c:"pronom", w:"En remplace des cerises : pronom. Devant un nom, en serait une préposition."},
  {s:"Elle [[y]] pense encore.", c:"pronom", w:"Y remplace un complément introduit par à : pronom adverbial."},
  {s:"Le voisin [[dont]] je te parlais a déménagé.", c:"pronom", w:"Pronom relatif : il reprend le voisin et introduit la relative."},
  {s:"Le prof [[nous]] a félicités.", c:"pronom", w:"Pronom personnel complément, placé devant le verbe."},
  {s:"[[Chacun]] rangea ses affaires.", c:"pronom", w:"Pronom indéfini sujet : aucun nom ne le suit."},
  {s:"Tu me crois ? Je [[le]] jure.", c:"pronom", w:"Le neutre : il reprend toute l'idée précédente, pas un simple nom."},
  {s:"Elle était [[tout]] étonnée de ce succès.", c:"adverbe", w:"Tout modifie l'adjectif étonnée : il signifie complètement, c'est un adverbe."},
  {s:"Parle [[moins]] fort en classe.", c:"adverbe", w:"Adverbe de degré : il modifie l'adverbe fort."},
  {s:"Ils sont arrivés [[ensemble]].", c:"adverbe", w:"Invariable, il précise la manière d'arriver."},
  {s:"Les spectateurs écoutaient [[debout]].", c:"adverbe", w:"Invariable même avec un sujet pluriel : c'est un adverbe, pas un adjectif."},
  {s:"[[Autrefois]], un moulin tournait ici.", c:"adverbe", w:"Adverbe de temps placé en tête de phrase."},
  {s:"Ce problème est [[vraiment]] difficile.", c:"adverbe", w:"Formé sur l'adjectif vrai : quand l'adjectif finit par une voyelle, -ment s'ajoute directement. Il modifie l'adjectif difficile."},
  {s:"[[Dès]] l'aube, les pêcheurs partent.", c:"preposition", w:"Elle introduit le groupe nominal l'aube. Ne la confonds pas avec des, déterminant."},
  {s:"Il a couru [[malgré]] la pluie.", c:"preposition", w:"Invariable, elle introduit la pluie et exprime l'opposition."},
  {s:"[[Parmi]] les copies, une seule était parfaite.", c:"preposition", w:"Elle introduit le groupe les copies."},
  {s:"Elle a révisé [[durant]] tout le trajet.", c:"preposition", w:"Elle introduit le groupe nominal tout le trajet."},
  {s:"Il s'est montré patient [[envers]] son petit frère.", c:"preposition", w:"Elle introduit son petit frère : on ne peut pas la supprimer."},
  {s:"Le chat a filé [[chez]] la voisine.", c:"preposition", w:"Chez introduit toujours un nom ou un pronom : préposition."},
  {s:"[[Puisque]] tu es là, aide-moi.", c:"conjonction", w:"Conjonction de subordination : elle exprime une cause connue de tous."},
  {s:"[[Lorsque]] la nuit tombe, le phare s'allume.", c:"conjonction", w:"Conjonction de subordination de temps, équivalente à quand."},
  {s:"Il devait venir, [[or]] personne ne l'a vu.", c:"conjonction", w:"Conjonction de coordination : mais, ou, et, donc, or, ni, car."},
  {s:"Elle ne mange [[ni]] viande ni poisson.", c:"conjonction", w:"Conjonction de coordination, ici appuyée sur ne."},
  {s:"[[Tandis que]] la ville dort, les boulangers travaillent.", c:"conjonction", w:"Locution conjonctive de subordination : elle marque le temps ou l'opposition."},
  {s:"Prends une écharpe, [[car]] le vent est glacial.", c:"conjonction", w:"Conjonction de coordination : elle introduit la justification. Un car serait un nom."},
  {s:"[[Ouf]] ! Le contrôle est terminé.", c:"interjection", w:"Elle exprime le soulagement, hors de la construction de la phrase."},
  {s:"[[Eh bien]], je ne m'y attendais pas.", c:"interjection", w:"Locution interjective : elle marque la surprise et peut se retirer sans casser la phrase."},
  {s:"[[Tiens]], tu as changé de coiffure !", c:"interjection", w:"Figée dans l'exclamation, elle ne se conjugue plus : ce n'est plus le verbe tenir."},
  {s:"[[Allons]], ne te décourage pas.", c:"interjection", w:"Figée en tête de phrase pour encourager, elle a perdu sa valeur de verbe."},
  {s:"[[Bof]], le film était moyen.", c:"interjection", w:"Elle exprime l'indifférence et ne joue aucun rôle grammatical."},
  {s:"[[Hé]] ! Attends-moi !", c:"interjection", w:"Elle sert à interpeller, isolée par le point d'exclamation."}
];
```

- [ ] **Step 2 : Vérifier**

Run: `node outils/verifie-banque.mjs`
Expected: exit 1. Plus aucune erreur QUIZ ; il reste exactement les 13 erreurs « CAM : ... figurait déjà dans l'ancienne banque » et les 9 erreurs « MEMO : ... reprend l'ancien exemple ».

- [ ] **Step 3 : Commit**

```bash
git add classes-grammaticales.html
git commit -m "Remplace les phrases En contexte par 54 cas nouveaux plus exigeants"
```

---

### Task 3 : Remplacer `CAM` (13 caméléons neufs)

**Files:**
- Modify: `classes-grammaticales.html` (bloc `const CAM = [...];`, juste sous `QUIZ`)

**Interfaces:**
- Consumes: `node outils/verifie-banque.mjs` (Task 1).
- Produces: tableau `CAM` de 13 items `{w, a:{s,c}, b:{s,c}, t}`, consommé tel quel par la manche Caméléons.

- [ ] **Step 1 : Remplacer le bloc `const CAM = [...];` par celui-ci, à l'identique**

```js
const CAM = [
  {w:"tout", a:{s:"[[Tout]] le village a participé.", c:"determinant"}, b:{s:"Elle était [[tout]] émue.", c:"adverbe"},
   t:"Devant le + nom, tout détermine. Devant un adjectif, il signifie complètement : adverbe."},
  {w:"leur", a:{s:"[[Leur]] chien aboie la nuit.", c:"determinant"}, b:{s:"Je [[leur]] ai prêté mes notes.", c:"pronom"},
   t:"Devant un nom, leur accompagne : déterminant. Devant un verbe, il remplace : pronom, et il ne prend jamais de s."},
  {w:"si", a:{s:"[[Si]] tu viens, préviens-moi.", c:"conjonction"}, b:{s:"Le café était [[si]] chaud qu'il m'a brûlé.", c:"adverbe"},
   t:"S'il introduit une condition, c'est une conjonction. S'il renforce un adjectif, c'est un adverbe d'intensité."},
  {w:"en", a:{s:"Elle voyage [[en]] train.", c:"preposition"}, b:{s:"Des fraises ? J'[[en]] reprendrai.", c:"pronom"},
   t:"Devant un nom qu'il introduit, en est une préposition. Devant un verbe, il remplace un complément : pronom."},
  {w:"or", a:{s:"Il devait pleuvoir, [[or]] le ciel resta bleu.", c:"conjonction"}, b:{s:"Elle porte une bague en [[or]] blanc.", c:"nom"},
   t:"Entre deux propositions, or coordonne. Après la préposition en, c'est le métal : un nom."},
  {w:"plus", a:{s:"Il ne ronfle [[plus]].", c:"adverbe"}, b:{s:"Ce stage est un vrai [[plus]] sur un CV.", c:"nom"},
   t:"Avec ne, plus est l'adverbe de négation. Précédé de un, il est devenu un nom."},
  {w:"devoir", a:{s:"Tu vas [[devoir]] recommencer.", c:"verbe"}, b:{s:"Le [[devoir]] de maths est noté.", c:"nom"},
   t:"Après aller, l'infinitif reste un verbe. Après un déterminant, il est devenu un nom."},
  {w:"sourire", a:{s:"Un [[sourire]] éclaira son visage.", c:"nom"}, b:{s:"Ce clown me fait toujours [[sourire]].", c:"verbe"},
   t:"Précédé de un, c'est un nom. Après faire, l'infinitif garde sa valeur de verbe."},
  {w:"derrière", a:{s:"Le ballon a roulé [[derrière]] le muret.", c:"preposition"}, b:{s:"Les retardataires suivaient loin [[derrière]].", c:"adverbe"},
   t:"Suivi d'un groupe nominal, il introduit : préposition. Employé seul, il reste adverbe."},
  {w:"porte", a:{s:"La [[porte]] du gymnase grince.", c:"nom"}, b:{s:"Elle [[porte]] un carton trop lourd.", c:"verbe"},
   t:"Après un déterminant, c'est un nom. Si on peut changer le temps, elle portait, c'est un verbe."},
  {w:"marche", a:{s:"Attention à la première [[marche]] !", c:"nom"}, b:{s:"Il [[marche]] une heure chaque soir.", c:"verbe"},
   t:"Après un déterminant et un adjectif, c'est un nom. Conjugable, il marchait : c'est un verbe."},
  {w:"entre", a:{s:"Le stylo a glissé [[entre]] les pages.", c:"preposition"}, b:{s:"Le train [[entre]] en gare.", c:"verbe"},
   t:"S'il introduit un groupe nominal sans se conjuguer, préposition. S'il vient du verbe entrer, il entrait, c'est un verbe."},
  {w:"boucher", a:{s:"Le [[boucher]] prépare un rôti.", c:"nom"}, b:{s:"Des feuilles finissent par [[boucher]] la gouttière.", c:"verbe"},
   t:"Avec un déterminant, c'est le métier : un nom. Après par, l'infinitif est un verbe."}
];
```

- [ ] **Step 2 : Vérifier**

Run: `node outils/verifie-banque.mjs`
Expected: exit 1. Plus aucune erreur QUIZ ni CAM ; il reste exactement les 9 erreurs « MEMO : ... reprend l'ancien exemple ».

- [ ] **Step 3 : Commit**

```bash
git add classes-grammaticales.html
git commit -m "Remplace les treize caméléons par de nouveaux mots à double vie"
```

---

### Task 4 : Remplacer `MEMO`, contrôle final et documentation

**Files:**
- Modify: `classes-grammaticales.html` (bloc `const MEMO = [...];`, juste sous `CAM`)
- Modify: `CLAUDE.md` (mention du script de contrôle)

**Interfaces:**
- Consumes: `node outils/verifie-banque.mjs` (Task 1).
- Produces: tableau `MEMO` de 9 items `{s, c}`, un par classe, consommé par la manche Mémo ; banque complète validée.

- [ ] **Step 1 : Remplacer le bloc `const MEMO = [...];` par celui-ci, à l'identique**

```js
const MEMO = [
  {s:"Une [[averse]] soudaine", c:"nom"},
  {s:"Le vent [[faiblit]]", c:"verbe"},
  {s:"Une odeur [[sucrée]]", c:"adjectif"},
  {s:"[[Cette]] semaine", c:"determinant"},
  {s:"Je [[lui]] réponds", c:"pronom"},
  {s:"Il pleut [[beaucoup]]", c:"adverbe"},
  {s:"[[Depuis]] hier", c:"preposition"},
  {s:"Lire [[ou]] dormir", c:"conjonction"},
  {s:"[[Hop]] !", c:"interjection"}
];
```

- [ ] **Step 2 : Contrôle final**

Run: `node outils/verifie-banque.mjs`
Expected: exit 0, « La banque est conforme : 54 phrases, 13 caméléons, 9 exemples. »

- [ ] **Step 3 : Vérification navigateur**

Run: `open classes-grammaticales.html`
Jouer quelques questions de chaque manche (En contexte, Caméléons, Mémo, Cartes) : phrases neuves, mot cible souligné, verdicts et explications affichés.

- [ ] **Step 4 : Documenter le script dans `CLAUDE.md`**

Dans la section qui liste les contrôles par script (celle des appels `node outils/coherence.mjs`), ajouter à la fin du bloc de commandes :

```bash
node outils/verifie-banque.mjs
```

et, après le paragraphe qui suit le bloc, cette phrase : « Le script `outils/verifie-banque.mjs` contrôle quant à lui la banque de `classes-grammaticales.html` (effectifs 54/13/9, cibles `[[...]]`, classes valides, caméléons cohérents) et doit se terminer par `La banque est conforme`. »

- [ ] **Step 5 : Commit**

```bash
git add classes-grammaticales.html CLAUDE.md
git commit -m "Renouvelle le memory et documente le contrôle de la banque"
```
