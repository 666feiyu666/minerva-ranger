export function toVisibleNoteText(content = '', contentFormat = 'plain') {
  const source = String(content || '')
  if (contentFormat !== 'markdown') return source

  return source
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?/gm, '')
    .replace(/^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/gm, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[~*_]/g, '')
}

export function countVisibleNoteCharacters(content = '', contentFormat = 'plain') {
  return toVisibleNoteText(content, contentFormat).replace(/\s/g, '').length
}
