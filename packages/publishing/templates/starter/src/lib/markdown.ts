import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

export function renderMarkdown(source: string): string {
  const trimmed = source.trim();
  if (trimmed.length === 0) {
    return "<p>Nothing to render yet.</p>";
  }

  return markdown.render(trimmed);
}
