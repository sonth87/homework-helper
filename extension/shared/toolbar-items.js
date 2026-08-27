/**
 * Metadata for the text-selection toolbar's reorderable tools (Options >
 * Appearance > Selection Toolbar > drag-and-drop layout editor). Shared
 * between the content script (renders the real toolbar) and the Options
 * page (renders the editor) so both stay in sync on item ids, icons, and
 * the default layout.
 *
 * 'disable' (Tắt công cụ) is deliberately excluded from this set — its
 * flyout submenu is anchored on always being the dropdown's last item, so
 * it isn't part of the reorderable/placeable list.
 */
export const TOOLBAR_ITEM_IDS = ['answer', 'copy', 'search', 'translate', 'explain', 'summarize', 'grammar'];

export const TOOLBAR_ITEM_ICONS = {
  answer: 'messageCircle',
  copy: 'copy',
  search: 'globe',
  translate: 'languages',
  explain: 'helpCircle',
  summarize: 'bookOpen',
  grammar: 'edit',
};

export const DEFAULT_TOOLBAR_LAYOUT = [
  { id: 'answer', area: 'main' },
  { id: 'copy', area: 'main' },
  { id: 'search', area: 'main' },
  { id: 'translate', area: 'main' },
  { id: 'explain', area: 'dropdown' },
  { id: 'summarize', area: 'dropdown' },
  { id: 'grammar', area: 'dropdown' },
];

/**
 * Storage can hold a layout that no longer matches this list — an id from
 * an older/newer extension version, a duplicate, one dropped entirely. Both
 * consumers call this before trusting the value, so a bad shape degrades to
 * "unknown ids dropped, missing ids appended into the dropdown" instead of
 * a broken or empty toolbar.
 */
export function normalizeToolbarLayout(layout) {
  if (!Array.isArray(layout)) return DEFAULT_TOOLBAR_LAYOUT.map((entry) => ({ ...entry }));

  const seen = new Set();
  const result = [];
  for (const entry of layout) {
    const id = entry?.id;
    if (!id || !TOOLBAR_ITEM_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, area: entry.area === 'main' ? 'main' : 'dropdown' });
  }
  // Any id this list knows about but the stored layout didn't (a tool added
  // in a later version, encountered by a user who customized before it
  // existed) lands in the dropdown — additive, not forced onto the toolbar.
  for (const id of TOOLBAR_ITEM_IDS) {
    if (!seen.has(id)) result.push({ id, area: 'dropdown' });
  }
  return result;
}
