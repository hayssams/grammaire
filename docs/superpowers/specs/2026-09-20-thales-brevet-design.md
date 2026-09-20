# Thalès niveau brevet, deuxième carnet de Maths, et le mémo des méthodes

Date : 2026-09-20. Statut : validé.
Références : programme de mathématiques de 3e (géométrie, agrandissement-réduction, triangles semblables) ; sujets de brevet des dernières sessions pour le format des exercices enchaînés ; `thales.html`, dont ce carnet est la suite et non le remplaçant.

## Objet

`thales.html` installe les bases en cinq manches, mais chacune se règle en une opération, avec des nombres qui tombent juste : repérer la configuration, écrire l'égalité, appliquer le produit en croix une fois. Au contrôle et au brevet, rien ne se présente ainsi. L'énoncé cache une longueur qu'il faut reconstituer, mélange les unités, glisse une donnée inutile, demande la rédaction complète, et enchaîne trois questions sur la même figure.

Ce projet ajoute donc deux pages :

- `thales-brevet.html`, un deuxième carnet qui ne reprend aucune question du premier et travaille ce que le premier laisse de côté ;
- `maths-memo.html`, la fiche mémo de la matière, organisée par cas à traiter, avec pour chaque cas la rédaction type à recopier.

`thales.html` n'est pas touché. Un élève qui n'a pas le premier carnet en main n'a rien à faire dans le second.

## Pages et navigation

- `thales-brevet.html` : accent `--maths`, bouton 🏠 vers `maths.html`, quatre onglets sur une seule rangée. Jumeau de `thales.html` pour le CSS, les confettis, la série, les bilans et `appareil()`. Il reprend `figSVG(f)` et `figDuoSVG(d)` à l'identique, et adopte le constructeur `creeManche(o)` de `masse-volumique.html` au lieu des cinq boucles recopiées de `thales.html`.
- `maths-memo.html` : fiche statique sur le modèle d'`astuces.html` et de `pc-memo.html`. Pas de score, pas d'appel Google Sheets, bouton 🏠 vers `maths.html`, quatre onglets.
- `maths.html` : deux cartes s'ajoutent à celle du carnet 1. « Carnet 2 · niveau brevet », qui liste les quatre manches, et « Mémo · les méthodes de Thalès », sur le modèle de la carte mémo de `physique-chimie.html`.
- `index.html` : inchangé.

## Le constructeur partagé, et ses deux ajouts

`creeManche(o)` sait aujourd'hui dérouler une manche de QCM (`kind:"qcm"`) ou de saisie numérique (`kind:"num"`). Deux ajouts additifs, écrits dans `thales-brevet.html` :

- **`kind:"ordre"`** : la question affiche des étiquettes mélangées, l'élève tape dessus dans l'ordre. Une étiquette tapée rejoint la bande de réponse et se grise dans le tas ; la retaper dans la bande l'en retire. Un bouton « Valider » compare la suite construite à l'ordre attendu. La question est juste si la suite est exactement l'ordre attendu, l'intruse restée dans le tas ; elle vaut alors les dix points habituels, et rien sinon. Aucun glisser-déposer : la cible est un téléphone.
- **`deplier`** : une fonction facultative qui transforme une entrée de `donnees` en plusieurs questions consécutives. `lance()` mélange les entrées, puis applique `deplier` pour obtenir la liste des questions. Les sous-questions d'une même entrée restent groupées et dans leur ordre, seul l'ordre des entrées est tiré au sort. La manche Brevet en a besoin ; les trois autres ne passent pas `deplier`.

Ces deux ajouts font de la copie de `creeManche` dans `thales-brevet.html` un sur-ensemble de celle des carnets de physique-chimie. C'est la troisième copie du constructeur dans le dépôt ; la règle de report à la main s'applique, et `CLAUDE.md` le note.

## Manche 1 : À étapes

`#etapes`, dix questions, saisie numérique, moteur `figSVG`. Aucune ne se règle en une opération. Les six situations à couvrir, chacune présente au moins une fois :

1. **`AB` n'est pas donné.** La figure porte `AM = 3` et `MB = 5` : il faut poser `AB = AM + MB = 8` avant d'écrire l'égalité. Avec `AN = 4,5`, on obtient `AC = 4,5 × 8 ÷ 3 = 12 cm`.
2. **Le même piège en papillon, mais à l'envers.** Le point de croisement `A` est entre `M` et `B`, donc `AB = MB − AM`. Avec `AM = 2`, `MB = 6`, `AN = 3` : `AB = 4` et `AC = 3 × 4 ÷ 2 = 6 cm`. La question 1 et celle-ci se répondent : c'est le même raisonnement, et l'opération change.
3. **L'inconnue est à côté de celle que Thalès donne.** On demande `NC`, donc `AC` puis `NC = AC − AN`. Avec `AM = 4`, `AB = 10`, `AN = 6` : `AC = 15` et `NC = 9 cm`.
4. **Unités mélangées.** `AM = 40 cm`, `AB = 1,2 m`, `MN = 25 cm`. Tout ramener en centimètres avant de calculer : `BC = 25 × 120 ÷ 40 = 75 cm`. La réponse est demandée en mètres, soit `0,75 m`.
5. **Une donnée inutile.** Quatre longueurs sont écrites sur la figure, trois suffisent. Avec `AM = 3`, `AB = 7,5`, `MN = 5` et `AN = 4` qui ne sert à rien : `BC = 5 × 7,5 ÷ 3 = 12,5 cm`.
6. **Résultat non entier.** `AM = 3`, `AB = 7`, `MN = 5` donnent `BC = 11,666…`, arrondi au dixième : `11,7 cm`. L'énoncé demande l'arrondi explicitement, puisque la tolérance de saisie reste celle de `creeManche` (±0,011).

Les quatre questions restantes recombinent ces situations, dont une en papillon avec donnée inutile et une avec rapport donné sous forme de fraction (`AM/AB = 2/5`, `BC = 15`, calculer `MN`).

## Manche 2 : Rédiger

`#rediger`, six démonstrations, `kind:"ordre"`. Une par cas : Thalès direct en triangle, Thalès direct en papillon, réciproque, contraposée, triangles semblables, agrandissement.

Chaque question porte cinq ou six étapes et **exactement une étiquette intruse**. Le squelette attendu est toujours le même, ce qui est le vrai enseignement de la manche :

1. les alignements (« Les points A, M, B sont alignés, ainsi que A, N, C ») ;
2. le parallélisme (« (MN) // (BC) ») ;
3. le théorème invoqué et l'égalité des rapports (« D'après le théorème de Thalès : AM/AB = AN/AC = MN/BC ») ;
4. le remplacement par les valeurs (« donc 3/6 = 4/AC ») ;
5. le produit en croix (« AC = 6 × 4 ÷ 3 ») ;
6. la conclusion, avec l'unité (« AC = 8 cm »).

Pour la réciproque, les étapes 3 à 6 deviennent : calcul du premier rapport, calcul du second, constat d'égalité, conclusion par la réciproque. Pour la contraposée, le constat devient une différence et la conclusion nie le parallélisme.

Les intruses sont choisies pour être plausibles : un rapport inversé (`AB/AM = AC/AN`), un théorème qui n'a rien à faire là (« D'après le théorème de Pythagore »), une conclusion sans unité, ou une hypothèse jamais donnée par l'énoncé (« les triangles sont isocèles »).

La correction affiche la démonstration complète, dans l'ordre, puis une ligne expliquant pourquoi l'intruse n'y a pas sa place.

Les six démonstrations complètes vivent dans un tableau `REDACTIONS` du carnet, chaque entrée portant `cas`, `etapes` (la suite attendue) et `intrus`. Ce tableau est la source unique : la manche en tire ses étiquettes, la fiche mémo recopie le texte, et `verifie-thales.mjs` contrôle que les deux ne divergent pas.

## Manche 3 : Agrandir

`#agrandir`, huit questions, QCM et saisie mélangés comme la manche Semblables du carnet 1. Le fil : ce qui est multiplié par `k`, ce qui l'est par `k²`, ce qui l'est par `k³`.

- Le coefficient sur les longueurs : deux triangles semblables, retrouver `k`.
- L'aire, en QCM : si `k = 3`, l'aire est multipliée par 9.
- L'aire, en calcul : `AMN` a pour aire 12 cm² et `k = 2`, donc `ABC` fait 48 cm².
- Le chemin inverse : deux aires, 9 cm² et 36 cm², donc `k = 2`. La racine carrée est au programme.
- Le volume : `k = 2`, le volume est multiplié par 8. Puis une pyramide réduite en calcul.
- Le piège du périmètre : il suit `k`, pas `k²`. Posé en QCM, avec les trois réponses `k`, `k²`, `k³`.
- L'échelle de maquette : au 1/50, un bâtiment de 12 m mesure 24 cm.
- Une configuration de Thalès reliée à l'aire : `AM/AB = 1/3` et l'aire de `ABC` vaut 45 cm², donc celle de `AMN` vaut 5 cm².

## Manche 4 : Brevet

`#brevet`, cinq sujets écrits, trois tirés au sort par manche, trois questions chacun, soit neuf questions. C'est la manche qui utilise `deplier`.

Chaque sujet porte un contexte rédigé, une figure, et trois questions enchaînées. La réponse attendue à la question précédente est rappelée en tête de la suivante (« Tu as trouvé AC = 8 cm »). **Le rappel donne toujours la bonne valeur, même si l'élève s'est trompé** : sinon une erreur à la première question ferait perdre les trois, et le carnet punirait deux fois la même faute.

Les cinq sujets :

1. **L'arbre et son ombre.** Calculer la hauteur de l'arbre, puis la longueur de l'ombre d'un panneau de 2 m planté au même endroit, puis justifier en une phrase pourquoi les droites sont parallèles.
2. **L'échelle contre le mur.** Thalès pour la hauteur atteinte par un barreau, Pythagore pour la longueur de l'échelle, puis une conclusion sur la sécurité (l'écart au mur).
3. **La maquette.** Le coefficient de réduction, une longueur sur la maquette, puis l'aire du toit sur la maquette, qui suit `k²`.
4. **Le terrain à partager.** Une parcelle triangulaire coupée par un chemin parallèle à un côté : la longueur du chemin, puis la part de terrain d'un côté, puis son aire.
5. **La rampe d'accès.** Thalès pour la hauteur d'un poteau intermédiaire, Pythagore pour la longueur de la rampe, puis la vérification d'une pente maximale.

La structure des données : `SUJETS = [{titre, contexte, fig, questions:[{q, ans, unit, rep, w, rappel}]}]`, où `rappel` est la phrase affichée en tête de la question suivante.

## Données et figures

Les configurations `TRI`, `TRI2`, `PAP`, `OMB` sont reprises de `thales.html`. Deux ajouts sont nécessaires :

- une configuration papillon où `A` est nettement entre `M` et `B`, pour que la soustraction `AB = MB − AM` se lise sur le dessin ;
- une configuration « échelle contre le mur » (deux verticales et un sol, façon `OMB` renversée) pour les sujets 2 et 5.

Quand une question mélange les unités, chaque longueur de `lens` porte un champ `u` valant `"cm"` ou `"m"`. En l'absence de `u`, l'unité est celle de la question.

## Le mémo, `maths-memo.html`

Quatre onglets, neuf cas. Un onglet par famille, pour qu'un futur chapitre de maths s'ajoute sans refonte.

| Onglet | Cas |
| --- | --- |
| Thalès | calculer une longueur (triangle) · calculer une longueur (papillon) · vérifier qu'on a le droit d'appliquer le théorème |
| Parallèles ? | prouver que deux droites sont parallèles (réciproque) · prouver qu'elles ne le sont pas (contraposée) |
| Agrandir | le coefficient `k` sur les longueurs · les aires en `k²` et les volumes en `k³` |
| Semblables | prouver que deux triangles sont semblables · calculer une longueur dans deux triangles semblables |

Chaque cas porte quatre blocs, dans cet ordre :

1. **Ça se reconnaît à** : ce que l'énoncé dit quand on est dans ce cas (« une longueur marquée ? sur la figure, et deux droites données parallèles »).
2. **La méthode** : les étapes numérotées, à l'impératif.
3. **La rédaction type** : la démonstration entière, rédigée, à recopier au contrôle en changeant les lettres et les nombres. Pour les cas qui ont leur équivalent dans la manche Rédiger, ce texte est **exactement** celui de `REDACTIONS`, au mot près.
4. **Le piège** : l'erreur classique, écrite en une ou deux phrases (« AM/MB n'est pas un rapport de Thalès : MB n'est pas un côté du triangle ABC »).

En tête du premier onglet, un aiguillage de cinq lignes : ce que l'énoncé demande, et le cas à ouvrir. Une longueur à calculer, un parallélisme à prouver, un parallélisme à réfuter, une aire après agrandissement, deux triangles à comparer.

Les figures sont des SVG écrits à la main, statiques, une par cas. `figSVG` n'est **pas** recopié dans la fiche : une troisième copie d'un moteur de quarante lignes pour dessiner neuf triangles fixes serait une dette sans contrepartie.

## Contrôle : `outils/verifie-thales.mjs`

Sur le modèle de `verifie-masse.mjs`, avec une chose que les autres contrôles du dépôt ne font pas : le script refait les mathématiques.

1. **Vérité arithmétique.** Pour chaque question à réponse numérique, le script reconstitue les cinq longueurs de la configuration en remplaçant le `?` par la réponse annoncée, convertit tout dans la même unité, complète `AB` par `AM + MB` en triangle et `MB − AM` en papillon, puis vérifie l'égalité des rapports disponibles parmi `AM/AB`, `AN/AC` et `MN/BC`, à 0,001 près. Une réponse fausse ne peut pas partir chez l'élève, même si l'explication qui l'accompagne paraît juste.
2. **Cohérence de la figure.** L'inconnue `?` est unique par question, et chaque longueur citée dans l'énoncé ou dans la correction existe dans `lens`.
3. **Réciproque.** Le champ `ok` est confronté au calcul réel des deux rapports : un item annoncé parallèle dont les rapports diffèrent est une erreur.
4. **Manche Rédiger.** Chaque entrée de `REDACTIONS` porte exactement une intruse, au moins cinq étapes, et aucune étape en double.
5. **Câblage.** Chaque onglet, son panneau et sa clé de `MANCHES` se répondent, comme dans `verifie-masse.mjs`. Une manche sans onglet est une erreur ; un onglet sans manche est toléré tant que les quatre tableaux de questions ne sont pas tous écrits.
6. **Carnet vers fiche.** Chaque rédaction type de `REDACTIONS` se retrouve dans `maths-memo.html`, avec la normalisation de `coherence.mjs` : entités HTML, apostrophes typographiques, espaces, balises retirées.

Le point 6 est le contrôle que `coherence.mjs` ne peut pas rendre ici. Ce script extrait un littéral de tableau et l'évalue seul ; or les données du carnet Thalès utilisent `...TRI` et `eq3(...)`, et lèveraient une `ReferenceError`. Plutôt que d'aplatir les données pour plaire au script, `verifie-thales.mjs` charge les deux fichiers lui-même.

Le script se termine par `4 manche(s) contrôlée(s) : le carnet est conforme.`

## Retouches de la documentation

- `CLAUDE.md` : `thales-brevet.html` et `maths-memo.html` décrits dans la liste des pages ; la famille de jumeaux Maths (`thales.html` et `thales-brevet.html`) ajoutée à la liste des familles ; `"thales-brevet"` ajouté aux valeurs de `page` de `logResult` ; la note que `creeManche` existe en trois exemplaires, dont un étendu de `kind:"ordre"` et de `deplier` ; la commande `node outils/verifie-thales.mjs` dans le bloc de contrôles.
- `README.md` : les deux nouvelles pages dans la rubrique Maths.
- `outils/README.md` : la section `verifie-thales.mjs`, ses six contrôles et sa ligne de fin.

## Hors périmètre

- Le théorème de Thalès dans l'espace, et les sections de solides : hors du programme de 3e.
- La trigonométrie, même quand un sujet de brevet la mêle à Thalès : elle mérite son propre carnet, avec son propre mémo.
- Une manche Cartes ou Mémo façon grammaire : aucun carnet scientifique du dépôt n'en a.
- La saisie d'une démonstration au clavier : impossible à corriger honnêtement, et pénible au doigt. La remise en ordre la remplace.
- Toute modification de `thales.html`. Le carnet 1 reste le socle, et ses questions ne sont pas reprises dans le carnet 2.
