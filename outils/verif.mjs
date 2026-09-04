// Vérificateur des pages du site. Usage : node verif.mjs page.html [page2.html ...]
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

let echecs = 0;
const ko = (f, m) => { console.error(`KO  ${f} : ${m}`); echecs++; };

for (const f of process.argv.slice(2)) {
  const html = readFileSync(f, "utf8");
  const dir = dirname(resolve(f));

  // 1. le JS inline compile-t-il ?
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  // une page chapeau (index, francais, maths...) n'a pas de script : c'est normal
  scripts.forEach((src, i) => {
    try { new vm.Script(src, { filename: `${f}#script${i}` }); }
    catch (e) { ko(f, `script ${i} ne compile pas : ${e.message}`); }
  });

  // 2. les liens internes pointent-ils sur un fichier existant ?
  for (const m of html.matchAll(/href="([^"#:]+\.html)"/g)) {
    if (!existsSync(resolve(dir, m[1]))) ko(f, `lien mort vers ${m[1]}`);
  }

  // 3. chaque onglet a-t-il son panneau, et réciproquement ?
  const onglets = [...html.matchAll(/data-panel="([^"]+)"/g)].map(m => m[1]);
  const panneaux = [...html.matchAll(/<section class="panel[^"]*" id="([^"]+)"/g)].map(m => m[1]);
  if (onglets.length) {
    for (const o of onglets) if (!panneaux.includes(o)) ko(f, `onglet "${o}" sans panneau`);
    for (const p of panneaux) if (!onglets.includes(p)) ko(f, `panneau "${p}" sans onglet`);
    const actifs = [...html.matchAll(/<section class="panel on"/g)].length;
    if (actifs !== 1) ko(f, `${actifs} panneau(x) marqué(s) "on", il en faut exactement 1`);
  }

  // 4. une page d'exercice doit journaliser ses résultats
  if (/function logResult/.test(html)) {
    const page = html.match(/page:"([^"]+)"/);
    if (!page) ko(f, "logResult sans champ page");
    const manches = [...html.matchAll(/logResult\("([^"]+)"/g)].map(m => m[1]);
    if (onglets.length && manches.length !== onglets.length)
      ko(f, `${manches.length} appel(s) à logResult pour ${onglets.length} onglets`);
  }
  console.log(`--  ${f} : ${scripts.length} script(s), ${panneaux.length} panneau(x)`);
}
console.log(echecs ? `\n${echecs} problème(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);