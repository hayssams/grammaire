// Vérifie qu'une fiche mémo n'a pas dérivé du carnet dont elle recopie les données.
// Usage : node coherence.mjs CARNET.html TABLEAU champ[,champ] MEMO.html
// Exemple : node coherence.mjs histoire-dates.html DATES d,label histoire-memo.html
import { readFileSync } from "node:fs";

const [carnet, nomTableau, champs, memo] = process.argv.slice(2);
if (!memo) { console.error("usage: coherence.mjs CARNET.html TABLEAU champs MEMO.html"); process.exit(2); }

function extraire(fichier, nom) {
  const html = readFileSync(fichier, "utf8");
  const m = html.match(new RegExp(`const ${nom}\\s*=\\s*\\[[\\s\\S]*?\\n\\];`));
  if (m) return new Function(m[0] + `; return ${nom};`)();
  // un objet map convient aussi : on contrôle alors ses valeurs
  const o = html.match(new RegExp(`const ${nom}\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
  if (!o) throw new Error(`${nom} introuvable dans ${fichier}`);
  return Object.values(new Function(o[0] + `; return ${nom};`)());
}

// normalise pour comparer du texte HTML a du texte JS : entites, apostrophes, espaces
const norm = s => String(s)
  .replace(/&eacute;/g,"é").replace(/&egrave;/g,"è").replace(/&agrave;/g,"à")
  .replace(/&ccedil;/g,"ç").replace(/&ocirc;/g,"ô").replace(/&icirc;/g,"î")
  .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;|&rsquo;|’/g,"'")
  .replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().toLowerCase();

// decoupe la fiche en "lignes" logiques : une par conteneur tr/li/div, meme quand une balise
// interne (un <p> de paragraphe, par exemple) etale ce conteneur sur plusieurs lignes source.
// Sert uniquement quand plusieurs champs sont controles pour une meme entree : il faut alors
// qu'ils apparaissent ensemble sur une meme ligne, et pas juste quelque part dans la page.
const decoupeLignes = html => html
  .replace(/\r?\n/g, " ") // les retours a la ligne source n'ont pas de sens ici : seuls les
                          // conteneurs tr/li/div en ont un
  .replace(/<(?:tr|li|div)\b[^>]*>/gi, "\n")
  .replace(/<\/(?:tr|li|div)>/gi, "\n")
  .split("\n")
  .map(norm)
  .filter(Boolean);

const htmlMemo = readFileSync(memo, "utf8");
const items = extraire(carnet, nomTableau);
const cles = champs.split(",");
const texteMemo = cles.length === 1 ? norm(htmlMemo) : null;
const lignes = cles.length > 1 ? decoupeLignes(htmlMemo) : null;

// un nombre s'ecrit 7.9 en JS et 7,9 dans une fiche : les deux ecritures conviennent
const variantesDe = brut => {
  const v = norm(brut);
  return typeof brut === "number" ? [v, v.replace(".", ",")] : [v];
};

let manquants = 0;
for (const it of items) {
  if (cles.length === 1) {
    const c = cles[0];
    const brut = it[c];
    const variantes = variantesDe(brut);
    if (variantes[0] && !variantes.some(x => texteMemo.includes(x))) {
      console.error(`ABSENT de ${memo} : ${nomTableau}.${c} = « ${brut} »`);
      manquants++;
    }
  } else {
    // tous les champs controles doivent se trouver ensemble, sur une meme ligne de la fiche
    const trouve = lignes.some(ligne => cles.every(c => {
      const variantes = variantesDe(it[c]);
      return !variantes[0] || variantes.some(x => ligne.includes(x));
    }));
    if (!trouve) {
      const detail = cles.map(c => `${c} = « ${it[c]} »`).join(", ");
      console.error(`ABSENT de ${memo}, sur une même ligne : ${nomTableau} (${detail})`);
      manquants++;
    }
  }
}
console.log(`${items.length} entrée(s) de ${nomTableau} contrôlée(s) sur ${cles.length} champ(s) : ` +
            (manquants ? `${manquants} absence(s).` : "la fiche est à jour."));
process.exit(manquants ? 1 : 0);
