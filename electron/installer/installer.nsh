!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!ifdef BUILD_UNINSTALLER
Var minervaDeleteUserData
Var minervaKeepUserDataRadio
Var minervaDeleteUserDataRadio

!macro deleteMinervaUserDataAt ROOT
  RMDir /r "${ROOT}\${APP_FILENAME}"
  !ifdef APP_PRODUCT_FILENAME
    RMDir /r "${ROOT}\${APP_PRODUCT_FILENAME}"
  !endif
  !ifdef APP_PACKAGE_NAME
    RMDir /r "${ROOT}\${APP_PACKAGE_NAME}"
  !endif
!macroend

# Defining customUnInstallSection makes electron-builder add its components
# page. The cleanup section below must exist so it runs after the main app
# removal, but it is hidden; skip the now-unnecessary components page.
Function un.minervaSkipUninstallComponentsPage
  Abort
FunctionEnd
!define MUI_PAGE_CUSTOMFUNCTION_PRE un.minervaSkipUninstallComponentsPage

!macro customUnWelcomePage
  Function un.minervaUninstallChoicePageCreate
    !insertmacro MUI_HEADER_TEXT "选择卸载方式" "请选择是否保留 MinervaRanger 的本地数据。"

    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0u 0u 300u 24u "请选择一种卸载方式："
    Pop $0

    ${NSD_CreateRadioButton} 10u 32u 290u 22u "仅删除应用（推荐）— 保留存档、备份和设置"
    Pop $minervaKeepUserDataRadio

    ${NSD_CreateRadioButton} 10u 64u 290u 22u "删除应用及全部本地数据 — 此操作不可撤销"
    Pop $minervaDeleteUserDataRadio

    ${NSD_CreateLabel} 10u 98u 290u 38u "彻底删除只清理应用自己的数据目录；用户另行导出到其他位置的 JSON 文件不会被删除。"
    Pop $0

    ${If} $minervaDeleteUserData == "1"
      ${NSD_Check} $minervaDeleteUserDataRadio
    ${Else}
      StrCpy $minervaDeleteUserData "0"
      ${NSD_Check} $minervaKeepUserDataRadio
    ${EndIf}

    nsDialogs::Show
  FunctionEnd

  Function un.minervaUninstallChoicePageLeave
    ${NSD_GetState} $minervaDeleteUserDataRadio $0
    ${If} $0 == ${BST_CHECKED}
      MessageBox MB_YESNO|MB_ICONEXCLAMATION|MB_DEFBUTTON2 \
        "这将永久删除全部身份、地图进度、笔记、SQLite 数据库、内部备份和应用设置。用户另行导出的 JSON 文件不会被删除。此操作不可撤销，是否继续？" \
        IDYES minervaDeleteUserDataConfirmed

      StrCpy $minervaDeleteUserData "0"
      ${NSD_Uncheck} $minervaDeleteUserDataRadio
      ${NSD_Check} $minervaKeepUserDataRadio
      Abort

      minervaDeleteUserDataConfirmed:
      StrCpy $minervaDeleteUserData "1"
    ${Else}
      StrCpy $minervaDeleteUserData "0"
    ${EndIf}
  FunctionEnd

  UninstPage custom un.minervaUninstallChoicePageCreate un.minervaUninstallChoicePageLeave
!macroend

!macro customUnInstallSection
  # The un. prefix is required for this section to be compiled into the
  # generated uninstaller. The following '-' keeps the finalizer hidden.
  Section "un.-应用数据清理策略" minervaApplyDeleteUserDataSection
    SectionIn RO

    ${If} $minervaDeleteUserData == "1"
    ${AndIfNot} ${isUpdated}
      ${If} $installMode == "all"
        SetShellVarContext current
      ${EndIf}
      !insertmacro deleteMinervaUserDataAt "$APPDATA"
      ${If} $installMode == "all"
        SetShellVarContext all
      ${EndIf}
    ${EndIf}
  SectionEnd
!macroend
!endif
