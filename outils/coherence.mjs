// Vérifie qu'une fiche mémo n'a pas dérivé du carnet dont elle recopie les données.
// Usage : node coherence.mjs CARNET.html TABLEAU champ[,champ] MEMO.html
// Exemple : node coherence.mjs histoire-dates.html DATES d,label histoire-memo.html
import { readFileSync } from "node:fs";

const [carnet, nomTableau, champs, memo] = process.argv.slice(2);
if (!memo) { console.error("usage: coherence.mjs CARNET.html TABLEAU champs MEMO.html"); process.exit(2); }

function extraire(fichier, nom) {
  const html = readFileSync(fichier, "utf8");
  const m = html.match(new RegExp(`const ${nom}\\s*=\\s*\\[[\\s\\S]*?\\n\\];`));
  if (!m) throw new Error(`${nom} introuvable dans ${fichier}`);
  return new Function(m[0] + `; return ${nom};`)();
}

// normalise pour comparer du texte HTML a du texte JS : entites, apostrophes, espaces
const norm = s => String(s)
  .replace(/&eacute;/g,"é").replace(/&egrave;/g,"è").replace(/&agrave;/g,"à")
  .replace(/&ccedil;/g,"ç").replace(/&ocirc;/g,"ô").replace(/&icirc;/g,"î")
  .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&#39;|&rsquo;|’/g,"'")
  .replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().toLowerCase();

const items = extraire(carnet, nomTableau);
const texteMemo = norm(readFileSync(memo, "utf8"));
const cles = champs.split(",");

let manquants = 0;
for (const it of items) {
  for (const c of cles) {
    const v = norm(it[c]);
    if (v && !texteMemo.includes(v)) {
      console.error(`ABSENT de ${memo} : ${nomTableau}.${c} = « ${it[c]} »`);
      manquants++;
    }
  }
}
console.log(`${items.length} entrée(s) de ${nomTableau} contrôlée(s) sur ${cles.length} champ(s) : ` +
            (manquants ? `${manquants} absence(s).` : "la fiche est à jour."));
process.exit(manquants ? 1 : 0);
