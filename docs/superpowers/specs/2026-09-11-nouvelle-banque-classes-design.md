# Nouvelle banque de phrases pour le carnet des classes grammaticales

Date : 2026-09-11. Statut : validé.

## Objet

L'élève a fait et refait les exercices de `classes-grammaticales.html` : la banque actuelle est épuisée. Les trois banques de données (`QUIZ`, `CAM`, `MEMO`) sont **remplacées intégralement** par du contenu neuf, un cran au-dessus en difficulté (cas pièges type brevet). Aucun code ne change : mêmes tableaux, mêmes champs, même tirage (10 questions, 6 paires, 6 associations), même `logResult`, même CSS. Le carnet jumeau `fonctions-grammaticales.html` n'est pas touché, seules les données changent.

## QUIZ : 54 phrases, 6 par classe

Remplace les 51 phrases actuelles. Chaque item garde la forme `{s, c, w}` : phrase avec le mot cible entre `[[...]]`, id de classe, explication courte qui donne le **test de reconnaissance** (et pas seulement la bonne réponse).

La montée en difficulté vient des cas choisis :

- **nom** : infinitifs et mots employés comme noms (le goûter, un devoir, le pouvoir, la marche), noms abstraits ;
- **verbe** : formes qui ressemblent à autre chose (participe dans un temps composé, impératif en tête de phrase, verbe d'état) ;
- **adjectif** : participes passés et présents employés comme adjectifs (une porte fermée, une histoire captivante), adjectifs attributs loin du nom ;
- **déterminant** : leur, tout, chaque, certains, nul, partitifs ;
- **pronom** : en, y, dont, nous complément, le neutre, pronoms indéfinis ;
- **adverbe** : tout (tout étonnée), plus, ensemble, debout, adverbes en position inattendue ;
- **préposition** : dès, malgré, parmi, durant, envers ;
- **conjonction** : puisque, lorsque, or, ni, tandis que (mot simple interrogé) ;
- **interjection** : eh bien, ouf, tiens, allons, bof (formes moins évidentes que Chut/Bravo).

## CAM : 13 nouveaux caméléons

Remplace les 13 paires actuelles, aucun mot repris. Chaque item garde la forme `{w, a:{s,c}, b:{s,c}, t}` où `t` énonce le test qui départage. Mots retenus (nature a / nature b) :

1. tout : déterminant / adverbe
2. leur : déterminant / pronom
3. si : conjonction / adverbe
4. en : préposition / pronom
5. or : conjonction / nom
6. plus : adverbe / nom
7. devoir : verbe / nom
8. sourire : nom / verbe
9. derrière : préposition / adverbe
10. porte : nom / verbe
11. marche : nom / verbe
12. entre : préposition / verbe (entrer)
13. boucher : nom / verbe

## MEMO : 9 nouveaux exemples

Remplace les 9 exemples actuels, un par classe, même format court (« Une [[averse]] soudaine »). Les exemples restent simples : le memory associe étiquette et exemple, ce n'est pas la manche difficile.

## Contraintes d'écriture

- Tout en français, apostrophes droites comme dans le fichier actuel, aucune entité HTML nécessaire (le script échappe via `esc`).
- Une seule cible `[[...]]` par phrase (`phraseHTML` ne remplace que la première).
- Chaque `c` est un id existant de `CLASSES` ; les deux phrases d'un caméléon utilisent le même mot (même graphie, majuscule initiale tolérée).
- Phrases courtes, lisibles sur téléphone, univers d'une élève de 3e.

## Vérification

- Ouverture de la page dans le navigateur (`open classes-grammaticales.html`), une partie de chaque manche.
- Contrôle par script (node, extraction des tableaux comme le fait `outils/coherence.mjs`) : chaque phrase contient un `[[...]]`, chaque `c` renvoie à une classe existante, chaque caméléon utilise le même mot dans ses deux phrases, effectifs attendus (54 / 13 / 9).

## Hors périmètre

`fonctions-grammaticales.html`, `astuces.html` (la fiche mémo ne recopie pas ces banques), tout changement de comportement ou de style.
