import test from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { buildSync } from 'esbuild'

test('技能顺序移动只调整数组位置并守住边界', async () => {
  const repoRoot = path.resolve(import.meta.dirname, '..')
  const bundledServicePath = path.join(tmpdir(), `mr-skill-service-${Date.now()}.mjs`)

  buildSync({
    entryPoints: [path.join(repoRoot, 'src/local-backend/services/skillService.js')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: bundledServicePath,
  })

  try {
    const { moveSkillInList } = await import(pathToFileURL(bundledServicePath).href)
    const skills = [
      { id: 'skill_code', name: '写代码', x: 10, y: 20 },
      { id: 'skill_design', name: '做设计', x: 30, y: 40 },
      { id: 'skill_promotion', name: '推广与宣传', x: 50, y: 60 },
    ]

    const movedUp = moveSkillInList(skills, 'skill_promotion', -1)
    assert.deepEqual(
      movedUp.map((skill) => skill.id),
      ['skill_code', 'skill_promotion', 'skill_design'],
    )
    assert.equal(movedUp[1], skills[2])
    assert.deepEqual(skills[2], { id: 'skill_promotion', name: '推广与宣传', x: 50, y: 60 })

    const movedDown = moveSkillInList(movedUp, 'skill_code', 1)
    assert.deepEqual(
      movedDown.map((skill) => skill.id),
      ['skill_promotion', 'skill_code', 'skill_design'],
    )

    assert.equal(moveSkillInList(skills, 'skill_code', -1), null)
    assert.equal(moveSkillInList(skills, 'skill_promotion', 1), null)
    assert.equal(moveSkillInList(skills, 'missing', 1), null)
    assert.equal(moveSkillInList(skills, 'skill_design', 0), null)
    assert.deepEqual(
      skills.map((skill) => skill.id),
      ['skill_code', 'skill_design', 'skill_promotion'],
    )
  } finally {
    rmSync(bundledServicePath, { force: true })
  }
})
