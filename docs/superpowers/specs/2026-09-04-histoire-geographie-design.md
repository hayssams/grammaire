# Histoire et Géographie : deux nouvelles matières

Date : 2026-09-04. Statut : validé.

## But

Couvrir le programme de révision de rentrée en 3e distribué par la professeure
(`docs/3eme revisions histoire geographie FR_compressed (1).pdf`), évalué la première
semaine de l'année. Le PDF demande deux choses :

- **Géographie** : savoir *nommer et placer* sur la carte de France les régions et leurs
  capitales, les fleuves, les principales chaînes de montagnes, les mers et l'océan
  bordant la France, les cinq DROM ; et sur la carte d'Europe, les pays de l'Union
  européenne.
- **Histoire** : connaître 23 dates et savoir les placer sur une frise chronologique ;
  connaître 21 personnages et pouvoir évoquer leur rôle en quelques lignes.

Le verbe *placer* revient dans les deux matières : les exercices s'appuient donc sur des
figures cliquables (cartes, frise) et pas seulement sur du QCM textuel.

## Périmètre

Fidèle au PDF, nettoyé : les 23 dates et les personnages du PDF, sans rien ajouter au
programme, avec deux corrections de la liste de la professeure :

- « Charles de Gaulle » apparaît deux fois : une seule entrée est conservée ;
- « Guerre froide » figure parmi les personnages alors que c'est une notion : elle sort de
  la liste des personnages et devient une entrée du carnet des dates et de la fiche mémo.

D'où 23 dates et 21 personnages.

## Fichiers

```
index.html                      (modifié : quatre cartes au lieu de deux)
CLAUDE.md                       (modifié : structure et conventions des nouveaux fichiers)

histoire.html                   (nouveau, page chapeau, trois cartes)
  histoire-dates.html           (nouveau, carnet, quatre manches)
  histoire-personnages.html     (nouveau, carnet, quatre manches)
  histoire-memo.html            (nouveau, fiche statique, deux onglets)

geographie.html                 (nouveau, page chapeau, trois cartes)
  geo-france.html               (nouveau, carnet, quatre manches)
  geo-europe.html               (nouveau, carnet, quatre manches)
  geo-memo.html                 (nouveau, fiche statique, deux onglets)
```

Chaque fichier reste autonome : CSS et JS inline, aucune dépendance, aucun build.

## Charte

Deux variables CSS d'accent viennent s'ajouter aux existantes, dans le même registre
sourd que `--francais` et `--maths` :

| Matière | Variable | Couleur |
|---|---|---|
| Français | `--francais` | `#1D4E89` bleu encre |
| Maths | `--maths` | `#1B6F55` vert |
| Histoire | `--histoire` | `#8C4A2F` terre de Sienne |
| Géographie | `--geo` | `#17697B` bleu canard |

Tout le reste est inchangé : fond papier `--paper`, feuille lignée, marge rouge, Instrument
Serif pour les titres, Karla pour le texte, bouton « 🏠 », breakpoints 420/360 px,
`prefers-reduced-motion`.

## Navigation

- `index.html` : quatre cartes (Français, Maths, Histoire, Géographie), même style `.card`,
  chacune avec sa couleur d'accent.
- `histoire.html` et `geographie.html` : pages chapeau calquées sur `maths.html` (en-tête
  avec bouton 🏠 vers `index.html`, feuille, cartes numérotées avec liste des manches).
  Trois cartes chacune : les deux carnets, puis la fiche mémo.
- `histoire.html` porte en plus un lien discret vers l'application recommandée par la
  professeure (le QR code du PDF,
  `https://kerlian123.github.io/Fiches-personnages-et-v-nements-histoire---mission-brevet/index.html`),
  signalé comme lien externe.

## Mécanique commune aux carnets

Les quatre carnets reprennent l'architecture des carnets existants : `nav[role=tablist]` à
quatre onglets, quatre `section.panel` rendus par `innerHTML`, helpers `$`, `shuffle`,
`pick`, `esc`, `rnd`, `chrono`, `confetti`, `showVerdict`, `bilanHTML`, série (streak),
messages `CHEERS`/`OOPS` tirés au hasard, bouton « Nouvelle manche ».

Chaque fin de manche appelle `logResult` vers le même `SHEET_URL` Google Apps Script, avec
`page` valant `"histoire-dates"`, `"histoire-personnages"`, `"geo-france"` ou
`"geo-europe"`.

Les fiches mémo n'ont ni score, ni confettis, ni `logResult` : seul JavaScript, le
changement d'onglet, comme dans `astuces.html`.

## La frise chronologique

Un helper `friseSVG(actif, {bonne, choisie})` dessine en SVG inline un axe 1910 → 2010
découpé en cinq tranches cliquables (`data-id`), sans recouvrement. Les tranches sont
partagées par les deux carnets d'histoire.

| id | Tranche | Dates du PDF qui y tombent |
|---|---|---|
| `t1` | 1914-1918 · la Grande Guerre | 1914, 1916, 1917, 11 nov. 1918 |
| `t2` | 1919-1938 · l'entre-deux-guerres | 1929, 1933, 1936 |
| `t3` | 1939-1945 · la Seconde Guerre mondiale | 1939-45, 18 juin 1940, 6 juin 1944, Libération 1944, 8 mai 1945, août 1945, ONU 1945 |
| `t4` | 1946-1975 · la guerre froide s'installe | 1947, 1948-49, 1957, 1961, 1962 |
| `t5` | 1976-2002 · la fin de la guerre froide et l'Europe | 1989, 1991, 1992, 2002 |

Chaque tranche reçoit d'abord une largeur plancher de 46 unités, puis le reste de l'axe est
réparti au prorata de la durée : `t1` et `t3`, très courtes, restent cliquables au doigt
sans que la frise cesse d'être proportionnelle. Largeurs obtenues, en unités de viewBox :
`t1` 49,9, `t2` 61,7, `t3` 51,5, `t4` 69,6, `t5` 67,2, soit 46 px rendus à 390 px de large
et 42 px à 360 px, avec des bandes hautes de 60 unités. La légende sous l'axe rappelle les
bornes.

Après réponse, la tranche choisie et la bonne tranche sont colorées, et un repère marque la
position exacte de la date sur l'axe.

## Carnet 1 : `histoire-dates.html`

### Données

`TRANCHES` : map `id -> {label, de, a, v}` où `v` est la variable CSS de couleur.

`DATES` : les 23 entrées du PDF, chacune `{d, label, t, w}` où `d` est la date telle
qu'elle est écrite sur la feuille, `t` l'id de tranche, `w` l'explication courte affichée
après la réponse.

| Date | Événement | Tranche |
|---|---|---|
| 1914 | début de la Première Guerre mondiale | `t1` |
| 1916 | bataille de Verdun | `t1` |
| 1917 | révolutions russes | `t1` |
| 11 novembre 1918 | armistice | `t1` |
| 1929 | crise économique mondiale | `t2` |
| 1933 | arrivée d'Hitler au pouvoir | `t2` |
| 1936 | élection du Front populaire en France | `t2` |
| 1939-1945 | Seconde Guerre mondiale | `t3` |
| 18 juin 1940 | appel du général de Gaulle | `t3` |
| 6 juin 1944 | débarquement en Normandie | `t3` |
| 1944 | Libération de la France | `t3` |
| 8 mai 1945 | capitulation allemande | `t3` |
| août 1945 | bombardements atomiques du Japon | `t3` |
| 1945 | création de l'Organisation des Nations unies | `t3` |
| 1947 | début de la guerre froide | `t4` |
| 1948-1949 | blocus de Berlin | `t4` |
| 1957 | traité de Rome | `t4` |
| 1961 | construction du mur de Berlin | `t4` |
| 1962 | crise de Cuba | `t4` |
| 1989 | chute du mur de Berlin | `t5` |
| 1991 | disparition de l'Union soviétique | `t5` |
| 1992 | traité de Maastricht | `t5` |
| 2002 | mise en circulation de l'euro | `t5` |

### Les quatre manches

1. **Frise** (`#frise`) : un événement s'affiche, l'élève clique la tranche qui lui
   correspond sur la frise SVG.
2. **En contexte** (`#quiz`) : QCM tiré dans les deux sens : soit la date est donnée et il
   faut choisir l'événement, soit l'inverse. Quatre propositions, distracteurs pris dans la
   même tranche quand c'est possible, pour que la question ne se résolve pas au flair.
3. **Mémo** (`#memo`) : memory qui apparie date et événement, même mécanique que les
   carnets de grammaire.
4. **Cartes** (`#cartes`) : flashcards Leitner à trois boîtes : recto la date, verso
   l'événement, auto-évaluation « Je savais / Pas su ».

## Carnet 2 : `histoire-personnages.html`

### Données

`ROLES` : map `id -> {label, v}` des huit catégories, chacune avec sa couleur :
`gm1` (Première Guerre mondiale), `totalitarismes`, `allies` (les Alliés), `resistance`
(la France libre et la Résistance), `vichy`, `froide` (guerre froide), `deco`
(décolonisation), `europe` (construction européenne).

`PERSONNAGES` : 21 entrées `{nom, annees, role, r, t, fait}` où `role` est le rôle rédigé
en une à deux phrases, `r` l'id de catégorie, `t` l'id de tranche de frise et `fait` le
fait précis qui justifie cette tranche.

| Personnage | Catégorie | Tranche | Fait qui situe |
|---|---|---|---|
| Georges Clemenceau | `gm1` | `t1` | président du Conseil en 1917, mène la France à la victoire |
| Jean Jaurès | `gm1` | `t1` | assassiné le 31 juillet 1914 |
| Vladimir Lénine | `totalitarismes` | `t1` | prend le pouvoir en Russie en octobre 1917 |
| Joseph Staline | `totalitarismes` | `t2` | dirige l'URSS à partir de 1928 |
| Benito Mussolini | `totalitarismes` | `t2` | prend le pouvoir en Italie en 1922 |
| Adolf Hitler | `totalitarismes` | `t2` | arrive au pouvoir en 1933 |
| Franklin D. Roosevelt | `allies` | `t3` | engage les États-Unis dans la guerre en 1941 |
| Winston Churchill | `allies` | `t3` | Premier ministre britannique à partir de 1940 |
| Charles de Gaulle | `resistance` | `t3` | appel du 18 juin 1940 |
| Jean Moulin | `resistance` | `t3` | unifie la Résistance au sein du CNR en 1943 |
| Lucie Aubrac | `resistance` | `t3` | fait évader son mari des mains de la Gestapo en 1943 |
| Germaine Tillion | `resistance` | `t3` | réseau du Musée de l'Homme, déportée à Ravensbrück |
| Philippe Pétain | `vichy` | `t3` | chef de l'État français à partir de juillet 1940 |
| Harry S. Truman | `froide` | `t4` | doctrine d'endiguement, 1947 |
| Nikita Khrouchtchev | `froide` | `t4` | mur de Berlin en 1961, crise de Cuba en 1962 |
| Nehru | `deco` | `t4` | Premier ministre de l'Inde indépendante en 1947 |
| Nasser | `deco` | `t4` | nationalise le canal de Suez en 1956 |
| Robert Schuman | `europe` | `t4` | déclaration du 9 mai 1950 |
| Simone Veil | `europe` | `t5` | première présidente du Parlement européen élu, 1979 |
| Mikhaïl Gorbatchev | `froide` | `t5` | réformes qui mènent à la fin de l'URSS en 1991 |
| François Mitterrand | `europe` | `t5` | traité de Maastricht en 1992 |

Un personnage dont la vie publique traverse plusieurs tranches (de Gaulle, Staline, Simone
Veil) serait ambigu à placer : c'est le champ `fait` qui est affiché dans la manche Frise,
pas seulement le nom, ce qui rend la réponse déterminée.

Les rôles rédigés (une à deux phrases par personnage) sont écrits directement dans le
fichier ; ce sont eux qui alimentent la manche 1, le mémo et les flashcards.

### Les quatre manches

1. **Qui est-ce ?** (`#quiz`) : le rôle s'affiche sans le nom, QCM sur quatre noms.
2. **Frise** (`#frise`) : le personnage et son fait déterminant s'affichent, l'élève clique
   la tranche. Même helper `friseSVG` que le carnet des dates.
3. **Mémo** (`#memo`) : memory appariant le nom et une formule courte du rôle.
4. **Cartes** (`#cartes`) : flashcards Leitner : recto le nom, verso le rôle complet,
   auto-évaluation.

## Le moteur de cartes

Un helper `mapSVG(zones, {consigne, bonne, choisie})` commun aux deux carnets de géo dessine
en SVG inline des `<path>` porteurs d'un `data-id`, gère le clic, et colore la zone juste et
la zone choisie après réponse. Il joue le même rôle que `figSVG` dans `thales.html`.

Les tracés sont les **vraies frontières**, simplifiées puis figées en clair dans les fichiers.
Les régions viennent de l'IGN (Admin Express), sous Licence Ouverte Etalab, ce qui oblige à
citer la source sur les pages de géo ; les pays d'Europe, les fleuves et le planisphère
viennent de Natural Earth, domaine public. Le site reste sans dépendance, sans build et sans
accès réseau à l'exécution : ce sont des chaînes de caractères dans le HTML, au même titre que
les figures SVG de `thales.html`. La fabrication et les sources sont documentées dans
`docs/superpowers/outils/geo/`.

Le premier jet de la spec écartait cette voie au motif qu'elle supposerait un fichier de
données externe. C'était faux, et trois passes de dessin à la main n'avaient produit qu'un
hexagone méconnaissable, alors que l'objet même du programme est de reconnaître et de placer.

La cible tactile dépend du type de zone : le polygone lui-même pour une région, le tracé repris
en transparent et fortement épaissi pour un fleuve, un halo circulaire pour un point. Là où cela
ne suffit pas, la carte se joue **à la loupe** : un premier appui resserre le cadre, un second
désigne la zone. C'est indispensable pour l'Europe et pour les DROM, où la mesure donne 8 px
pour le Luxembourg et 1 px pour la Guadeloupe. À cette densité, viser au doigt mesurerait la
dextérité et non la connaissance.

## Carnet 3 : `geo-france.html`

### Données

- `REGIONS` : les 13 régions métropolitaines et leur capitale : Auvergne-Rhône-Alpes / Lyon,
  Bourgogne-Franche-Comté / Dijon, Bretagne / Rennes, Centre-Val de Loire / Orléans, Corse /
  Ajaccio, Grand Est / Strasbourg, Hauts-de-France / Lille, Île-de-France / Paris, Normandie /
  Rouen, Nouvelle-Aquitaine / Bordeaux, Occitanie / Toulouse, Pays de la Loire / Nantes,
  Provence-Alpes-Côte d'Azur / Marseille.
- `FLEUVES` : Seine, Loire, Garonne, Rhône.
- `RELIEFS` : Massif Armoricain, Bassin parisien, Bassin aquitain, Massif Central, Vosges,
  Jura, Alpes, Pyrénées : les ensembles figurant sur la carte physique du PDF.
- `MERS` : mer du Nord, la Manche, océan Atlantique, mer Méditerranée.
- `DROM` : Guadeloupe / Basse-Terre, Martinique / Fort-de-France, Guyane / Cayenne,
  Mayotte / Mamoudzou, La Réunion / Saint-Denis.

Deux fonds de carte : une France administrative (13 régions) et une France physique (fleuves
tracés en `<path>` bleus, reliefs en aplats, façades maritimes en zones cliquables autour du
contour), plus un planisphère très simplifié pour les DROM.

### Les quatre manches

1. **Les régions** (`#regions`) : « Clique sur Nouvelle-Aquitaine » sur la carte
   administrative.
2. **Les capitales** (`#capitales`) : la région est surlignée sur la carte, QCM sur quatre
   villes. Les distracteurs sont des capitales de régions voisines.
3. **Fleuves et reliefs** (`#relief`) : carte physique, « Clique sur la Garonne », « Clique
   sur le Jura ».
4. **Mers et DROM** (`#outremer`) : les quatre façades maritimes sur la carte de France,
   puis les cinq DROM à repérer sur le planisphère.

## Carnet 4 : `geo-europe.html`

### Données

- `UE` : les 27 États membres : Allemagne, Autriche, Belgique, Bulgarie, Chypre, Croatie,
  Danemark, Espagne, Estonie, Finlande, France, Grèce, Hongrie, Irlande, Italie, Lettonie,
  Lituanie, Luxembourg, Malte, Pays-Bas, Pologne, Portugal, Roumanie, Slovaquie, Slovénie,
  Suède, Tchéquie.
- `HORS_UE` : pays européens présents sur la carte mais non membres, avec la raison :
  Royaume-Uni (sorti en 2020), Suisse, Norvège, Islande, Serbie, Bosnie-Herzégovine,
  Albanie, Macédoine du Nord, Monténégro, Ukraine, Moldavie, Biélorussie, Turquie.
- `VOISINS` : les pays qui bordent la France sur la carte du PDF : Belgique, Luxembourg,
  Allemagne, Suisse, Italie, Espagne, plus le Royaume-Uni de l'autre côté de la Manche.

### Les quatre manches

1. **Placer** (`#placer`) : « Clique sur la Croatie », à la loupe : un premier appui approche,
   un second désigne. Après réponse la carte revient en vue d'ensemble, pour que le pays se
   retienne dans son contexte européen.
2. **Reconnaître** (`#nommer`) : un pays est surligné, QCM sur quatre noms : le sens inverse
   de la manche 1.
3. **Dans l'UE ou pas ?** (`#membre`) : un pays est surligné, réponse Oui / Non. C'est là que
   se jouent le Royaume-Uni, la Suisse, la Norvège et les Balkans ; l'explication rappelle
   pourquoi.
4. **Les voisins de la France** (`#voisins`) : repérer les pays qui bordent la France.

Les capitales européennes sont explicitement hors périmètre : le PDF ne demande que de
nommer et placer les pays de l'Union.

## Les deux fiches mémo

Même forme qu'`astuces.html` : page statique, deux onglets, aucun score.

- **`histoire-memo.html`** : onglet « Les 23 dates » (la frise en tête, puis les dates
  groupées par tranche) ; onglet « Les 21 personnages » (nom, années, rôle rédigé, groupés
  par catégorie et colorés comme dans le carnet).
- **`geo-memo.html`** : onglet « France » (les 13 régions et leurs capitales, les fleuves,
  les reliefs, les mers, les cinq DROM et leurs chefs-lieux) ; onglet « Europe » (les 27
  pays de l'UE).

Chaque fiche se termine par une section **« Ne confonds pas »** dans l'esprit d'`astuces.html` :

- Histoire : armistice (1918, on arrête de se battre) ≠ capitulation (1945, on se rend) ;
  Pétain ≠ de Gaulle ; révolutions russes de 1917 ≠ création de l'URSS ; chute du mur (1989)
  ≠ disparition de l'URSS (1991) ; traité de Rome (1957) ≠ traité de Maastricht (1992).
- Géographie : Union européenne ≠ Europe ≠ zone euro ≠ espace Schengen ; région ≠
  département ; DROM ≠ COM ; capitale de région (chef-lieu) ≠ plus grande ville de la région.

## Hors périmètre

- Les fichiers existants de français et de maths (`francais.html`, `maths.html`,
  `classes-grammaticales.html`, `fonctions-grammaticales.html`, `thales.html`,
  `astuces.html`) ne sont pas touchés. Seuls `index.html` et `CLAUDE.md` sont modifiés.
- Pas de saisie au clavier des noms : tout se joue au clic ou au QCM, la cible étant un
  téléphone.
- Pas de capitales européennes, pas de dates d'adhésion à l'UE, pas de repères hors PDF.
- Pas de zoom libre ni de déplacement de la carte au doigt : la loupe se limite à deux niveaux,
  vue d'ensemble et cadre resserré.
- Les reliefs et les mers restent schématiques : aucune donnée ne les délimite, ce sont des
  zones dessinées à la main, mais posées aux coordonnées géographiques réelles.

## Vérification

Pas de tests automatisés dans ce projet : chaque page se vérifie en l'ouvrant dans un
navigateur (`open geo-france.html`), en jouant une manche complète de chaque onglet, et en
contrôlant le rendu à 360 px de large.
