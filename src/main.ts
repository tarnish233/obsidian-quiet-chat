import {Plugin,PluginSettingTab,Setting} from 'obsidian';
import {DEFAULTS,normalize,Settings} from './settings';
import {installSwitcherIcons} from './switcher-icons';
const CLASSES=['quiet-chat','qc-hide-ribbon','qc-hide-status','qc-hide-header','qc-system-fonts'];
export default class QuietChat extends Plugin {
 settings:Settings={...DEFAULTS};
 private documents=new Map<Document,HTMLStyleElement>();
 async onload(){
  this.settings=normalize(await this.loadData());
  this.attach(this.app.workspace.containerEl.ownerDocument);
  this.app.workspace.onLayoutReady(()=>{
   installSwitcherIcons(this,()=>this.settings.enabled);
   this.app.workspace.iterateAllLeaves(leaf=>this.attach(leaf.view.containerEl.ownerDocument));
  });
  this.registerEvent(this.app.workspace.on('window-open',(_workspaceWindow,win)=>this.attach(win.document)));
  this.registerEvent(this.app.workspace.on('window-close',(_workspaceWindow,win)=>this.clean(win.document)));
  this.addSettingTab(new QuietSettings(this.app,this));
  this.addCommand({id:'toggle-appearance',name:'Toggle appearance',callback:async()=>{this.settings.enabled=!this.settings.enabled;await this.persist();}});
  this.addCommand({id:'toggle-ribbon',name:'Toggle ribbon hiding',callback:async()=>{this.settings.hideRibbon=!this.settings.hideRibbon;await this.persist();}});
 }
 private attach(doc:Document){
  if(!this.documents.has(doc)){
   const style=doc.createElement('style');style.dataset.quietChat='options';doc.head.appendChild(style);this.documents.set(doc,style);
  }
  this.apply(doc);
 }
 private apply(doc:Document){
  const s=this.settings;
  for(const [name,enabled] of [['quiet-chat',s.enabled],['qc-hide-ribbon',s.enabled&&s.hideRibbon],['qc-hide-status',s.enabled&&s.hideStatus],['qc-hide-header',s.enabled&&s.hideHeader],['qc-system-fonts',s.enabled&&s.systemFonts]] as const) doc.body.classList.toggle(name,enabled);
  const style=this.documents.get(doc);
  if(style)style.textContent=`body.quiet-chat { --qc-pane-radius: ${s.radius}px; --file-line-width: ${s.width}px; }`;
 }
 async persist(){
  this.settings=normalize(this.settings);
  for(const doc of this.documents.keys())this.apply(doc);
  await this.saveData(this.settings);
 }
 private clean(doc:Document){
  for(const name of CLASSES)doc.body.classList.remove(name);
  this.documents.get(doc)?.remove();this.documents.delete(doc);
 }
 onunload(){for(const doc of [...this.documents.keys()])this.clean(doc);}
}
class QuietSettings extends PluginSettingTab {
 constructor(app:Plugin['app'],private plugin:QuietChat){super(app,plugin);}
 display(){
  const el=this.containerEl;el.empty();
  el.createEl('h2',{text:'Quiet Chat'});
  el.createEl('p',{text:'建议搭配默认主题。仅改变外观，不修改笔记、快捷键或 Obsidian 配置。 / Best with the default theme. No note or core-setting changes.'});
  const toggles:[keyof Pick<Settings,'enabled'|'hideRibbon'|'hideStatus'|'hideHeader'|'systemFonts'>,string,string][]=[
   ['enabled','启用外观 / Enable appearance','暂时关闭可恢复底层主题。'],
   ['hideRibbon','隐藏左侧功能区 / Hide ribbon','默认不隐藏；若仍不可见，请在 Obsidian 外观设置中开启功能区。'],
   ['hideStatus','隐藏状态栏 / Hide status bar','减少底部常驻元素。'],
   ['hideHeader','隐藏笔记标题栏 / Hide view header','保留顶部标签和侧栏切换按钮。'],
   ['systemFonts','使用系统字体 / Use system fonts','只覆盖界面和正文，保留代码字体。']];
  for(const [key,name,desc] of toggles)new Setting(el).setName(name).setDesc(desc).addToggle(t=>t.setValue(this.plugin.settings[key]).onChange(async v=>{this.plugin.settings[key]=v;await this.plugin.persist();}));
  new Setting(el).setName('面板圆角 / Pane radius').addSlider(s=>s.setLimits(0,28,1).setValue(this.plugin.settings.radius).setDynamicTooltip().onChange(async v=>{this.plugin.settings.radius=v;await this.plugin.persist();}));
  new Setting(el).setName('正文宽度 / Text width').setDesc('560–1100px；需要开启编辑器的「缩减栏宽」。 / Requires Readable line length.').addSlider(s=>s.setLimits(560,1100,20).setValue(this.plugin.settings.width).setDynamicTooltip().onChange(async v=>{this.plugin.settings.width=v;await this.plugin.persist();}));
  new Setting(el).setName('恢复默认 / Reset').addButton(b=>b.setButtonText('Reset').onClick(async()=>{this.plugin.settings={...DEFAULTS};await this.plugin.persist();this.display();}));
 }
}
