/**
 * Text Sanitizer for PDF Label & Document Generation
 * 
 * Cleans unknown/corrupted characters, emojis, non-Latin scripts (which standard jsPDF fonts
 * cannot render, turning into mojibake/unknown language glyphs), zero-width characters,
 * invisible control characters, and converts typographic symbols into safe ASCII equivalents.
 */

/**
 * Decodes common HTML entities if present in strings
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

/**
 * Sanitizes a string for clean rendering in jsPDF standard fonts (Helvetica, Times, Courier).
 * Standard jsPDF fonts only support WinAnsi / ASCII printable range (32 - 126).
 * Any emojis, regional scripts (e.g. Tamil/Devanagari), or high unicode codepoints
 * become corrupted mojibake symbols or question marks without this sanitizer.
 */
export function sanitizePdfText(text: string | null | undefined, fallback = ''): string {
  if (text === null || text === undefined) return fallback;
  let str = String(text);

  if (!str.trim()) return fallback;

  // 1. Decode any HTML entities
  str = decodeHtmlEntities(str);

  // 2. Unicode Normalization (decompose accents / composite characters)
  try {
    str = str.normalize('NFKD');
  } catch {}

  // 3. Map typographic symbols and currencies to standard ASCII equivalents
  str = str
    .replace(/[₹]/g, 'Rs. ')
    .replace(/[\u2018\u2019\u201A\u201B`]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ') // whitespace variants
    .replace(/[\u200C\u200D\u00AD]/g, ''); // zero-width joiners / soft hyphens

  // 4. Remove Unicode Emojis & Pictographs across all blocks
  // NOTE: Do NOT use naked \p{Emoji} because Unicode standard classifies ASCII digits (0-9), '#' and '*' as Emoji!
  try {
    str = str.replace(/\p{Extended_Pictographic}/gu, '');
    str = str.replace(/\p{Emoji_Presentation}/gu, '');
    str = str.replace(/\p{Emoji_Modifier_Base}/gu, '');
    str = str.replace(/\p{Emoji_Modifier}/gu, '');
    str = str.replace(/\uFE0F/g, ''); // Variation Selector-16
  } catch {
    str = str.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    );
  }

  // 5. Remove non-printable control characters
  str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');

  // 6. Retain only printable ASCII characters (32 to 126) for standard jsPDF fonts
  // This removes Tamil / non-Latin scripts that standard jsPDF fonts cannot render and would turn into mojibake
  str = str.replace(/[^\x20-\x7E]/g, ' ');

  // 7. Clean empty brackets or dangling punctuation leftovers like `( )` or `[ ]`
  str = str.replace(/\(\s*\)/g, '');
  str = str.replace(/\[\s*\]/g, '');
  str = str.replace(/\{\s*\}/g, '');

  // 8. Clean redundant commas, hyphens or spaces (e.g. ` , ` -> `, `)
  str = str.replace(/\s*,\s*,+/g, ',');
  str = str.replace(/\s+,/g, ',');
  str = str.replace(/,\s*([,\-])+/g, ',');
  str = str.replace(/\s+/g, ' ').trim();

  // 9. Clean trailing or leading dangling punctuation (e.g. orphan commas or hyphens left by emoji removal)
  str = str.replace(/^[,;\-\s/]+|[,;\-\s/]+$/g, '').trim();

  return str || fallback;
}
