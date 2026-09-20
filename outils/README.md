# Outils de développement

Cinq scripts Node, utiles pour relire le site avant un commit. **Le site lui-même reste sans dépendance ni build** : ces scripts ne servent qu'au développement, aucune page ne les charge ni n'en dépend pour fonctionner dans un navigateur.

## `verif.mjs`

Vérificateur structurel d'une page : le JS inline compile-t-il, les liens internes (`href="*.html"`) pointent-ils vers un fichier qui existe, chaque onglet a-t-il son panneau et réciproquement, et une page à score appelle-t-elle bien `logResult` une fois par manche.

```bash
node outils/verif.mjs index.html francais.html classes-grammaticales.html …
```

Affiche `Tout est bon.` si tout passe, sinon une ligne `KO` par problème.

## `coherence.mjs`

Vérifie qu'une fiche mémo (`histoire-memo.html`, `geo-memo.html`, `pc-memo.html`) n'a pas dérivé du carnet dont elle recopie les données à la main. Il charge le tableau JS du carnet et contrôle que chaque valeur des champs demandés apparaît bien dans le texte de la fiche, en tenant compte des entités HTML, des apostrophes typographiques et des nombres, qu'un carnet écrit `7.9` et une fiche `7,9`. Quand plusieurs champs sont demandés, ils doivent se trouver sur une même ligne de la fiche : sans cette exigence, « Fer » et « 7,9 » se validaient chacun de leur côté, et intervertir deux lignes d'un tableau passait inaperçu.

```bash
node outils/coherence.mjs CARNET.html TABLEAU champ[,champ] MEMO.html
node outils/coherence.mjs histoire-dates.html DATES d,label histoire-memo.html
```

Affiche `la fiche est à jour.` si tout y est, sinon une ligne `ABSENT` par valeur manquante.

La règle de la ligne commune suppose qu'une entrée de la fiche tient dans un seul élément, une ligne de tableau ou un bloc. Une fiche qui éclaterait les champs d'une même entrée en éléments frères ferait échouer le contrôle à tort ; une fiche qui empilerait plusieurs entrées dans un seul bloc le rendrait au contraire trop permissif. Aucune fiche actuelle n'est dans ce cas, mais c'est à savoir avant de remettre en forme une fiche.

À lancer après toute modification d'une donnée dans un carnet, avant de reporter le changement dans la fiche correspondante.

## `verifie-banque.mjs`

Contrôle la banque de phrases de `classes-grammaticales.html` : les effectifs (54 phrases, 13 caméléons, 9 exemples), la présence d'une cible `[[...]]` par phrase, la validité des classes citées et la cohérence des caméléons.

```bash
node outils/verifie-banque.mjs
```

Se termine par `La banque est conforme`.

## `verifie-masse.mjs`

Contrôle le carnet `masse-volumique.html` : le script compile, chaque question est bien formée, les tables `METAUX` et `LIQUIDES` sont triées, les quatre ancres de montage sont en place, et les onglets, les panneaux et les clés de `MANCHES` forment le même ensemble. Il rejoue aussi les moteurs de figures pour chaque question, afin qu'une figure qui plante ou qui déborde du cadre ne casse pas la page en silence.

```bash
node outils/verifie-masse.mjs
```

Se termine par `N manche(s) contrôlée(s) : le carnet est conforme.`

Le câblage est contrôlé de façon asymétrique, parce qu'un carnet se construit onglet par onglet : une manche sans onglet ni panneau est toujours une erreur, mais un onglet pas encore branché est seulement annoncé tant que les cinq manches ne sont pas écrites, et redevient une erreur dès que le carnet est complet.

## `verifie-thales.mjs`

Contrôle le carnet `thales-brevet.html` et la fiche `maths-memo.html` ensemble. Il fait ce que font les autres scripts (le JS compile, chaque question est bien formée, les figures se rendent sans `NaN` ni débordement, onglets, panneaux et clés de `MANCHES` forment le même ensemble), et une chose qu'aucun autre ne fait : **il refait les mathématiques**.

Pour chaque question à figure, il reconstitue les longueurs à partir des étiquettes, convertit les unités (`1,2 m` vaut 120 cm), complète les segments manquants par les relations d'alignement (`AB = AM + MB` en triangle, `MB = AM + AB` en papillon, puisque le point de croisement est au milieu), propage l'égalité des rapports de Thalès jusqu'à atteindre l'inconnue, et compare le résultat à la réponse annoncée. Une réponse fausse ne peut donc pas partir chez l'élève, même accompagnée d'une explication convaincante. Il confronte de la même façon le champ `paralleles` d'une démonstration au calcul réel des deux rapports.

Il contrôle aussi le **placement des étiquettes** de chaque figure : deux étiquettes qui se recouvrent, ou une étiquette coupée par le bord du cadre, rendent une figure illisible sans rien casser, et personne ne s'en aperçoit avant l'élève. Les boîtes de texte sont estimées à partir de largeurs mesurées dans Chrome ; l'estimation reste grossière, le seuil de 20 % ne vise que les régressions franches, et la mesure dans un navigateur reste la référence pour un cas limite.

Enfin il compare le carnet à la fiche : chaque étape de `REDACTIONS` doit se retrouver mot pour mot dans `maths-memo.html`, avec la normalisation de `coherence.mjs` (entités HTML, apostrophes, balises, espaces). C'est le contrôle que `coherence.mjs` ne peut pas rendre ici, ses tableaux devant être des littéraux autonomes, alors que les données de Thalès utilisent `...TRI` et `eq3(...)`. Les cinq figures de la fiche sont contrôlées de la même façon : ce sont des rendus figés des figures du carnet, et elles doivent en être le rendu exact.

```bash
node outils/verifie-thales.mjs [carnet] [fiche]
```

Se termine par `N manche(s) contrôlée(s) : N question(s) rejouée(s) en mathématiques, N étape(s) de rédaction retrouvée(s) dans maths-memo.html : le carnet est conforme.`
