# Internationalization (i18n) Guidelines for Homework Helper Settings

This file reminds developers when adding/modifying text in the Options page (`extension/options/`) to ensure all UI strings are properly internationalized.

## When to Update i18n

Every time you add or modify a **visible text string** in the Settings/Options page, you must:

1. **Use an HTML element ID** for the text (e.g., `id="optCardLangTitle"`)
2. **Add a `setText()` call** in `extension/options/options.js` within the `applyLanguageI18n()` method
3. **Add the translation key** to **all locale files** in `extension/shared/i18n/locales/`:
   - `en.js` (English) — this is the primary reference
   - `vi.js` (Vietnamese)
   - `th.js` (Thai)
   - `zh-CN.js` (Simplified Chinese)
   - `zh-TW.js` (Traditional Chinese)
   - `ja.js` (Japanese)
   - `ko.js` (Korean)
   - `es.js` (Spanish)
   - `fr.js` (French)
   - `de.js` (German)
   - `pt.js` (Portuguese)
   - `id.js` (Indonesian)
   - `ru.js` (Russian)

## Example: Adding a New Setting Title

If you add a new card section title in `options.html`:

**HTML:**
```html
<h3 class="opt-card-title" id="optMyNewSectionTitle">My New Section</h3>
```

**JavaScript (options.js) — inside `applyLanguageI18n()`:**
```javascript
setText('optMyNewSectionTitle', dict.myNewSectionTitle);
```

**Locale files (e.g., en.js inside the `options` object):**
```javascript
myNewSectionTitle: "My New Section",
```

Then repeat the same key-value pair in all other locale files with appropriate translations.

## Hardcoded Strings to Avoid

❌ **Bad — hardcoded text that doesn't follow user's language setting:**
```html
<p>This is a static message</p>
```

✅ **Good — text that dynamically changes based on `uiLanguage` setting:**
```html
<p id="optMyMessageId">Static message</p>
<!-- Will be replaced by JavaScript with setText('optMyMessageId', dict.myMessageId) -->
```

## File Structure Reference

Each locale file exports an object with an `options` property containing all UI strings for the Settings page:

```javascript
// en.js
export default {
  general: { /* ... general UI strings ... */ },
  options: {
    navProviders: "AI Providers & Keys",
    headingAppearance: "Liquid Glass UI & Live Preview",
    cardLangTitle: "Language Settings",
    // ... more keys ...
  },
  // ... other dictionaries ...
};
```

## Quick Checklist Before Committing

- [ ] New visible text has an `id` attribute in HTML
- [ ] `setText()` added for that ID in `options.js` → `applyLanguageI18n()`
- [ ] Key added to all 13 locale files
- [ ] Test by switching UI language in Settings and verifying text updates

## Common Pitfalls

1. **Forgetting to add to all locale files** → Text shows English even when switching to Vietnamese
2. **Using `textContent` directly instead of `setText()`** → Your change will be overwritten when language changes
3. **Hardcoding translated text in HTML** → Won't update when user changes language setting
4. **Mismatching ID names** → `setText('optCardTitle', ...)` but HTML has `id="optCardTitleX"` → no update
