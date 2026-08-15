module.exports = Object.freeze({
  INITIALIZE: 'persistence:initialize',
  LOAD_SNAPSHOT: 'persistence:load-snapshot',
  COMMIT_SNAPSHOT: 'persistence:commit-snapshot',
  CREATE_BACKUP: 'persistence:create-backup',
  LIST_BACKUPS: 'persistence:list-backups',
  RESTORE_BACKUP: 'persistence:restore-backup',
  GET_DIAGNOSTICS: 'persistence:get-diagnostics',
})
