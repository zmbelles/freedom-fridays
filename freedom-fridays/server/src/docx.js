import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";

export async function docxBufferToHtmlAndText(buffer) {
  const { value: rawHtml } = await mammoth.convertToHtml({ buffer });

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
    allowedStyles: {
      span: {
        "text-decoration": [/^underline$/],
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
