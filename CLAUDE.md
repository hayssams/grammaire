# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Exercices interactifs de grammaire française pour une élève de 3e. Tout le contenu visible (interface, phrases, explications, messages de commit) est en français.

Site statique sans build, sans dépendances, sans tests : chaque page est un fichier HTML autonome (CSS et JS inline). Pour vérifier une modification, ouvrir le fichier dans un navigateur (`open classes-grammaticales.html`).

## Structure

- `index.html` : page chapeau, quatre cartes (Français, Maths, Histoire, Géographie).
- `francais.html` : rubrique Français, cartes vers les deux carnets et la boîte à astuces.
- `maths.html` : rubrique Maths, carte vers le carnet Thalès.
- `histoire.html` : rubrique Histoire (accent terre de Sienne `--histoire: #8C4A2F`), cartes vers les deux carnets et le mémo, plus le lien externe vers l'appli recommandée par la professeure.
- `geographie.html` : rubrique Géographie (accent bleu canard `--geo: #17697B`), cartes vers les deux carnets et le mémo.
- `thales.html` : carnet de maths sur le théorème de Thalès (accent vert `--maths: #1B6F55`). Reprend la mécanique des carnets de grammaire (onglets, `showVerdict`, confettis, série, `logResult` avec `page:"thales"`), avec en plus un moteur de figures `figSVG(f)` qui dessine les configurations de Thalès (triangle ou papillon) en SVG inline à partir des données de chaque exercice (`REPERER`, `RAPPORTS`, `CALCULER`, `RECIP`), et une manche à saisie numérique (virgule ou point acceptés, tolérance ±0,01).
- `histoire-dates.html` et `histoire-personnages.html` : les deux carnets d'histoire, tirés du programme de révision de rentrée (`docs/3eme revisions histoire geographie FR_compressed (1).pdf`). Ils partagent un moteur de frise `friseSVG(opts)` qui découpe 1914-2002 en cinq tranches cliquables (`TRANCHES`, ids `t1` à `t5`), avec une largeur minimale par tranche pour rester utilisable au doigt. Le premier porte les 23 dates, le second les 21 personnages, chacun avec son rôle rédigé et le fait daté qui permet de le situer.
- `geo-france.html` et `geo-europe.html` : les deux carnets de géo. Les tracés sont les **vraies frontières**, simplifiées puis figées en clair dans les fichiers : régions de l'IGN sous Licence Ouverte Etalab, ce qui **oblige à porter la mention de la source sur `geo-france.html`** ; pays, fleuves et planisphère de Natural Earth, domaine public. La fabrication est documentée dans `docs/superpowers/outils/geo/`, qui n'est pas servi.

  Les deux carnets partagent un moteur de cartes dont chaque règle vient d'une mesure, et non d'une intuition. Le modifier sans mesurer à nouveau, c'est réintroduire un défaut :

  - `mapSVG(fond, opts)` dessine, `mapBrancher(hote, repondre)` branche les clics. Un fond est un objet `{viewBox, zones}`, chaque zone portant `d`, l'ancre `cx`/`cy`, un `type` (`aire`, `trait`, `point`), la distance à l'ancre voisine `dmin`, et le drapeau `petit` si son polygone rendu fait moins de 36 px.
  - **Un halo n'est posé que sur les zones `petit`.** En poser partout faisait déborder les grandes régions sur leurs voisines : 4,3 % des clics situés dans une région résolvaient vers une autre, mesuré dans la page.
  - **Les rayons se calculent en pixels rendus**, via `unite(vb)`, jamais en unités de viewBox, parce que la loupe change l'échelle. Un rayon de 4,5 unités s'afficherait à 258 px dans un cadre resserré.
  - Un halo est **borné par `dmin`**, pour ne jamais atteindre l'ancre d'une voisine.
  - Les zones `petit` sont **peintes en dernier**, sinon leur halo est recouvert : celui de l'Île-de-France ne captait que 7 % de sa propre surface.
  - `.fig svg *{vector-effect:non-scaling-stroke}` garde toutes les épaisseurs constantes à l'écran. Sans cela un liseré de 1,5 unité devient un disque blanc de 43 px une fois zoomé.
  - `redimensionnerCadre` **n'est pas redondant avec `unite`** : celui-ci met à l'échelle les rayons, pas la taille du texte, qui reste en unités de viewBox. Sans lui une étiquette devient illisible dans un cadre resserré.
  - Un fleuve est cliquable sur toute sa longueur grâce à un tracé transparent épaissi posé sous le trait visible. L'épaisseur va dans le CSS, jamais en attribut : **une règle CSS l'emporte toujours sur un attribut de présentation**, ce qui avait rendu cette cible inopérante.
  - Les zones `inerte` sont du décor et ne réagissent jamais au clic.

  **La loupe** existe parce que viser au doigt est physiquement impossible sur une carte dense : 8 px pour le Luxembourg, 1 px pour la Guadeloupe. Un premier appui resserre le cadre, un second désigne. Le facteur de zoom se calcule pour que les deux zones les plus proches atteignent 44 px : 6 pour l'Europe. Là où même cela ne suffirait pas, le fond déclare des **cadres nommés** : le planisphère demanderait un zoom de 33, il porte donc trois cadres géographiques.
- `histoire-memo.html` et `geo-memo.html` : fiches mémo statiques sur le modèle d'`astuces.html` (deux onglets, pas de score, pas d'appel Google Sheets). Elles recopient à la main les données des carnets : **toute modification d'une donnée dans un carnet doit être reportée dans la fiche correspondante.**
- `astuces.html` : fiche mémo statique (astuce de reconnaissance + 3 à 5 exemples par classe et par fonction, sections « Ne confonds pas ») ; deux onglets, pas de score ni d'appel Google Sheets, contenu écrit directement dans le HTML.
- `docs/superpowers/` : specs et plans d'implémentation.

## Architecture des carnets (fichiers jumeaux)

Les deux carnets sont volontairement parallèles : même structure HTML (en-tête avec bouton 🏠 vers `francais.html`, `nav[role=tablist]` à quatre onglets, quatre `section.panel`), mêmes helpers JS, même CSS. **Toute modification de comportement partagé (helpers, gamification, style) doit être reportée à la main dans les deux fichiers.**

Chaque carnet enchaîne quatre modes, chacun rendu dans son panel par manipulation directe de `innerHTML` :

1. **En contexte** (`#quiz`, état `Q`) : QCM, phrase avec mot souligné, propositions.
2. **Caméléons / Déplacements** (`#cam`, état `C`) : même mot, deux phrases, deux réponses.
3. **Mémo** (`#memo`, état `M`) : memory associant étiquette et exemple.
4. **Cartes** (`#cartes`, état `F`) : flashcards Leitner à trois boîtes, réponse sans les propositions, auto-évaluation « Je savais / Pas su ».

### Modèle de données

En tête du `<script>` de chaque carnet :

- `CLASSES` : map `id -> {label, v}` où `v` est la variable CSS de couleur de la catégorie ; `ORDER` fixe l'ordre d'affichage des propositions. (Dans le carnet 2, `CLASSES` contient en réalité les fonctions : sujet, cod, coi, etc.)
- `QUIZ`, `CAM`, `MEMO` : tableaux d'items. Une phrase marque le mot ou groupe cible avec `[[...]]` (extrait par `plainWord`, souligné par `phraseHTML`). Chaque item porte `c` (id de la classe/fonction) et `w` (explication courte affichée après la réponse).

### Gamification et suivi

- Confettis, série (streak), messages `CHEERS`/`OOPS` tirés au hasard à chaque réponse.
- Les résultats de chaque manche sont envoyés à Google Sheets via `logResult()` : POST `no-cors` vers `SHEET_URL` (Google Apps Script), avec `page` valant `"classes"`, `"fonctions"`, `"thales"`, `"histoire-dates"`, `"histoire-personnages"`, `"geo-france"` ou `"geo-europe"`. Toute nouvelle activité doit appeler `logResult` en fin de manche. **Défaut connu :** la manche Caméléons/Déplacements des deux carnets de grammaire (`camEnd`) ne l'appelle pas encore.

Il y a maintenant trois familles de jumeaux, et la règle vaut pour chacune : **toute modification de comportement partagé doit être reportée à la main dans tous les fichiers de la famille.**

- Grammaire : `classes-grammaticales.html` et `fonctions-grammaticales.html` (quatre manches : En contexte, Caméléons/Déplacements, Mémo, Cartes).
- Histoire : `histoire-dates.html` et `histoire-personnages.html` (moteur `friseSVG` commun).
- Géographie : `geo-france.html` et `geo-europe.html` (moteur `mapSVG` commun).

`thales.html` reste seul de son espèce, avec son moteur `figSVG`.

## Charte graphique

Esthétique cahier d'écolier : fond papier (`--paper`), feuille à lignes (`repeating-linear-gradient`), marge rouge verticale (`--marge`), titres en Instrument Serif, texte en Karla (Google Fonts). Réutiliser les variables CSS existantes ; chaque catégorie grammaticale a sa couleur propre. Penser à `prefers-reduced-motion` et aux petits écrans (breakpoints 420/360 px), la cible principale étant un téléphone.
