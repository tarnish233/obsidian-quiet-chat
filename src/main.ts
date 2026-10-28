import {Plugin,PluginSettingTab,Setting} from 'obsidian';
import {DEFAULTS,normalize,Settings,RANGES} from './settings';
import {installSwitcherIcons} from './switcher-icons';
import {installTabIcons} from './tab-icons';
const CLASSES=['quiet-chat','qc-hide-ribbon','qc-hide-status','qc-hide-header','qc-system-fonts'];
const OPTIONS=[
 ['radius','--qc-option-radius','px'],['width','--qc-option-width','px'],
 ['fontSize','--qc-option-font-size','px'],['lineHeight','--qc-option-line-height',''],
 ['paragraphSpacing','--qc-option-paragraph-spacing','em'],['listSpacing','--qc-option-list-spacing','em'],
 ['listIndent','--qc-option-list-indent','px'],['listLevelGap','--qc-option-list-level-gap','px'],
 ['headingScale','--qc-option-heading-scale',''],['headingTop','--qc-option-heading-top','px'],
 ['headingBottom','--qc-option-heading-bottom','px']
] as const;
type OriginalProperty={value:string;priority:string};
export default class QuietChat extends Plugin {
 settings:Settings={...DEFAULTS};
 private documents=new Map<Document,Map<string,OriginalProperty>>();
 async onload(){
  this.settings=normalize(await this.loadData());
  this.attach(this.app.workspace.containerEl.ownerDocument);
  this.app.workspace.onLayoutReady(()=>{
   installSwitcherIcons(this,()=>this.settings.enabled);
   installTabIcons(this);
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
   const originals=new Map<string,OriginalProperty>();
   for(const [,name] of OPTIONS)originals.set(name,{value:doc.body.style.getPropertyValue(name),priority:doc.body.style.getPropertyPriority(name)});
   this.documents.set(doc,originals);
  }
  this.apply(doc);
 }
 private apply(doc:Document){
  const s=this.settings;
  for(const [name,enabled] of [['quiet-chat',s.enabled],['qc-hide-ribbon',s.enabled&&s.hideRibbon],['qc-hide-status',s.enabled&&s.hideStatus],['qc-hide-header',s.enabled&&s.hideHeader],['qc-system-fonts',s.enabled&&s.systemFonts]] as const) doc.body.classList.toggle(name,enabled);
  if(s.enabled){
   for(const [key,name,unit] of OPTIONS)doc.body.style.setProperty(name,String(s[key])+unit);
  }else this.restore(doc);
 }
 private restore(doc:Document){
  for(const [name,original] of this.documents.get(doc)??[]){
   if(original.value)doc.body.style.setProperty(name,original.value,original.priority);
   else doc.body.style.removeProperty(name);
  }
 }
 async persist(){
  this.settings=normalize(this.settings);
  for(const doc of this.documents.keys())this.apply(doc);
  await this.saveData(this.settings);
 }
 private clean(doc:Document){
  for(const name of CLASSES)doc.body.classList.remove(name);
  this.restore(doc);this.documents.delete(doc);
 }
 onunload(){for(const doc of [...this.documents.keys()])this.clean(doc);}
}
class QuietSettings extends PluginSettingTab {
 constructor(app:Plugin['app'],private plugin:QuietChat){super(app,plugin);}
 display(){
  const el=this.containerEl;el.empty();el.addClass('qc-settings');
  const bilingual=(host:HTMLElement,zh:string,en:string)=>{
   host.createDiv({text:zh});host.createSpan({cls:'qc-en',text:en});
  };
  bilingual(el.createDiv({cls:'qc-intro'}),'建议搭配默认主题。设置实时生效，只改变外观。','Best with the default theme. Changes apply immediately and affect appearance only.');
  const section=(zh:string,en:string)=>{
   const setting=new Setting(el).setHeading();setting.settingEl.addClass('qc-section');
   bilingual(setting.nameEl,zh,en);
  };
  const row=(zh:string,en:string,desc?:string,englishDesc?:string)=>{
   const setting=new Setting(el);
   bilingual(setting.nameEl,zh,en);
   if(desc)bilingual(setting.descEl,desc,englishDesc??'');
   return setting;
  };
  const toggles:[keyof Pick<Settings,'enabled'|'hideRibbon'|'hideStatus'|'hideHeader'|'systemFonts'>,string,string,string,string][]=[
   ['enabled','启用外观','Enable appearance','关闭后恢复底层主题。','Turn off to restore the underlying theme.'],
   ['hideRibbon','隐藏左侧功能区','Hide ribbon','若功能区仍不可见，请在 Obsidian 外观设置中开启。','If still hidden, enable the ribbon in Obsidian Appearance settings.'],
   ['hideStatus','隐藏状态栏','Hide status bar','减少底部常驻元素。','Hide the status information at the bottom.'],
   ['hideHeader','隐藏笔记标题栏','Hide view header','保留顶部标签；鼠标移到笔记右上角时显示编辑/阅读切换和更多菜单。','Keep tabs visible; hover over the top-right corner of a note for the view toggle and menu.'],
   ['systemFonts','使用系统字体','Use system fonts','覆盖界面和正文，保留代码字体。','Apply to the interface and text; keep the code font.']];
  for(const [key,zh,en,desc,eng] of toggles)row(zh,en,desc,eng).addToggle(t=>t.setValue(this.plugin.settings[key]).onChange(async v=>{this.plugin.settings[key]=v;await this.plugin.persist();}));
  const slider=(key:keyof typeof RANGES,zh:string,en:string,unit:string,desc?:string,eng?:string)=>{
   const setting=row(zh,en,desc,eng),value=setting.controlEl.createSpan({cls:'qc-value'});
   const format=(v:number)=>`${Number(v.toFixed(2))}${unit}`;
   value.setText(format(this.plugin.settings[key]));
   const [min,max,step]=RANGES[key];
   setting.addSlider(s=>s.setLimits(min,max,step).setValue(this.plugin.settings[key]).setDynamicTooltip().onChange(async v=>{
    this.plugin.settings[key]=v;value.setText(format(v));await this.plugin.persist();
   }));
  };
  slider('radius','面板圆角','Pane radius','px');
  section('正文排版','Text layout');
  slider('width','正文宽度','Text width','px','需要开启编辑器的「缩减栏宽」。','Requires Readable line length in Editor settings.');
  slider('fontSize','正文字号','Text size','px');
  slider('lineHeight','正文行高','Line height','×');
  slider('paragraphSpacing','段落间距','Paragraph spacing','em','用于阅读视图；编辑视图保留原文空行。','Applies to Reading view; the editor preserves source blank lines.');
  slider('listSpacing','列表项间距','List item spacing','em');
  slider('listLevelGap','列表层级间距','Spacing between list levels','px','进入子列表或返回父层级时增加的上下间距，同级列表项间距保持独立。','Extra vertical space when entering or leaving a nested list; sibling spacing is separate.');
  slider('listIndent','列表层级缩进','Nested list indentation','px','调整嵌套列表每一级的水平缩进，适用于阅读视图和实时预览。','Adjust horizontal indentation per nested level in Reading view and Live Preview.');
  section('标题排版','Headings');
  slider('headingScale','标题大小比例','Heading size scale','×','同时缩放一至六级标题及笔记内标题。','Scale heading levels 1–6 and the inline title together.');
  slider('headingTop','标题上方间距','Space above headings','px');
  slider('headingBottom','标题下方间距','Space below headings','px');
  section('重置','Reset');
  row('恢复默认','Restore defaults').addButton(b=>b.setButtonText('恢复 / Reset').onClick(async()=>{this.plugin.settings={...DEFAULTS};await this.plugin.persist();this.display();}));
 }
}
