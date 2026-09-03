# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Exercices interactifs de grammaire française pour une élève de 3e. Tout le contenu visible (interface, phrases, explications, messages de commit) est en français.

Site statique sans build, sans dépendances, sans tests : chaque page est un fichier HTML autonome (CSS et JS inline). Pour vérifier une modification, ouvrir le fichier dans un navigateur (`open classes-grammaticales.html`).

## Structure

- `index.html` : page chapeau, deux cartes seulement (Français, Maths).
- `francais.html` : rubrique Français, cartes vers les deux carnets et la boîte à astuces.
- `maths.html` : rubrique Maths, en attente de ses premiers carnets.
- `classes-grammaticales.html` : carnet 1, les classes grammaticales (accent bleu `--classes: #1D4E89`).
- `fonctions-grammaticales.html` : carnet 2, les fonctions grammaticales (accent vert `--fonctions: #1B6F55`).
- `astuces.html` : fiche mémo statique (astuce de reconnaissance + 3 à 5 exemples par classe et par fonction, sections « Ne confonds pas ») ; deux onglets, pas de score ni d'appel Google Sheets, contenu écrit directement dans le HTML.
- `docs/superpowers/` : specs et plans d'implémentation.

## Architecture des deux carnets (fichiers jumeaux)

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
- Les résultats de chaque manche sont envoyés à Google Sheets via `logResult()` : POST `no-cors` vers `SHEET_URL` (Google Apps Script), avec `page:"classes"` ou `page:"fonctions"`. Toute nouvelle activité doit appeler `logResult` en fin de manche.

## Charte graphique

Esthétique cahier d'écolier : fond papier (`--paper`), feuille à lignes (`repeating-linear-gradient`), marge rouge verticale (`--marge`), titres en Instrument Serif, texte en Karla (Google Fonts). Réutiliser les variables CSS existantes ; chaque catégorie grammaticale a sa couleur propre. Penser à `prefers-reduced-motion` et aux petits écrans (breakpoints 420/360 px), la cible principale étant un téléphone.
