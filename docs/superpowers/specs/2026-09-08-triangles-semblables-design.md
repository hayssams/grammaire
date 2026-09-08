# Triangles semblables dans le carnet Thalès

Date : 2026-09-08. Statut : validé.

## Objet

Le carnet `thales.html` couvre le théorème de Thalès (repérer, rapports, calculer, réciproque) mais pas les triangles semblables, qui font partie du même chapitre en 3e. On ajoute une cinquième manche « Semblables » au carnet existant, plutôt qu'un nouveau fichier : même moteur, même gamification, un seul fichier à maintenir.

## Onglet et manche

- Cinquième onglet « Semblables » après « Réciproque », panel `#semblables`, état `S`, fonctions `semIntro` / `semStep` / `semEnd`.
- Même mécanique que les autres manches : intro, barre d'état, `showVerdict`, confettis, série, bilan `bilanHTML`, `logResult("semblables", ...)` en fin de manche.
- Le sous-titre de l'en-tête passe de « Quatre entraînements » à « Cinq entraînements ».
- Le bilan sans-faute de la Réciproque renvoie vers la nouvelle manche ; celui des Semblables ferme la boucle.
- Retouche CSS pour que cinq onglets tiennent sur téléphone (breakpoints 420 et 360 px).

## Contenu : 10 figures mélangées

Six questions de reconnaissance (oui/non, boutons `judge`) :

1. Deux angles égaux deux à deux (52°, 71°) → semblables ; le troisième se déduit avec 180°.
2. Un seul angle commun (50° partout, mais 60° contre 75°) → pas semblables.
3. Il faut calculer le troisième angle pour conclure (40° + 65° contre 40° + 75°) → semblables.
4. Côtés proportionnels (3, 4, 5 et 6, 8, 10, coefficient 2) → semblables.
5. Côtés non proportionnels (4, 5, 6 et 8, 10, 14) → pas semblables.
6. Question pont : figure de Thalès, « AMN et ABC sont-ils semblables ? » → oui (angle commun en A, angles correspondants).

Quatre calculs (saisie numérique, tolérance ±0,01, rédaction modèle après la réponse) :

7. Agrandissement entier : k = 2, EF = 8 cm.
8. Agrandissement k = 1,5, UW = 9 cm.
9. Réduction k = 0,4, EF = 3,2 cm.
10. k = 1,5 avec décimaux, NO = 10,5 cm.

## Figure : `figDuoSVG(d)`

Nouvelle fonction à côté de `figSVG`, sans la modifier : le besoin est différent (deux triangles indépendants, angles marqués, pas de parallèles).

- Entrée : `{tris:[{P:[{x,y,n}×3], angs:[{at,v?,c}], lens:[{a,b,v}]}, ...]}` ; `at` indexe le sommet, `v` la mesure affichée (absente pour un simple codage), `c` la couleur d'appariement.
- Les angles égaux portent des arcs de même couleur (vert `--maths`, rouge `--marge`, bleu) ; dans les calculs, les arcs sans mesure matérialisent les sommets homologues.
- Côtés : étiquettes de longueur décalées vers l'extérieur du triangle, `?` en rouge pour l'inconnue, comme dans `figSVG`.
- Réutilise les classes CSS existantes (`.tr`, `.pt`, `.ptn`, `.len`) plus deux nouvelles (`.arc`, `.ang`).
- ViewBox 320 × 212, mention « Figure pas à l'échelle » conservée.

L'item pont (n° 6) garde une figure `figSVG` classique : chaque item porte soit `duo`, soit `f`, et le rendu choisit.

## Hors périmètre

Pas de nouvelle page, pas de modification de `figSVG`, pas de manche séparée par type de question.
