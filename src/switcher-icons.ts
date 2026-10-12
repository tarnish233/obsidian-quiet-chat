import {Plugin, sanitizeHTMLToDom, setIcon} from 'obsidian';

type Suggestion = {type: string; file?: {path: string}; item?: {type: string; path?: string}} | null;
type Render = (suggestion: Suggestion, row: HTMLElement) => void;

// Quick Switcher has no public decoration API. Scope the wrapper to its own
// prototype, preserve its renderer, and remove the wrapper when we unload.
export function installSwitcherIcons(plugin: Plugin, enabled: () => boolean) {
 const app = plugin.app as typeof plugin.app & {
  internalPlugins?: {plugins?: {switcher?: {instance?: {QuickSwitcherModal?: {prototype: {renderSuggestion?: Render}}}}}};
  plugins?: {plugins?: Record<string, {getFileIconSvg?: (path: string) => string}>};
 };
 const proto = app.internalPlugins?.plugins?.switcher?.instance?.QuickSwitcherModal?.prototype;
 if (!proto || typeof proto.renderSuggestion !== 'function') return;
 const own = Object.getOwnPropertyDescriptor(proto, 'renderSuggestion');
 const original = proto.renderSuggestion;
 const render: Render = function(this: unknown, suggestion, row) {
  original.call(this, suggestion, row);
  if (!enabled()) return;
  const path = suggestion?.file?.path ?? (suggestion?.item?.type === 'file' ? suggestion.item.path : undefined);
  if (!path) return;
  const icon = row.ownerDocument.createElement('span');
  icon.className = 'qc-switcher-icon';
  icon.setAttribute('aria-hidden', 'true');
  try {
   const provider = app.plugins?.plugins?.['material-icon-theme'];
   const svg = provider?.getFileIconSvg?.(path);
   if (svg) icon.appendChild(sanitizeHTMLToDom(svg));
   else setIcon(icon, 'file-text');
  } catch { setIcon(icon, 'file-text'); }
  row.prepend(icon);
 };
 proto.renderSuggestion = render;
 plugin.register(() => {
  if (proto.renderSuggestion === render) {
   if (own) Object.defineProperty(proto, 'renderSuggestion', own);
   else delete proto.renderSuggestion;
  }
  plugin.app.workspace.containerEl.ownerDocument.querySelectorAll('.qc-switcher-icon').forEach(el => el.remove());
 });
}
