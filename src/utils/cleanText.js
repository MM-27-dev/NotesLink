export const cleanText = (text) => {
  let html = text;

  // 1. Handle Headings (e.g., "## Heading" becomes "<h2>Heading</h2>")
  // The `gm` flags enable global matching and multiline processing.
  html = html.replace(/^##\s*(.*)$/gm, "<h2>$1</h2>");

  // 2. Handle Horizontal Rules (e.g., "---" becomes "<hr />")
  // Ensures it's on its own line, optionally with leading/trailing spaces.
  html = html.replace(/^(---)\s*$/gm, "<hr />");

  // 3. Handle Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

  // 4. Handle Italic: *text* (more robust regex to avoid matching asterisks in words)
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");

  // 5. Handle Ordered list: 1. item
  // This regex captures a block of consecutive ordered list items, including multi-line items
  // where subsequent lines are not new list items or headings.
  html = html.replace(
    /(?:^|\n)(\d+\..*(?:\n(?!\d+\.|\*|-|#).+)*)/g,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "") // Remove any blank lines
        .map((item) => `<li>${item.replace(/^\d+\.\s*/, "").trim()}</li>`)
        .join("\n"); // Join with newlines for readability in HTML source
      return `<ol>\n${items}\n</ol>`;
    }
  );

  // 6. Handle Unordered list: * item or - item
  // This regex captures a block of consecutive unordered list items, including multi-line items.
  html = html.replace(
    /(?:^|\n)((?:[-*]\s+.*(?:\n(?!\d+\.|\*|-|#).+)*)+)/g,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "") // Remove any blank lines
        .map((item) => `<li>${item.replace(/^[-*]\s*/, "").trim()}</li>`)
        .join("\n"); // Join with newlines for readability in HTML source
      return `<ul>\n${items}\n</ul>`;
    }
  );
  
  html = html.replace(/\n\n/g, "</p><p>");
  // Then replace single newlines (that are not part of an existing block-level tag or list)
  // This regex tries to avoid replacing newlines that are already part of existing HTML tags or block structures.
  html = html.replace(/(?<![>])\n(?![<])/g, "<br>");

  // Wrap the entire content in a paragraph if it's not already within one or another block element.
  // This is a basic attempt; a full Markdown parser would handle this more robustly.
  if (
    !html.startsWith("<p>") &&
    !html.startsWith("<h") &&
    !html.startsWith("<ul") &&
    !html.startsWith("<ol") &&
    !html.startsWith("<hr")
  ) {
    html = `<p>${html}</p>`;
  }

  return html;
};
