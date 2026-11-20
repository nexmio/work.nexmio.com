; Extra steps for the Windows installer and uninstaller.
;
; The AI engine (llama-server) is part of the program and is in the "engine" folder of the install
; folder, so the uninstaller removes it with the rest. The models the person downloaded are in
; "nexmio-work-ai" next to the program. The uninstaller does not know about those files, so it removes
; them here, after stopping the engine program so that its files are not locked.

!macro NSIS_HOOK_PREUNINSTALL
  ; Stop llama-server only when it runs from Nexmio Work's own folder (another program's copy is left alone).
  nsExec::Exec `powershell -NoProfile -NonInteractive -Command "Get-Process llama-server -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like '$INSTDIR\engine\*' } | Stop-Process -Force"`
  Pop $0
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Remove the downloaded models and logs, then the program folder if it is empty.
  RMDir /r "$INSTDIR\nexmio-work-ai"
  RMDir /r "$INSTDIR\engine"
  RMDir "$INSTDIR"
!macroend
