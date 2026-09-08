# La fiche mémo de physique-chimie

Date : 2026-09-08. Statut : validé.

## Objet

Une fiche `pc-memo.html` à relire avant un contrôle, sur le modèle des mémos histoire/géo : statique, deux onglets, pas de score ni d'appel Google Sheets, accent `--pc`, bouton 🏠 vers `physique-chimie.html`. Elle recopie les points clés du carnet `etats-matiere.html`, qui fait foi.

## Contenu

**Onglet « États et changements ».**
- Les trois états : pour chacun, forme propre, volume propre, compressibilité, et la vue microscopique des molécules.
- Les six changements d'état : nom en vedette, passage (solide → liquide...), exemple type.
- La courbe de l'eau : fusion à 0 °C, ébullition à 100 °C, palier = température constante pour un corps pur, deux états qui coexistent.
- Ne confonds pas : fondre ou dissoudre ; vapeur d'eau (invisible) ou nuage blanc (gouttelettes) ; évaporation ou ébullition.

**Onglet « Mélanges et mesures ».**
- Corps purs et mélanges : définitions, homogène/hétérogène avec exemples.
- Les solutions : miscible, soluble, saturée, solvant/soluté, conservation de la masse.
- La composition de l'air : 78 % de diazote, 21 % de dioxygène, 1 % d'autres gaz ; un litre d'air pèse environ 1,3 g.
- La masse volumique : ρ = m ÷ V et ses deux formes retournées, tableau des valeurs à connaître (huile 0,9, eau 1, aluminium 2,7, fer 7,9 g/cm³), pourquoi l'huile flotte.
- Ne confonds pas : masse ou masse volumique ; mélange homogène ou corps pur (limpide ne veut pas dire pur).

## Contrôle de cohérence

La seule donnée structurée partagée entre carnet et fiche est la liste des six noms de changements d'état, stockée dans l'objet `CHG` du carnet. `coherence.mjs` ne lit que des tableaux : le script est étendu, de façon générique, pour essayer `const NOM = {...}` quand `const NOM = [...]` est introuvable, et contrôler alors les `Object.values`. La commande de contrôle, ajoutée à `CLAUDE.md` :

```bash
node outils/coherence.mjs etats-matiere.html CHG label pc-memo.html
```

Le reste de la fiche (températures, proportions, masses volumiques) est de la rédaction propre, non contrôlable par ce mécanisme, comme les rubriques rédigées des autres mémos.

## Retouches annexes

- `physique-chimie.html` : carte « Fiche » vers le mémo, comme sur `geographie.html`.
- `CLAUDE.md` : la ligne des fiches mémo mentionne `pc-memo.html` et la nouvelle commande ; la rubrique Physique-Chimie mentionne ses deux cartes.
