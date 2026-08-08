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

export function deleteSkillFromLists(skills, actions, skillId) {
  return {
    nextSkills: skills.filter((skill) => skill.id !== skillId),
    nextActions: actions.map((action) =>
      action.skillId === skillId ? { ...action, skillId: null } : action,
    ),
  }
}
