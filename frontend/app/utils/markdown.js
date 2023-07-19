import { marked } from 'marked';

marked.use({
    mangle: false,
    headerIds: false
});

export function markDownToHtml(markdown){
    return marked.parse(markdown);
}