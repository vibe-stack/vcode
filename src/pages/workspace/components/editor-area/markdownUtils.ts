import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';
import * as turndownPluginGfm from '@joplin/turndown-plugin-gfm';

const md = new MarkdownIt({ html: true, breaks: true, linkify: true });
const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndownService.use(turndownPluginGfm.gfm);

export function markdownToHtml(markdown: string): string {
  let html = md.render(markdown);
  html = html.replace(/<thead>[\s\S]*?<\/thead>/gi, '');
  return html;
}

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
