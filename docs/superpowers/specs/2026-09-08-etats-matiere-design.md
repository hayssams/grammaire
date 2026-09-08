# Les états de la matière, première rubrique Physique-Chimie

Date : 2026-09-08. Statut : validé.
Référence de programme : SchoolMouv 3e, chapitre « Les états de la matière », dont les six leçons sont toutes couvertes : mélanges et corps purs, les états de la matière, les changements d'état de l'eau, la miscibilité et la solubilité, la composition de l'air, la masse volumique.

## Objet

Ouvrir une cinquième matière, Physique-Chimie, avec un premier carnet qui couvre le chapitre entier en six manches.

## Pages et navigation

- `index.html` : cinquième carte « Physique-Chimie », accent violet encre `--pc: #5F4B8B`.
- `physique-chimie.html` : page rubrique sur le modèle de `maths.html`, une carte « Carnet 1 · la matière » vers le carnet.
- `etats-matiere.html` : le carnet, bouton 🏠 vers `physique-chimie.html`, accent `--pc`, mécanique reprise de `thales.html` (verdicts, confettis, série, bilans enchaînés, `logResult`).

Avec six onglets, la barre passe en deux rangées de trois (chips arrondis, `flex-wrap`), lisible du téléphone au bureau.

## Les six manches

1. **Les états** (`#etats`) : dix QCM à trois propositions (Solide, Liquide, Gaz) sur les propriétés (forme propre, volume propre, compressibilité, surface libre), la description microscopique des molécules, et deux pièges (le miel, le nuage blanc au-dessus de la casserole).
2. **Nommer** (`#nommer`) : six questions, une par changement d'état. Le schéma des trois états s'affiche avec la flèche interrogée en rouge ; QCM parmi les six noms (fusion, solidification, vaporisation, liquéfaction, sublimation, condensation), toujours dans le même ordre pour ancrer le schéma.
3. **Situations** (`#situations`) : dix situations de la vie courante (buée, givre, linge qui sèche, glaçon, lac gelé, neige carbonique, flocons...). Le schéma s'affiche sans flèche pendant la question, puis la bonne flèche s'allume à la révélation.
4. **La courbe** (`#courbe`) : huit questions mêlées (`kind:"qcm"` ou `"num"`, sur le modèle de la manche Semblables de Thalès) : lire la température d'un palier (saisie, 0 ou 100), donner l'état de l'eau sur le segment marqué, nommer ce qui se passe pendant un palier, y compris sur une courbe de refroidissement, et expliquer pourquoi un palier est plat (corps pur).
5. **Mélanges** (`#melanges`) : douze QCM à propositions propres à chaque question : corps pur ou mélange, homogène ou hétérogène, miscibilité (huile, sirop), solubilité et le piège fondre/dissoudre, saturation, solvant et soluté, conservation de la masse à la dissolution, et la composition de l'air (mélange de gaz, ≈ 78 % de diazote, ≈ 21 % de dioxygène).
6. **Masse volumique** (`#masse`) : huit questions mêlées : la formule ρ = m ÷ V (QCM), quatre calculs en saisie numérique (ρ du fer, masse d'un volume d'eau ou d'huile, volume connaissant ρ, identification de l'aluminium à 2,7 g/cm³), pourquoi l'huile flotte, et la masse d'un litre d'air (≈ 1,3 g).

## Moteurs SVG

Deux fonctions dédiées, dans le fichier, sur le modèle des moteurs existants (viewBox 320 × 212) :

- `schemaEtats(chg)` : trois boîtes SOLIDE (bas gauche), LIQUIDE (bas droite), GAZ (haut centre), et six flèches, deux par paire d'états, décalées pour rester lisibles. La flèche `chg` est en rouge `--marge` épais, les autres en gris ; `null` n'allume rien. Aucun nom sur les flèches : c'est la question.
- `courbeEau(c)` : repère température/temps gradué de −20 à 120 °C, courbe de chauffe (5 segments : glace, palier 0 °C, liquide, palier 100 °C, vapeur) ou de refroidissement (`c.mode:"refroidit"`, 3 segments), guides pointillés aux paliers, segment `c.seg` marqué en rouge.

## Architecture du script

Six manches presque identiques : plutôt que six copies de `repStep`, le carnet définit un petit constructeur `creeManche(o)` qui gère intro, déroulé, verdict, bilan et rejeu pour les deux formes de question (QCM et saisie numérique). Chaque manche fournit ses données et une fonction `prep(q)` qui les normalise (figure, question, propositions ou réponse attendue, explication, figure de révélation éventuelle). Les éléments sont interrogés à l'intérieur du panel (pas d'ids globaux, les panels masqués gardent leur HTML).

## Gamification et suivi

Identiques aux autres carnets : confettis, série, `CHEERS`/`OOPS` aux couleurs de la chimie (⚗️, 🧪, 🌡️), et `logResult` avec `page:"etats-matiere"` et `game` valant `"etats"`, `"nommer"`, `"situations"`, `"courbe"`, `"melanges"` ou `"masse"`.

## Retouches annexes

- `maths.html` : la carte Thalès liste le mode « Semblables », oublié lors de l'ajout de la cinquième manche.
- `CLAUDE.md` : cinq cartes sur l'index, nouvelles pages, moteurs `schemaEtats`/`courbeEau`, page `"etats-matiere"` dans la liste `logResult`.

## Hors périmètre

Fiche mémo (modèle `astuces.html`) à faire plus tard si besoin ; manches Mémo/Cartes façon grammaire.
