import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

test('Markdown 预览移除脚本、图片、事件属性和危险协议', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.DOMParser = dom.window.DOMParser

  try {
    const moduleUrl = `${pathToFileURL(path.resolve('src/utils/markdown.js')).href}?security-test`
    const { renderMarkdown } = await import(moduleUrl)
    const html = renderMarkdown([
      '# 安全预览',
      '<script>window.__unsafe = true</script>',
      '<img src="x" onerror="window.__unsafe = true">',
      '[危险链接](javascript:window.__unsafe=true)',
      '[安全链接](https://example.com)',
    ].join('\n\n'))
    const container = dom.window.document.createElement('div')
    container.innerHTML = html

    assert.equal(container.querySelectorAll('script').length, 0)
    assert.equal(container.querySelectorAll('img').length, 0)
    assert.equal(container.querySelector('a[href^="javascript:"]'), null)
    const safeLink = container.querySelector('a[href="https://example.com"]')
    assert.equal(safeLink?.getAttribute('target'), '_blank')
    assert.equal(safeLink?.getAttribute('rel'), 'noopener noreferrer')
    assert.equal(dom.window.__unsafe, undefined)
  } finally {
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
    delete globalThis.DOMParser
  }
})
