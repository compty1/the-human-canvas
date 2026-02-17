import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "strong", "em", "b", "i", "u", "s", "del", "ins",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "section", "article",
      "sup", "sub", "mark", "small",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title",
      "class", "id", "width", "height", "style",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
};
