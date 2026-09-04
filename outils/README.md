# Outils de développement

Deux scripts Node, utiles pour relire le site avant un commit. **Le site lui-même reste sans dépendance ni build** : ces scripts ne servent qu'au développement, aucune page ne les charge ni n'en dépend pour fonctionner dans un navigateur.

## `verif.mjs`

Vérificateur structurel d'une page : le JS inline compile-t-il, les liens internes (`href="*.html"`) pointent-ils vers un fichier qui existe, chaque onglet a-t-il son panneau et réciproquement, et une page à score appelle-t-elle bien `logResult` une fois par manche.

```bash
node outils/verif.mjs index.html francais.html classes-grammaticales.html …
```

Affiche `Tout est bon.` si tout passe, sinon une ligne `KO` par problème.

## `coherence.mjs`

Vérifie qu'une fiche mémo (`histoire-memo.html`, `geo-memo.html`) n'a pas dérivé du carnet dont elle recopie les données à la main. Il charge le tableau JS du carnet et contrôle que chaque valeur des champs demandés apparaît bien dans le texte de la fiche, en tenant compte des entités HTML et des apostrophes typographiques.

```bash
node outils/coherence.mjs CARNET.html TABLEAU champ[,champ] MEMO.html
node outils/coherence.mjs histoire-dates.html DATES d,label histoire-memo.html
```

Affiche `la fiche est à jour.` si tout y est, sinon une ligne `ABSENT` par valeur manquante.

À lancer après toute modification d'une donnée dans un carnet, avant de reporter le changement dans la fiche correspondante.
