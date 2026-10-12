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
