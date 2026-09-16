# Outils de développement

Quatre scripts Node, utiles pour relire le site avant un commit. **Le site lui-même reste sans dépendance ni build** : ces scripts ne servent qu'au développement, aucune page ne les charge ni n'en dépend pour fonctionner dans un navigateur.

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
