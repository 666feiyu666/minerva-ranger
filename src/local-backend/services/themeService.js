export function createThemeRecord(name, id = Date.now(), random = Math.random) {
  return {
    id: `theme_${id}`,
    name,
    x: Math.floor(random() * 70) + 15,
    y: Math.floor(random() * 70) + 15
  }
}

export function renameThemeInList(themes, themeId, newName) {
  const theme = themes.find(item => item.id === themeId)
  if (!theme) return false
  theme.name = newName
  return true
}

export function deleteThemeFromLists(themes, projects, themeId) {
  return {
    nextThemes: themes.filter(theme => theme.id !== themeId),
    nextProjects: projects.map(project =>
      project.themeId === themeId ? { ...project, themeId: null } : project
    )
  }
}
