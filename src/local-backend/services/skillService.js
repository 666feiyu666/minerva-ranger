export function createSkillRecord(name, id = Date.now(), random = Math.random) {
  return {
    id: `skill_${id}`,
    name,
    x: Math.floor(random() * 70) + 15,
    y: Math.floor(random() * 70) + 15,
  }
}

export function renameSkillInList(skills, skillId, newName) {
  const skill = skills.find((item) => item.id === skillId)
  if (!skill) return false
  skill.name = newName
  return true
}

export function moveSkillInList(skills, skillId, direction) {
  if (!Array.isArray(skills) || (direction !== -1 && direction !== 1)) return null

  const currentIndex = skills.findIndex((skill) => skill.id === skillId)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= skills.length) return null

  const nextSkills = [...skills]
  const [movedSkill] = nextSkills.splice(currentIndex, 1)
  if (!movedSkill) return null

  nextSkills.splice(targetIndex, 0, movedSkill)
  return nextSkills
}

export function deleteSkillFromLists(skills, actions, skillId) {
  return {
    nextSkills: skills.filter((skill) => skill.id !== skillId),
    nextActions: actions.map((action) =>
      action.skillId === skillId ? { ...action, skillId: null } : action,
    ),
  }
}
