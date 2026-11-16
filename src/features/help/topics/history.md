## Backup

**Settings → Vault → Backup** copies your pages and their whole history to a folder you choose (an external disk, or a folder that is synced), so the history does not live only on one disk. Press **Back up now**, and tick **Back up when Nexmio Work closes** if you like. The copy is a bare Git repository, `<vault name>.git`, in that folder; Nexmio Work never overwrites a folder that holds another history. The status bar warns when the last backup is a week old or failed. To get the pages back, run `git clone` on that folder (or copy it) and open the result as a vault. The saved chats and the search index of meanings are not in the backup.

## Nothing is lost

Every vault keeps a **version history** (a Git repository inside the folder). Nexmio Work saves a version when you save, when you switch pages, now and then while you work, and when you close the app. Before Nexmio Work changes or deletes anything on its own, it saves a snapshot first.

## Look at an older version

Open the **History** tab of the right panel (or press **Ctrl/Cmd+Shift+H**). Pick a version to see what changed, and click **Restore this version** to bring it back. Restoring never throws anything away: the version you replaced stays in the history.

## Bring back a deleted page

**File → Recover deleted pages…** lists pages that were deleted and can be restored.

## Good to know

- Names in the history tell what happened: _Save_, _Autosave_, _Snapshot before AI_, _AI: …_, _Rename …_, _Delete …_, _Import: …_.
- The history only grows. Nexmio Work never rewrites it.
- Your name and how often it saves while idle are in **Settings → Version history**.
