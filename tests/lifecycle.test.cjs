const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function doc(){const classes=new Set(),styles=[];return {classes,styles,body:{classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k),remove:k=>classes.delete(k)}},head:{appendChild:s=>styles.push(s)},createElement:()=>({dataset:{},textContent:'',remove(){styles.splice(styles.indexOf(this),1)}})};}
function setup(data){
 const a=doc(),b=doc(),events={};
 class Plugin{async loadData(){return data}async saveData(s){this.saved=structuredClone(s)}register(){}registerEvent(){}addSettingTab(){}addCommand(){}}
 const mock={Plugin,PluginSettingTab:class{},Setting:class{}};
 const context={module:{exports:{}},require:n=>{assert.equal(n,'obsidian');return mock},console};
 vm.runInNewContext(fs.readFileSync('main.js','utf8'),context);
 const plugin=new context.module.exports.default();
 plugin.app={vault:{on:()=>{}},workspace:{containerEl:{ownerDocument:a},onLayoutReady:f=>f(),iterateAllLeaves:f=>f({view:{containerEl:{ownerDocument:b}}}),on:(name,f)=>{events[name]=f;return name}}};
 return {plugin,a,b,events};
}
test('load, toggle, popout, unload leave no appearance residue',async()=>{
 const {plugin,a,b,events}=setup(null);await plugin.onload();
 for(const d of [a,b]){assert.ok(d.classes.has('quiet-chat'));assert.ok(!d.classes.has('qc-hide-ribbon'));assert.equal(d.styles.length,1)}
 plugin.settings.enabled=false;await plugin.persist();assert.equal(a.classes.size,0);
 plugin.settings.enabled=true;plugin.settings.hideRibbon=true;await plugin.persist();assert.ok(a.classes.has('qc-hide-ribbon'));
 const c=doc();events['window-open']({}, {document:c});assert.ok(c.classes.has('quiet-chat'));
 events['window-close']({}, {document:c});assert.equal(c.classes.size,0);assert.equal(c.styles.length,0);
 plugin.onunload();for(const d of [a,b]){assert.equal(d.classes.size,0);assert.equal(d.styles.length,0)}
});
test('malformed persisted settings cannot inject CSS or exceed bounds',async()=>{
 const {plugin,a}=setup({radius:'0;}body{display:none}',width:100000,enabled:'false',hideRibbon:true});await plugin.onload();
 assert.equal(plugin.settings.radius,18);assert.equal(plugin.settings.width,1100);assert.equal(plugin.settings.enabled,true);
 assert.ok(!a.styles[0].textContent.includes('display:none'));plugin.onunload();
});
test('all distributed style rules require the plugin body class',()=>{
 const postcss=require('postcss');let count=0;
 postcss.parse(fs.readFileSync('styles.css','utf8')).walkRules(r=>{for(const selector of r.selectors){assert.ok(selector.startsWith('body.quiet-chat'),selector);count++}});
 assert.ok(count>40);
});

test('typography settings preserve decimals and clamp unsafe values',async()=>{
 const {plugin,a}=setup({fontSize:999,lineHeight:1.85,paragraphSpacing:NaN,listSpacing:-2,headingScale:1.15,headingTop:Infinity,headingBottom:24});
 await plugin.onload();
 assert.equal(plugin.settings.fontSize,24);assert.equal(plugin.settings.lineHeight,1.85);
 assert.equal(plugin.settings.paragraphSpacing,0.8);assert.equal(plugin.settings.listSpacing,0);
 assert.equal(plugin.settings.headingScale,1.15);assert.equal(plugin.settings.headingTop,16);
 assert.ok(a.styles[0].textContent.includes('--qc-heading-bottom: 24px'));
 plugin.onunload();
});

test('header hiding follows its setting in existing and new windows',async()=>{
 const {plugin,a,b,events}=setup({hideHeader:true});await plugin.onload();
 for(const d of [a,b])assert.ok(d.classes.has('qc-hide-header'));
 plugin.settings.hideHeader=false;await plugin.persist();
 for(const d of [a,b]){assert.ok(d.classes.has('quiet-chat'));assert.ok(!d.classes.has('qc-hide-header'))}
 const c=doc();events['window-open']({}, {document:c});assert.ok(!c.classes.has('qc-hide-header'));
 plugin.settings.hideHeader=true;await plugin.persist();
 for(const d of [a,b,c])assert.ok(d.classes.has('qc-hide-header'));
 plugin.settings.enabled=false;await plugin.persist();
 for(const d of [a,b,c])assert.ok(!d.classes.has('qc-hide-header'));
 plugin.onunload();for(const d of [a,b,c]){assert.equal(d.classes.size,0);assert.equal(d.styles.length,0)}
});

test('hidden Markdown headers keep native actions in a corner hover target',()=>{
 const postcss=require('postcss'),root=postcss.parse(fs.readFileSync('styles.css','utf8'));
 const leaf='body.quiet-chat.qc-hide-header .mod-root .workspace-leaf-content[data-type="markdown"]';
 const header=leaf+' > .view-header',actions=header+' > .view-actions';
 const rule=(selector,media)=>{
  let found;root.walkRules(r=>{
   const parentMatches=media?r.parent.type==='atrule'&&r.parent.params===media:r.parent.type==='root';
   if(parentMatches&&r.selectors.includes(selector))found=r;
  });assert.ok(found,selector);return Object.fromEntries(found.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 };
 const target=rule(header);
 // Explicit flex display overrides both the plugin's blanket hide rule and
 // Obsidian's body:not(.show-view-header) rule. Positioning reclaims the row.
 assert.equal(target.display,'flex');assert.equal(target.position,'absolute');
 assert.equal(target.top,'0');assert.equal(target.right,'8px');
 assert.equal(target.width,'max-content');assert.equal(target.height,'52px');
 assert.equal(rule(leaf+' > .view-content').height,'100%');
 assert.equal(rule(header+' > .view-header-left').display,'none');
 assert.equal(rule(header+' > .view-header-title-container').display,'none');
 const idle=rule(actions);assert.equal(idle.opacity,'0');assert.equal(idle['pointer-events'],'none');
 const shown=rule(header+':is(:hover, :focus-within) > .view-actions');
 assert.equal(shown.opacity,'1');assert.equal(shown['pointer-events'],'auto');assert.equal(shown['transition-delay'],'0ms');
 assert.equal(rule(header+':has(.has-active-menu) > .view-actions').opacity,'1');
 assert.equal(rule(actions,'(hover: none)').opacity,'1');
 assert.equal(rule(actions,'(prefers-reduced-motion: reduce)').transition,'none');
 assert.equal(rule(header,'print').display,'none');
 // Hovering the note body must not reveal the controls or intercept its clicks.
 root.walkRules(r=>{for(const s of r.selectors)assert.ok(!s.includes('.workspace-leaf-content:hover'),s)});
});
