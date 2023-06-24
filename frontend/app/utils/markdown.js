import { marked } from 'marked';

export function markDownToHtml(markdown){
    return marked.parse(markdown);
}