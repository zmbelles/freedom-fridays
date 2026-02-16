import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";

export async function docxBufferToHtmlAndText(buffer) {
  // Mammoth defaults:
  // - bold => <strong>
  // - italic => <em>
  // - underline is IGNORED unless you map it (u => ...)
  //
  // Also: Mammoth only matches b/i/u when they are explicitly applied.
  // Text that is bold/italic/underlined because of a *run style* may need mappings.
  const options = {
    // Keep the default style map AND add our overrides
    includeDefaultStyleMap: true,

    // Style maps:
    // - u => u enables underline (otherwise Mammoth drops it)
    // - r[style-name='Strong'] etc catches common Word character styles
    styleMap: [
      // UNDERLINE: opt-in (default is ignored)
      "u => u",

      // Common Word character styles:
      "r[style-name='Strong'] => strong",
      "r[style-name='Emphasis'] => em",
      "r[style-name='Underline'] => u",

      // Some docs use these names:
      "r[style-name='Strong Emphasis'] => strong > em",
      "r[style-name='Intense Emphasis'] => em",
    ],
  };

  const { value: rawHtml } = await mammoth.convertToHtml({ buffer }, options);

  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "hr",
      "a",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      span: ["style"],
    },

    // If Mammoth ever outputs underline as inline styles instead of <u>,
    // this keeps it safe (optional, but harmless).
    allowedStyles: {
      span: {
        "text-decoration": [/^underline$/],
        "font-weight": [/^\d+$/],
        "font-style": [/^italic$/],
      },
    },

    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });

  const text = htmlToText(cleanHtml);
  return { html: cleanHtml, text };
}

function htmlToText(html) {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n");

  const stripped = withBreaks.replace(/<[^>]*>/g, "");
  return stripped
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function computeReadingTimeMinutes(text) {
  const words = (text.match(/\S+/g) || []).length;
  return Math.max(1, Math.round(words / 220));
}

export function makeExcerpt(text, maxLen = 180) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).replace(/[,\s]+$/, "") + "…";
}

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}
