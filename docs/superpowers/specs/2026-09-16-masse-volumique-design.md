# La masse volumique, deuxième carnet de Physique-Chimie

Date : 2026-09-16. Statut : validé.
Références : SchoolMouv 3e, leçon « La masse volumique » ; l'activité du GRD Physique-Chimie de Lyon (`3e_la_masse_volumique_-_activite.pdf`, académie de Lyon, libre d'accès), dont la progression inspire le carnet ; PCCL 3e pour les pièges d'élèves.

## Objet

La masse volumique n'est aujourd'hui qu'une manche de huit questions dans `etats-matiere.html`. Elle couvre la formule et quatre calculs, mais laisse de côté deux choses qui tombent en contrôle : la mesure d'un volume par déplacement d'eau et les conversions d'unités. Elle devient un carnet à part entière, en cinq manches, et disparaît du carnet 1.

Un sujet, un carnet : aucune question n'existe en double, et la règle de report vers `pc-memo.html` reste simple.

## Pages et navigation

- `masse-volumique.html` : le nouveau carnet, accent `--pc`, bouton 🏠 vers `physique-chimie.html`, cinq onglets sur deux rangées (3 + 2). Jumeau d'`etats-matiere.html` : même CSS, même constructeur `creeManche`, mêmes confettis, série et bilans.
- `etats-matiere.html` : passe à cinq manches. Retrait de l'onglet « Masse volumique », du tableau `MASSE`, de l'entrée `masse:` du dispatch. Le mot de fin de la manche Mélanges, qui annonce « Dernière manche : la masse volumique », devient un mot de fin de carnet. La barre d'onglets repasse à 3 + 2.
- `physique-chimie.html` : nouvelle carte « Carnet 2 · mesurer la matière » listant les cinq modes ; la carte du carnet 1 perd « Masse volumique » de sa liste de modes et de son résumé.
- `pc-memo.html` : passe à trois onglets. « États et changements » inchangé, « Mélanges et solutions » amputé de sa section masse volumique, et un nouvel onglet « Masse volumique » qui la reprend enrichie : la formule et ses trois formes, le tableau des sept métaux et des quatre liquides, les conversions, la méthode de mesure par déplacement d'eau, la règle de flottaison. Le piège « Masse ou masse volumique ? » suit dans le nouvel onglet.

## Les cinq manches

Environ huit questions chacune, mélange de QCM et de saisie numérique (`kind:"qcm"` ou `"num"`), sur le modèle de la manche « La courbe » du carnet 1.

1. **La formule** (`#formule`, sans figure) : le socle, repris de six des huit questions actuelles (les deux autres partent dans Identifier et Flotter). ρ = m ÷ V en QCM, calculer ρ du fer (79 g pour 10 cm³), la masse de 250 cm³ d'eau, la masse de 200 cm³ d'huile, le volume de 158 g de fer, la masse d'un litre d'air (≈ 1,3 g). Deux ajouts : une QCM sur ce que ρ caractérise (la matière, pas la quantité) et un calcul m = ρ × V sur un métal de `METAUX`.
2. **Mesurer** (`#mesurer`, moteur `eprouvette`) : l'instrument (éprouvette graduée, ni thermomètre ni balance), la lecture au bas du ménisque, le rôle de la tare. Puis le déplacement d'eau : deux éprouvettes dessinées, 62 mL puis 76 mL, donc V = 14 cm³ ; la question suivante donne la masse du même solide, 37,8 g, et demande ρ. Un pavé régulier se mesure autrement (2 × 3 × 5 cm), un liquide se pèse dans une éprouvette tarée (100 mL, 80 g). Une QCM sur la condition d'immersion complète.
3. **Les unités** (`#unites`, sans figure) : 1 mL = 1 cm³, 1 L = 1 dm³ = 1000 cm³, cL vers mL. Les deux conversions qui comptent, 2,7 g/cm³ = 2700 kg/m³ et 1000 kg/m³ = 1 g/cm³. Le piège de PCCL en QCM : 0,69 g/mL font 690 g/L, pas 69. Un calcul mixte, la masse de 1,5 L d'huile. Une QCM sur l'unité du système international (kg/m³).
4. **Identifier** (`#identifier`, figure : le tableau `METAUX` rendu en HTML, pas en SVG, et affiché pendant toute la manche) : on calcule pour reconnaître. Le bijou de 54 g et 20 cm³ est en aluminium, pas en argent. La pièce dorée à 8,2 g/cm³ est en laiton, pas en or. Un cylindre à 8,9 est en cuivre. Et une question qui sort du tableau : un objet qui flotte sur l'eau n'est aucun de ces métaux.
5. **Flotter ou couler** (`#flotter`, moteur `verre`) : la règle (un objet flotte si sa masse volumique est plus faible que celle du liquide), l'huile qui surnage, le sirop qui tombe au fond, la colonne à trois couches où placer un objet de 0,95. Le glaçon comme exception célèbre (l'eau solide, 0,92, est moins dense que l'eau liquide). Le bateau en acier, dont on compare le volume total, coque et air compris.

## Moteurs SVG

Deux fonctions dédiées, dans le fichier, même format que les moteurs existants (viewBox 320 × 212).

- `eprouvette(o)` : une ou deux éprouvettes graduées côte à côte. Chaque tube porte son niveau de liquide, des graduations chiffrées, une étiquette sous le tube (V₁, V₂), et éventuellement le solide immergé posé au fond. Une option dessine le détail agrandi du ménisque, pour la question sur la lecture.
- `verre(o)` : un verre contenant une à trois couches de liquides nommées et colorées, et éventuellement un objet. **L'objet n'est pas placé à la main, il est placé par la règle** : le moteur reçoit sa masse volumique et celles des couches, et le pose au-dessus de la première couche plus dense que lui. Une figure physiquement fausse devient impossible à produire. La révélation (`figApres`) fait apparaître l'objet à sa place.

## Données

Deux tableaux en tête du script, source unique pour les figures, les explications et le contrôle de cohérence :

- `METAUX` : fer 7,9 · cuivre 8,9 · zinc 7,1 · aluminium 2,7 · laiton 8,2 · argent 10,5 · or 19,3 (en g/cm³).
- `LIQUIDES` : éthanol 0,8 · huile 0,9 · eau 1 · sirop 1,3 (en g/cm³).

## Gamification et suivi

Identiques aux autres carnets : confettis, série, `CHEERS`/`OOPS` aux couleurs de la chimie, bilan avec les erreurs à revoir. `logResult` est appelé en fin de chaque manche avec `page:"masse-volumique"` et `game` valant `formule`, `mesurer`, `unites`, `identifier` ou `flotter`. Le helper `appareil()` est recopié à l'identique depuis les autres carnets.

La tolérance de saisie reste celle de `creeManche` (±0,011), qui convient à toutes les réponses attendues, entières ou à une décimale.

## Contrôle de cohérence

Deux commandes s'ajoutent au bloc de `CLAUDE.md` :

```bash
node outils/coherence.mjs masse-volumique.html METAUX nom,rho pc-memo.html
node outils/coherence.mjs masse-volumique.html LIQUIDES nom,rho pc-memo.html
```

Elles supposent une retouche d'`outils/coherence.mjs` : le script compare aujourd'hui `7.9` au texte de la fiche, qui écrit `7,9`, et signalerait une absence à chaque ligne. Quand le champ contrôlé est un nombre, il acceptera les deux écritures, la décimale à point et la décimale à virgule. Cinq lignes, utiles à tous les carnets scientifiques à venir.

## Retouches de CLAUDE.md

- `masse-volumique.html` décrit dans la liste des pages ; `etats-matiere.html` redescendu à cinq manches.
- Quatrième famille de fichiers jumeaux : Physique-Chimie, `etats-matiere.html` et `masse-volumique.html`, qui partagent `creeManche` et les helpers. La règle de report à la main s'y applique.
- `"masse-volumique"` ajouté à la liste des valeurs de `page` dans `logResult`.
- Les deux nouvelles commandes de cohérence.

## Hors périmètre

- La notion de densité (rapport sans unité) : elle relève de la seconde, et l'ajouter brouillerait la distinction avec la masse volumique.
- Les manches Mémo et Cartes façon grammaire : aucun carnet de sciences n'en a.
- La poussée d'Archimède : hors programme de 3e.
