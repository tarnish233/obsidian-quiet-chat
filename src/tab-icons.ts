import {Plugin, WorkspaceLeaf, sanitizeHTMLToDom, setIcon} from 'obsidian';

// Keep Obsidian's original icon intact so disabling the appearance restores it.
export function installTabIcons(plugin: Plugin) {
 const icons = new Map<HTMLElement, {path: string; svg: string}>();
 const refresh = () => {
  const live = new Set<HTMLElement>();
  plugin.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
   const header = (leaf as WorkspaceLeaf & {tabHeaderEl?: HTMLElement}).tabHeaderEl;
   const file = (leaf.view as typeof leaf.view & {file?: {path: string}}).file;
   if (!header?.closest('.mod-root') || !file) return;
   const inner = header.querySelector<HTMLElement>('.workspace-tab-header-inner');
   if (!inner) return;
   let icon = inner.querySelector<HTMLElement>(':scope > .qc-tab-icon');
   if (!icon) {
    icon = inner.ownerDocument.createElement('span');
    icon.className = 'qc-tab-icon';
    icon.hidden = true; // Plugin-scoped CSS reveals it only while enabled.
    icon.setAttribute('aria-hidden', 'true');
    inner.prepend(icon);
   }
   live.add(icon);
   const app = plugin.app as typeof plugin.app & {plugins?: {plugins?: Record<string, {getFileIconSvg?: (path: string) => string}>}};
   let svg = '';
   try { svg = app.plugins?.plugins?.['material-icon-theme']?.getFileIconSvg?.(file.path) ?? ''; } catch { /* use native fallback */ }
   const previous = icons.get(icon);
   if (previous?.path !== file.path || previous?.svg !== svg) {
    icon.replaceChildren();
    if (svg) icon.appendChild(sanitizeHTMLToDom(svg));
    else setIcon(icon, leaf.view.getIcon());
    icons.set(icon, {path: file.path, svg});
   }
  });
  for (const icon of icons.keys()) if (!live.has(icon)) { icon.remove(); icons.delete(icon); }
 };
 plugin.registerEvent(plugin.app.workspace.on('layout-change', refresh));
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change', refresh));
 plugin.registerEvent(plugin.app.workspace.on('file-open', refresh));
 plugin.registerEvent(plugin.app.workspace.on('css-change', refresh));
 plugin.registerEvent(plugin.app.vault.on('rename', refresh));
 plugin.register(() => { for (const icon of icons.keys()) icon.remove(); icons.clear(); });
 refresh();
}
