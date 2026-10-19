import test from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildSync } from 'esbuild'

async function loadNotebookDomain() {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledPath = path.join(tmpdir(), `mr-notebook-domain-${Date.now()}.mjs`)

  buildSync({
    stdin: {
      contents: `
        export { normalizeNote } from '@/local-backend/domain/noteModel'
        export { countVisibleNoteCharacters } from '@/local-backend/domain/noteContent'
        export {
          createNoteRecord,
          migrateNotesForDeletedAction,
          migrateNotesForDeletedSkill,
          syncNotesForActionOwnership
        } from '@/local-backend/services/notebookService'
        export { mergeActionData } from '@/local-backend/services/actionService'
      `,
      resolveDir: repoRoot,
      sourcefile: 'notebook-domain-test-entry.mjs'
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: bundledPath,
    alias: { '@': path.join(repoRoot, 'src') }
  })

  const module = await import(pathToFileURL(bundledPath).href)
  return { module, bundledPath }
}

test('旧版笔记标准化为统一归属和 Markdown 兼容结构', async () => {
  const { module, bundledPath } = await loadNotebookDomain()
  try {
    const note = module.normalizeNote({
      id: 1,
      title: '[植树日志] 写代码',
      content: 'legacy',
      actionId: 'action_a'
    })

    assert.deepEqual(note.actionIds, ['action_a'])
    assert.equal(note.actionNameSnapshot, '写代码')
    assert.equal(note.skillId, null)
    assert.equal(note.sessionId, null)

    const essay = module.normalizeNote({ type: 'ranger', content: 'plain text' })
    assert.equal(essay.type, 'essay')
    assert.equal(essay.contentFormat, 'markdown')
  } finally {
    rmSync(bundledPath, { force: true })
  }
})

test('空会话备注可以生成植树记录但不会获得金币', async () => {
  const { module, bundledPath } = await loadNotebookDomain()
  try {
    const planting = module.createNoteRecord({
      title: '[植树日志] 写代码',
      content: '',
      actionIds: ['action_a'],
      skillId: 'skill_a',
      type: 'planting',
      allowEmptyContent: true,
      awardCoins: true,
      sessionId: 'session_a',
      now: new Date('2026-08-09T00:00:00.000Z')
    })
    assert.equal(planting.error, null)
    assert.equal(planting.earnedCoins, 0)
    assert.equal(planting.note.sessionId, 'session_a')

    const essay = module.createNoteRecord({
      title: '空随笔',
      content: '',
      type: 'essay',
      awardCoins: false
    })
    assert.equal(essay.note, null)
    assert.equal(essay.error.title, '内容无效')
  } finally {
    rmSync(bundledPath, { force: true })
  }
})

test('Markdown 字符数忽略格式符号且纯格式正文不能保存', async () => {
  const { module, bundledPath } = await loadNotebookDomain()
  try {
    assert.equal(module.countVisibleNoteCharacters('# 标题\n\n- **内容**', 'markdown'), 4)
    const invalid = module.createNoteRecord({
      title: '只有格式',
      content: '***',
      type: 'essay',
      contentFormat: 'markdown',
      awardCoins: false
    })
    assert.equal(invalid.note, null)
    const untitled = module.createNoteRecord({
      title: '   ',
      content: '有效正文',
      type: 'essay',
      awardCoins: false
    })
    assert.equal(untitled.error.title, '标题无效')
  } finally {
    rmSync(bundledPath, { force: true })
  }
})

test('删除行动后植树记录和随笔降级到技能并保留名称快照', async () => {
  const { module, bundledPath } = await loadNotebookDomain()
  try {
    const action = { id: 'action_a', name: '写代码', skillId: 'skill_a' }
    const notebook = [
      { id: 1, type: 'planting', content: '', actionIds: ['action_a'] },
      { id: 2, type: 'essay', content: '复盘', actionIds: ['action_a'] }
    ]
    const migrated = module.migrateNotesForDeletedAction(notebook, action, {
      skillName: '编程'
    })

    migrated.forEach(note => {
      assert.deepEqual(note.actionIds, [])
      assert.equal(note.skillId, 'skill_a')
      assert.equal(note.actionNameSnapshot, '写代码')
      assert.equal(note.skillNameSnapshot, '编程')
    })
  } finally {
    rmSync(bundledPath, { force: true })
  }
})

test('删除技能后孤立记录进入未分类但保留技能名称快照', async () => {
  const { module, bundledPath } = await loadNotebookDomain()
  try {
    const notebook = [
      {
        id: 1,
        type: 'planting',
        content: '',
        actionIds: [],
        skillId: 'skill_a',
        skillNameSnapshot: '旧技能'
      }
    ]
    const migrated = module.migrateNotesForDeletedSkill(notebook, {
      id: 'skill_a',
      name: '编程'
    })

    assert.equal(migrated[0].skillId, null)
    assert.equal(migrated[0].skillNameSnapshot, '编程')
  } finally {
    rmSync(bundledPath, { force: true })
  }
})

test('行动合并会同步目标行动与技能归属', async () => {
  const { module, bundledPath } = await loadNotebookDomain()
  try {
    const result = module.mergeActionData(
      [
        { id: 'source', name: '源行动', skillId: 'skill_old', forest: {} },
        { id: 'target', name: '目标行动', skillId: 'skill_new', forest: {} }
      ],
      [{ id: 1, type: 'essay', content: '复盘', actionIds: ['source'] }],
      'source',
      'target',
      { targetSkillName: '新技能' }
    )

    assert.deepEqual(result.nextNotebook[0].actionIds, ['target'])
    assert.equal(result.nextNotebook[0].skillId, 'skill_new')
    assert.equal(result.nextNotebook[0].actionNameSnapshot, '目标行动')
    assert.equal(result.nextNotebook[0].skillNameSnapshot, '新技能')
  } finally {
    rmSync(bundledPath, { force: true })
  }
})
