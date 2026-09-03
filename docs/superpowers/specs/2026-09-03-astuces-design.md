# Page d'astuces : reconnaître les classes et les fonctions

Date : 2026-09-03. Statut : validé.

## But

Donner à l'élève une fiche de référence rapide, consultable avant ou pendant les exercices, qui explique **comment reconnaître** chaque classe et chaque fonction grammaticale par des tests concrets (« un déterminant est suivi d'un nom », « l'adverbe ne s'accorde pas alors que l'adjectif s'accorde »), chaque astuce illustrée de 3 à 5 exemples.

## Fichiers

- **Nouveau : `astuces.html`** — page autonome (CSS et JS inline), même charte cahier que le reste du site : fond papier, feuille lignée avec marge rouge, Instrument Serif pour les titres, Karla pour le texte, bouton « 🏠 Accueil », breakpoints 420/360 px, `prefers-reduced-motion`.
- **Modifié : `index.html`** — une petite carte « La boîte à astuces » ajoutée sous les deux carnets, même style `.card`.

## Structure de la page

Deux onglets (`nav[role=tablist]` + `section.panel`, même mécanique que les carnets) :

- **Classes** (accent bleu `--classes: #1D4E89`) — les 9 classes des carnets : nom, verbe, adjectif, déterminant, pronom, adverbe, préposition, conjonction, interjection.
- **Fonctions** (accent vert `--fonctions: #1B6F55`) — les 9 fonctions : sujet, COD, COI, attribut, CC, épithète, CDN, apposition, complément d'agent.

Chaque onglet contient :

1. **Une carte par classe/fonction**, avec :
   - le nom de la catégorie dans sa couleur (mêmes variables CSS de couleur par catégorie que les carnets) ;
   - l'astuce formulée comme un test actionnable (question à se poser, remplacement, suppression, déplacement) ;
   - 3 à 5 phrases d'exemple, mot ou groupe concerné souligné et coloré (réutiliser la convention visuelle de `phraseHTML`).
2. **Une section « Ne confonds pas »** en bas de l'onglet, pour les paires piégeuses, chacune avec 3 à 5 exemples en miroir :
   - Classes : adverbe vs adjectif (l'adverbe est invariable, l'adjectif s'accorde), déterminant vs pronom (suivi d'un nom ou non), préposition vs conjonction, nom vs verbe (le rire / il rit)...
   - Fonctions : COD vs attribut du sujet, sujet vs COD inversé, CC vs COI (déplaçable et supprimable ou non)...

## Comportement

- Le seul JavaScript est le changement d'onglet (copie de la mécanique des carnets).
- Pas de score, pas de confettis, pas d'appel `logResult` / Google Sheets : c'est une fiche de référence, pas un exercice.

## Hors périmètre

- Aucun changement dans les deux carnets existants (un lien éventuel vers la fiche pourra être ajouté plus tard).
- Pas de mode interactif ou de mini-défi (écarté au brainstorming au profit de la fiche mémo simple).
