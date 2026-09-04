# Fonds de carte des carnets de géographie

`fonds.json` contient les tracés SVG prêts à être recopiés dans `geo-france.html`
et `geo-europe.html`. Les carnets embarquent ces tracés en clair : le site reste
sans dépendance, sans build et sans accès réseau à l'exécution. Ce répertoire
n'est qu'un outil de fabrication, il n'est pas servi.

## Sources et licences

- **Régions françaises** : IGN, Admin Express COG (édition 2018), récupérées via
  `github.com/gregoiredavid/france-geojson`. Diffusées sous **Licence Ouverte
  (Etalab)** : réutilisation libre, y compris pour un site public, à la seule
  condition de citer la source. **Les pages de géo doivent donc porter la mention
  « Fonds de carte : IGN, Admin Express, sous Licence Ouverte (Etalab). »**
- **Pays d'Europe, planisphère et fleuves** : Natural Earth 50 m, récupérés via
  `github.com/nvkelso/natural-earth-vector`. **Domaine public**, aucune
  attribution exigée.
- **Reliefs et mers** : zones schématiques dessinées pour ce projet, posées aux
  coordonnées géographiques réelles. Aucune source tierce.

## Refabriquer les tracés

`conv.py` porte la projection, la simplification de Douglas-Peucker, le calcul de
centroïde et les tests d'appartenance. Les fichiers GeoJSON sources ne sont pas
commités : ils pèsent plusieurs mégaoctets et se retéléchargent depuis les deux
dépôts ci-dessus.

## Ce que chaque fond contient

| Fond | Repère | Zones |
|---|---|---|
| `FOND_ADMIN` | `0 0 320 340` | les 13 régions métropolitaines, avec leur capitale |
| `FOND_PHYSIQUE` | `0 0 320 340` | 8 reliefs (`aire`) et 4 fleuves (`trait`) |
| `FOND_EUROPE` | `0 0 360 320` | 40 pays, `ue: true` pour les 27 membres |
| `FOND_MONDE` | `0 0 360 180` | les continents (inertes), les 5 DROM et la métropole |

Chaque zone porte `id`, `nom`, `type` (`aire`, `trait` ou `point`), le tracé `d`
et l'ancre `cx`/`cy`. Les ancres ont été vérifiées : chacune tombe dans sa propre
zone et dans aucune autre.
