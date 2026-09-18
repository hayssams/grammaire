# Outils de développement

Trois scripts Node, utiles pour relire le site avant un commit. **Le site lui-même reste sans dépendance ni build** : ces scripts ne servent qu'au développement, aucune page ne les charge ni n'en dépend pour fonctionner dans un navigateur.

## `verif.mjs`

Vérificateur structurel d'une page : le JS inline compile-t-il, les liens internes (`href="*.html"`) pointent-ils vers un fichier qui existe, chaque onglet a-t-il son panneau et réciproquement, et une page à score appelle-t-elle bien `logResult` une fois par manche.

```bash
node outils/verif.mjs index.html francais.html classes-grammaticales.html …
```

Affiche `Tout est bon.` si tout passe, sinon une ligne `KO` par problème.

## `coherence.mjs`

Vérifie qu'une fiche mémo (`histoire-memo.html`, `geo-memo.html`) n'a pas dérivé du carnet dont elle recopie les données à la main. Il charge le tableau JS du carnet et contrôle que chaque valeur des champs demandés apparaît bien dans le texte de la fiche, en tenant compte des entités HTML, des apostrophes typographiques et des nombres, qu'un carnet écrit `7.9` et une fiche `7,9`. Quand plusieurs champs sont demandés, ils doivent se trouver sur une même ligne de la fiche : sans cette exigence, « Fer » et « 7,9 » se validaient chacun de leur côté, et intervertir deux lignes d'un tableau passait inaperçu.

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

Le script `verifie-masse.mjs`, qui contrôle le carnet `masse-volumique.html`, est parti avec lui dans le dépôt `sciences`.
