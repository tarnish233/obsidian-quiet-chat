import {build} from 'esbuild';
import postcss from 'postcss';
import {readFile,writeFile} from 'node:fs/promises';
const css=postcss.parse(await readFile('src/theme.css','utf8')+'\n'+await readFile('src/typography.css','utf8'));
// Obsidian marks rendered editor list depth with HyperMD-list-line-N.
// Add spacing only at adjacent level changes, never on continuation lines.
for(let level=1;level<=32;level++) {
 css.append(postcss.parse(`
 .markdown-source-view.mod-cm6 .cm-line.HyperMD-list-line-${level}:not(.HyperMD-list-line-nobullet) + .cm-line.HyperMD-list-line:not(.HyperMD-list-line-${level}):not(.HyperMD-list-line-nobullet) {
   padding-top: calc(var(--list-spacing) + var(--qc-list-level-gap, 0px));
 }
 `));
}
css.walkRules(rule=>{
 rule.selectors=rule.selectors.map(s=>{
  s=s.trim();
  if(s.startsWith('body')) return s.replace(/^body/,'body.quiet-chat');
  if(s.startsWith('.theme-')) return 'body.quiet-chat'+s;
  return 'body.quiet-chat '+s;
 });
});
await writeFile('styles.css',css.toString()+'\n'+await readFile('src/options.css','utf8'));
await build({entryPoints:['src/main.ts'],outfile:'main.js',bundle:true,external:['obsidian'],platform:'browser',format:'cjs',target:'es2018',banner:{js:'/* Quiet Chat | MIT | https://github.com/tarnish233/obsidian-quiet-chat */'}});
