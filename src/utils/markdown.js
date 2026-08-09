import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function renderMarkdown(source = '') {
  const html = marked.parse(String(source || ''))
  const safeHtml = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['img', 'iframe', 'object', 'embed', 'style'],
    FORBID_ATTR: ['style'],
  })
  const parsed = new DOMParser().parseFromString(safeHtml, 'text/html')
  parsed.querySelectorAll('a').forEach((link) => {
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })
  return parsed.body.innerHTML
}
