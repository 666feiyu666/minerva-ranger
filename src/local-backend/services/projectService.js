import { deriveTotalXPFromLegacyProject, getProjectLevelState } from '@/local-backend/domain/leveling'
import { normalizeNote } from '@/local-backend/domain/noteModel'
import { isSameProjectId, normalizeProject } from '@/local-backend/domain/projectModel'

export function createProjectRecord(name, themeId = null, id = Date.now()) {
  return normalizeProject({
    id,
    name,
    icon: '📁',
    totalXP: 0,
    totalTrees: 0,
    totalTimeSpent: 0,
    forest: {},
    themeId
  })
}

export function deleteProjectFromList(projects, notebook, projectId, options = {}) {
  const targetProject = projects.find(project => isSameProjectId(project.id, projectId))
  if (!targetProject) return null

  const commitMessage = options.commitMessage?.trim()
  const relatedLogCount = notebook.filter(note =>
    normalizeNote(note).projectIds.some(noteProjectId => isSameProjectId(noteProjectId, projectId))
  ).length

  return {
    nextProjects: projects.filter(project => !isSameProjectId(project.id, projectId)),
    deletedProject: targetProject,
    systemNote: {
      title: '[系统记录] 行动已删除',
      eventType: 'project_delete',
      content: [
        '系统记录：行动删除完成。',
        `删除行动：${targetProject.name}`,
        `删除前树木：${targetProject.totalTrees || 0} 棵`,
        `删除前时长：${Math.floor(targetProject.totalTimeSpent || 0)} 秒`,
        `删除前经验：${deriveTotalXPFromLegacyProject(targetProject)} XP`,
        `关联日志：${relatedLogCount} 条`,
        commitMessage ? `用户说明：${commitMessage}` : null
      ]
        .filter(Boolean)
        .join('\n')
    }
  }
}

export function mergeProjectData(projects, notebook, sourceProjectId, targetProjectId, options = {}) {
  if (!sourceProjectId || !targetProjectId || isSameProjectId(sourceProjectId, targetProjectId)) {
    return null
  }

  const sourceProject = projects.find(project => isSameProjectId(project.id, sourceProjectId))
  const targetProject = projects.find(project => isSameProjectId(project.id, targetProjectId))
  if (!sourceProject || !targetProject) return null

  const commitMessage = options.commitMessage?.trim()
  const mergedTargetProject = {
    ...targetProject,
    totalTrees: (targetProject.totalTrees || 0) + (sourceProject.totalTrees || 0),
    totalTimeSpent: (targetProject.totalTimeSpent || 0) + (sourceProject.totalTimeSpent || 0),
    totalXP:
      deriveTotalXPFromLegacyProject(targetProject) +
      deriveTotalXPFromLegacyProject(sourceProject),
    forest: { ...targetProject.forest }
  }

  Object.entries(sourceProject.forest || {}).forEach(([treeId, count]) => {
    mergedTargetProject.forest[treeId] = (mergedTargetProject.forest[treeId] || 0) + count
  })
  Object.assign(mergedTargetProject, getProjectLevelState(mergedTargetProject.totalXP))

  let migratedLogCount = 0
  const nextNotebook = notebook.map(note => {
    const normalized = normalizeNote(note)
    if (!normalized.projectIds.some(noteProjectId => isSameProjectId(noteProjectId, sourceProjectId))) {
      return normalized
    }

    migratedLogCount += 1
    normalized.projectIds = [
      ...new Set(
        normalized.projectIds.map(noteProjectId =>
          isSameProjectId(noteProjectId, sourceProjectId) ? targetProject.id : noteProjectId
        )
      )
    ]
    return normalized
  })

  return {
    nextProjects: projects
      .filter(project => !isSameProjectId(project.id, sourceProjectId))
      .map(project => (isSameProjectId(project.id, targetProjectId) ? mergedTargetProject : project)),
    nextNotebook,
    sourceProject,
    targetProject: mergedTargetProject,
    systemNote: {
      title: '[系统记录] 行动已合并',
      projectIds: [targetProjectId],
      eventType: 'project_merge',
      content: [
        '系统记录：行动合并完成。',
        `源行动：${sourceProject.name}`,
        `目标行动：${targetProject.name}`,
        `迁移树木：${sourceProject.totalTrees || 0} 棵`,
        `迁移时长：${Math.floor(sourceProject.totalTimeSpent || 0)} 秒`,
        `迁移经验：${deriveTotalXPFromLegacyProject(sourceProject)} XP`,
        `迁移日志：${migratedLogCount} 条`,
        commitMessage ? `用户说明：${commitMessage}` : null
      ]
        .filter(Boolean)
        .join('\n')
    }
  }
}

export function reorderProjects(projects, sourceProjectId, targetProjectId, position = 'before') {
  if (!sourceProjectId || !targetProjectId || isSameProjectId(sourceProjectId, targetProjectId)) {
    return null
  }

  const nextProjects = [...projects]
  const sourceIndex = nextProjects.findIndex(project => isSameProjectId(project.id, sourceProjectId))
  const targetIndex = nextProjects.findIndex(project => isSameProjectId(project.id, targetProjectId))
  if (sourceIndex === -1 || targetIndex === -1) return null

  const [movedProject] = nextProjects.splice(sourceIndex, 1)
  const targetProject = nextProjects.find(project => isSameProjectId(project.id, targetProjectId))
  if (!movedProject || !targetProject) return null

  movedProject.themeId = targetProject.themeId || null

  const insertIndex =
    nextProjects.findIndex(project => isSameProjectId(project.id, targetProjectId)) +
    (position === 'after' ? 1 : 0)

  nextProjects.splice(insertIndex, 0, movedProject)
  return nextProjects
}

export function moveProjectToTheme(projects, projectId, themeId = null) {
  const nextProjects = [...projects]
  const sourceIndex = nextProjects.findIndex(project => isSameProjectId(project.id, projectId))
  if (sourceIndex === -1) return null

  const [movedProject] = nextProjects.splice(sourceIndex, 1)
  if (!movedProject) return null

  movedProject.themeId = themeId || null

  const lastThemeIndex = (() => {
    if (!themeId) {
      return nextProjects.reduce(
        (index, project, currentIndex) => (!project.themeId ? currentIndex : index),
        -1
      )
    }

    return nextProjects.reduce(
      (index, project, currentIndex) => (project.themeId === themeId ? currentIndex : index),
      -1
    )
  })()

  nextProjects.splice(lastThemeIndex + 1, 0, movedProject)
  return nextProjects
}
