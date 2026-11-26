//! Vault operations that combine file-system changes, link updates, indexing and Git.

use super::{attachments, fs_ops, paths, tree, OpenVault};
use crate::error::{AppError, AppResult};
use crate::git::{history, CommitKind, CommitReason};
use crate::links::{resolve::LinkResolver, rewrite};
use crate::projects;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct RenameResult {
    pub changed_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct RenamePreview {
    pub link_count: u32,
    pub note_count: u32,
}

/// One page to move: where it is and where it goes.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct PageMove {
    pub from: String,
    pub to: String,
}

/// Writes a note to disk (no commit) and updates the index.
pub fn write_note(v: &OpenVault, rel: &str, content: &str) -> AppResult<()> {
    fs_ops::write_note(&v.root, rel, content)?;
    if let Ok(mut cache) = v.task_cache.lock() {
        cache.forget(rel);
    }
    v.reindex(rel)?;
    v.touch();
    Ok(())
}

/// Creates a note and indexes it.
pub fn create_note(v: &OpenVault, folder: &str, name: Option<&str>) -> AppResult<String> {
    let rel = fs_ops::create_note(&v.root, folder, name)?;
    v.refresh_files();
    v.reindex(&rel)?;
    v.touch();
    Ok(rel)
}

/// Creates a folder.
pub fn create_folder(v: &OpenVault, parent: &str, name: &str) -> AppResult<String> {
    let rel = fs_ops::create_folder(&v.root, parent, name)?;
    v.refresh_files();
    Ok(rel)
}

fn compute_moves(files: &[String], from: &str, to: &str) -> HashMap<String, String> {
    let mut moves = HashMap::new();
    if files.iter().any(|f| f == from) {
        moves.insert(from.to_string(), to.to_string());
    } else {
        let prefix = format!("{from}/");
        for f in files.iter().filter(|f| f.starts_with(&prefix)) {
            moves.insert(f.clone(), format!("{to}/{}", &f[prefix.len()..]));
        }
    }
    moves
}

/// Counts links that a rename would rewrite.
pub fn preview_rename(v: &OpenVault, from: &str, to: &str) -> AppResult<RenamePreview> {
    paths::resolve(&v.root, from, None)?;
    paths::resolve(&v.root, to, None)?;
    let files = v.file_list();
    let moves = compute_moves(&files, from, to);
    let before = v.resolver();
    let (mut links, mut notes) = (0u32, 0u32);
    for f in files.iter().filter(|f| tree::is_markdown(f)) {
        let Ok(abs) = paths::resolve(&v.root, f, None) else {
            continue;
        };
        let Ok(content) = std::fs::read_to_string(abs) else {
            continue;
        };
        let n = rewrite::count_affected(&content, &before, &moves);
        if n > 0 {
            links += n as u32;
            notes += 1;
        }
    }
    Ok(RenamePreview {
        link_count: links,
        note_count: notes,
    })
}

/// Renames or moves a file/folder. Optionally rewrites links; one commit for everything.
/// Returns the changed files and the files to commit.
pub fn rename_no_commit(
    v: &OpenVault,
    from: &str,
    to: &str,
    update_links: bool,
) -> AppResult<(RenameResult, Vec<String>)> {
    let before_files = v.file_list();
    let before = v.resolver();
    let moves = compute_moves(&before_files, from, to);
    // A project always stays in the vault root: it can be renamed, but not moved into a folder.
    if to.contains('/') && v.project_list().iter().any(|p| p.folder == from) {
        return Err(AppError::Conflict(
            "A project always stays in the vault root, so it cannot be moved into a folder. Drop other folders and pages into the project instead.".into(),
        ));
    }
    fs_ops::rename(&v.root, from, to)?;

    let mut commit_paths = vec![from.to_string(), to.to_string()];
    // The pins and what is kept about tasks (`.vault/meta.json`) follow the move.
    if crate::meta::rename_path(&v.root, from, to) {
        commit_paths.push(crate::meta::FILE.to_string());
    }

    // Keep project folders in sync.
    let mut projs = v.project_list();
    for p in projs
        .iter_mut()
        .filter(|p| paths::is_inside(&p.folder, from))
    {
        let renamed_itself = p.folder == from;
        p.folder = format!("{to}{}", &p.folder[from.len()..]);
        // A project that is renamed keeps its folder name as its name, as long as they matched.
        let last = |s: &str| s.rsplit('/').next().unwrap_or(s).to_string();
        if renamed_itself && p.name == last(from) {
            p.name = last(to);
        }
        p.updated_at = projects::now();
        projects::save(&v.root, p)?;
        commit_paths.push(projects::file_path(&p.id));
    }
    v.reload_projects();

    v.refresh_files();
    let after: std::sync::Arc<LinkResolver> = v.resolver();
    let mut changed = Vec::new();
    // A moved note keeps its own relative links and images working (`../attachments/a.png`
    // needs another number of `../` in another folder). This is not optional: without it the
    // note would lose its pictures.
    for (old, new) in moves.iter().filter(|(_, n)| tree::is_markdown(n)) {
        let Ok(abs) = paths::resolve(&v.root, new, None) else {
            continue;
        };
        let Ok(content) = std::fs::read_to_string(abs) else {
            continue;
        };
        if let Some(r) = rewrite::rewrite_relative(&content, old, new, &moves) {
            fs_ops::write_note(&v.root, new, &r.content)?;
            changed.push(new.clone());
        }
    }
    if update_links && !moves.is_empty() {
        for f in v.file_list().iter().filter(|f| tree::is_markdown(f)) {
            let Ok(abs) = paths::resolve(&v.root, f, None) else {
                continue;
            };
            let Ok(content) = std::fs::read_to_string(abs) else {
                continue;
            };
            if let Some(r) = rewrite::rewrite_content(&content, &before, &after, &moves) {
                fs_ops::write_note(&v.root, f, &r.content)?;
                changed.push(f.clone());
            }
        }
    }
    changed.sort();
    changed.dedup();
    commit_paths.extend(changed.iter().cloned());

    // Index: drop old paths, add new ones, refresh rewritten notes.
    v.with_index(|c| {
        crate::search::remove_note(c, from)?;
        crate::search::remove_dir(c, from)
    })?;
    for new in moves.values().chain(changed.iter()) {
        v.reindex(new)?;
    }
    v.touch();
    commit_paths.sort();
    commit_paths.dedup();
    Ok((
        RenameResult {
            changed_files: changed,
        },
        commit_paths,
    ))
}

/// Renames/moves with snapshot + a single `Rename <old> → <new>` commit.
pub fn rename_path(
    v: &OpenVault,
    from: &str,
    to: &str,
    update_links: bool,
) -> AppResult<RenameResult> {
    paths::resolve(&v.root, from, None)?;
    paths::resolve(&v.root, to, None)?;
    v.commit(
        CommitReason::new(CommitKind::SnapshotBeforeRename, Some(from.to_string())),
        None,
    )?;
    let (result, commit_paths) = rename_no_commit(v, from, to, update_links)?;
    v.commit(
        CommitReason::new(CommitKind::Rename, Some(format!("{from} → {to}"))),
        Some(&commit_paths),
    )?;
    Ok(result)
}

/// Moves several pages at once, with links updated: every move is checked before the first one is
/// made, then one snapshot and one `Rename` commit. A `Notes` or `Pages` folder that is left
/// empty is removed. If a move fails half way, what was moved is committed and the error returned.
pub fn move_pages(v: &OpenVault, moves: &[PageMove]) -> AppResult<RenameResult> {
    let files = v.file_list();
    let existing: HashSet<String> = files.iter().map(|f| f.to_lowercase()).collect();
    let mut sources = HashSet::new();
    let mut targets = HashSet::new();
    for m in moves {
        paths::resolve(&v.root, &m.from, None)?;
        let target = paths::resolve(&v.root, &m.to, None)?;
        if !tree::is_markdown(&m.from) || !tree::is_markdown(&m.to) {
            return Err(AppError::InvalidPath(
                "Only pages can be moved this way".into(),
            ));
        }
        if !files.contains(&m.from) || !sources.insert(m.from.clone()) {
            return Err(AppError::NotFound(format!("{} does not exist", m.from)));
        }
        let key = m.to.to_lowercase();
        if existing.contains(&key) || target.exists() || !targets.insert(key) {
            return Err(AppError::AlreadyExists(format!("{} already exists", m.to)));
        }
    }
    if moves.is_empty() {
        return Ok(RenameResult {
            changed_files: Vec::new(),
        });
    }
    v.commit(
        CommitReason::new(
            CommitKind::SnapshotBeforeRename,
            Some("moving pages".into()),
        ),
        None,
    )?;
    let mut changed = Vec::new();
    let mut commit_paths = Vec::new();
    let mut moved = 0;
    let mut failed = None;
    for m in moves {
        match rename_no_commit(v, &m.from, &m.to, true) {
            Ok((result, paths)) => {
                moved += 1;
                changed.extend(result.changed_files);
                commit_paths.extend(paths);
                remove_emptied_folders(v, &m.from);
            }
            Err(e) => {
                failed = Some(e);
                break;
            }
        }
    }
    v.refresh_files();
    commit_paths.sort();
    commit_paths.dedup();
    if moved > 0 {
        let what = if moved == 1 { "page" } else { "pages" };
        v.commit(
            CommitReason::new(
                CommitKind::Rename,
                Some(format!("{moved} {what} into folders")),
            ),
            Some(&commit_paths),
        )?;
    }
    if let Some(e) = failed {
        return Err(e);
    }
    changed.sort();
    changed.dedup();
    Ok(RenameResult {
        changed_files: changed,
    })
}

/// Removes the folders above `moved_from` that are empty now, as far up as they are a `Notes` or
/// `Pages` folder or inside one. `remove_dir` never removes a folder that has anything in it.
fn remove_emptied_folders(v: &OpenVault, moved_from: &str) {
    let mut path = moved_from;
    while let Some((dir, _)) = path.rsplit_once('/') {
        if !dir.split('/').any(|s| s == "Notes" || s == "Pages") {
            return;
        }
        let Ok(abs) = paths::resolve(&v.root, dir, None) else {
            return;
        };
        if std::fs::remove_dir(abs).is_err() {
            return;
        }
        path = dir;
    }
}

/// Renames a note within its folder without making a commit. Used when a new note is named
/// after the title the user types: the content does not change, the history follows the rename at
/// the next commit, and a commit per pause in typing would only clutter the history.
/// Only `.md` files, only inside the same folder, never over an existing file.
pub fn rename_note_quietly(v: &OpenVault, from: &str, to: &str) -> AppResult<()> {
    if !tree::is_markdown(from) || !tree::is_markdown(to) {
        return Err(AppError::InvalidPath(
            "Only pages can be renamed this way".into(),
        ));
    }
    let folder = |p: &str| p.rsplit_once('/').map_or("", |(d, _)| d).to_string();
    if folder(from) != folder(to) {
        return Err(AppError::InvalidPath(
            "The page must stay in its folder".into(),
        ));
    }
    paths::resolve(&v.root, from, None)?;
    paths::resolve(&v.root, to, None)?;
    rename_no_commit(v, from, to, false)?;
    Ok(())
}

/// Deletes a path: snapshot commit, delete, `Delete <path>` commit. Always recoverable.
pub fn delete_path(v: &OpenVault, rel: &str) -> AppResult<()> {
    paths::resolve(&v.root, rel, None)?;
    v.commit(
        CommitReason::new(CommitKind::SnapshotBeforeDelete, Some(rel.to_string())),
        None,
    )?;
    fs_ops::delete(&v.root, rel)?;
    v.with_index(|c| {
        crate::search::remove_note(c, rel)?;
        crate::search::remove_dir(c, rel)
    })?;
    v.refresh_files();
    v.touch();
    v.commit(
        CommitReason::new(CommitKind::Delete, Some(rel.to_string())),
        Some(&[rel.to_string()]),
    )?;
    Ok(())
}

/// Saves a pasted/dropped file and returns the link path relative to the note.
pub fn save_attachment(
    v: &OpenVault,
    note_path: &str,
    file_name: &str,
    bytes: &[u8],
) -> AppResult<String> {
    let cfg = v.config();
    let link = attachments::save_attachment(
        &v.root,
        &cfg.attachments_folder,
        note_path,
        file_name,
        bytes,
    )?;
    v.refresh_files();
    v.touch();
    Ok(link)
}

/// Restores an older version of a file: snapshot, write, commit.
pub fn restore_file(v: &OpenVault, rel: &str, sha: &str) -> AppResult<()> {
    let bytes = v.with_repo(|r| history::bytes_at_commit(r, rel, sha))?;
    let abs = paths::resolve(&v.root, rel, None)?;
    v.commit(
        CommitReason::new(CommitKind::SnapshotBeforeRestore, Some(rel.to_string())),
        Some(&[rel.to_string()]),
    )?;
    fs_ops::write_atomic(&abs, &bytes)?;
    v.reindex(rel)?;
    v.touch();
    let short = &sha[..7.min(sha.len())];
    v.commit(
        CommitReason::new(CommitKind::Restore, Some(format!("{rel} to {short}"))),
        Some(&[rel.to_string()]),
    )?;
    Ok(())
}

/// Brings a deleted file back from the last commit that contained it.
pub fn restore_deleted(v: &OpenVault, rel: &str, sha: &str) -> AppResult<()> {
    let abs = paths::resolve(&v.root, rel, None)?;
    if abs.exists() {
        return Err(AppError::AlreadyExists(format!("{rel} already exists")));
    }
    let bytes = v.with_repo(|r| history::bytes_at_commit(r, rel, sha))?;
    if let Some(dir) = abs.parent() {
        std::fs::create_dir_all(dir)?;
    }
    fs_ops::write_atomic(&abs, &bytes)?;
    v.refresh_files();
    v.reindex(rel)?;
    v.touch();
    let short = &sha[..7.min(sha.len())];
    v.commit(
        CommitReason::new(CommitKind::Restore, Some(format!("{rel} to {short}"))),
        Some(&[rel.to_string()]),
    )?;
    Ok(())
}

/// What one commit did to one file: the bytes before and after (`None` = the file did not exist).
struct FileChange {
    path: String,
    before: Option<Vec<u8>>,
    after: Option<Vec<u8>>,
}

fn changes_of_commit(r: &git2::Repository, sha: &str) -> AppResult<Vec<FileChange>> {
    let oid = git2::Oid::from_str(sha).map_err(|e| AppError::Git(e.to_string()))?;
    let commit = r.find_commit(oid)?;
    let parent = commit
        .parent(0)
        .map_err(|_| AppError::Git("The first commit cannot be undone".into()))?;
    let diff = r.diff_tree_to_tree(Some(&parent.tree()?), Some(&commit.tree()?), None)?;
    let blob = |id: git2::Oid| -> AppResult<Option<Vec<u8>>> {
        if id.is_zero() {
            return Ok(None);
        }
        Ok(Some(r.find_blob(id)?.content().to_vec()))
    };
    let mut out = Vec::new();
    for delta in diff.deltas() {
        let (old, new) = (delta.old_file(), delta.new_file());
        let Some(path) = new.path().or_else(|| old.path()) else {
            continue;
        };
        out.push(FileChange {
            path: path.to_string_lossy().replace('\\', "/"),
            before: blob(old.id())?,
            after: blob(new.id())?,
        });
    }
    Ok(out)
}

/// Undoes the changes an earlier commit made (an AI commit): files it created are removed, files it
/// changed or removed are brought back as they were before it. Nothing is lost: a snapshot is
/// committed first and the undo is a commit of its own, so it can be undone too. Refuses when one
/// of the files was changed after that commit.
pub fn undo_commit(v: &OpenVault, sha: &str) -> AppResult<Vec<String>> {
    let changes = v.with_repo(|r| changes_of_commit(r, sha))?;
    // `.vault/` and hidden files are not notes; the AI never touches them.
    let changes: Vec<FileChange> = changes
        .into_iter()
        .filter(|c| !c.path.split('/').any(|p| p.starts_with('.')))
        .collect();
    if changes.is_empty() {
        return Err(AppError::NotFound("That commit changed no pages".into()));
    }
    for c in &changes {
        let abs = paths::resolve(&v.root, &c.path, None)?;
        let now = std::fs::read(&abs).ok();
        if now != c.after {
            return Err(AppError::Conflict(format!(
                "{} was changed after the AI change, so the change was not undone. Use the version history to restore it.",
                c.path
            )));
        }
    }
    v.commit(
        CommitReason::new(CommitKind::SnapshotBeforeRestore, Some("AI changes".into())),
        None,
    )?;
    let mut touched = Vec::new();
    for c in &changes {
        let abs = paths::resolve(&v.root, &c.path, None)?;
        match &c.before {
            Some(bytes) => {
                if let Some(dir) = abs.parent() {
                    std::fs::create_dir_all(dir)?;
                }
                fs_ops::write_atomic(&abs, bytes)?;
            }
            None => {
                if abs.exists() {
                    std::fs::remove_file(&abs)?;
                }
            }
        }
        touched.push(c.path.clone());
    }
    v.refresh_files();
    for p in &touched {
        v.reindex(p)?;
    }
    v.touch();
    let short = &sha[..7.min(sha.len())];
    v.commit(
        CommitReason::new(CommitKind::Restore, Some(format!("AI changes of {short}"))),
        Some(&touched),
    )?;
    Ok(touched)
}

/// What putting a tag on every page of a folder (or taking it off) would change.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TagPreview {
    /// Every page in the folder and the folders under it.
    pub total: u32,
    /// The pages that would change: the ones that do not have the tag yet (or have it, to take off).
    pub changing: Vec<String>,
}

/// The tag as pages keep it: lower case, letters, digits, `-` and `_`. `pinned` is not a tag that
/// is written in pages, so it is refused here.
pub fn page_tag(tag: &str) -> AppResult<String> {
    let t = tag.trim().trim_start_matches('#').to_lowercase();
    let ok = !t.is_empty()
        && t.chars()
            .all(|c| c.is_alphanumeric() || matches!(c, '-' | '_'));
    if !ok || t == "pinned" {
        return Err(AppError::InvalidPath(format!(
            "“{t}” is not a tag that can be put on pages"
        )));
    }
    Ok(t)
}

/// The pages in a folder, with what the tag would do to each.
fn tag_changes(
    v: &OpenVault,
    folder: &str,
    tag: &str,
    on: bool,
) -> AppResult<(u32, Vec<(String, String)>)> {
    paths::resolve(&v.root, folder, None)?;
    let prefix = format!("{folder}/");
    let mut total = 0;
    let mut changes = Vec::new();
    for rel in v.file_list() {
        if !rel.starts_with(&prefix) || !tree::is_markdown(&rel) || rel.starts_with(".vault/") {
            continue;
        }
        total += 1;
        let note = fs_ops::read_note(&v.root, &rel)?;
        let new = if on {
            crate::markdown::note_tags::add_tag(&note.content, tag)
        } else {
            crate::markdown::note_tags::remove_tag(&note.content, tag)
        };
        if new != note.content {
            changes.push((rel, new));
        }
    }
    Ok((total, changes))
}

/// Shows what a tag on every page of a folder would change, without changing anything.
pub fn tag_preview(v: &OpenVault, folder: &str, tag: &str, on: bool) -> AppResult<TagPreview> {
    let tag = page_tag(tag)?;
    let (total, changes) = tag_changes(v, folder, &tag, on)?;
    Ok(TagPreview {
        total,
        changing: changes.into_iter().map(|(p, _)| p).collect(),
    })
}

/// Puts a tag on every page of a folder, or takes it off. Only the properties of a page change.
/// A snapshot is committed before and the change after, so History brings every page back.
/// Returns the pages that changed.
pub fn set_tag_in_folder(
    v: &OpenVault,
    folder: &str,
    tag: &str,
    on: bool,
) -> AppResult<Vec<String>> {
    let tag = page_tag(tag)?;
    let (_, changes) = tag_changes(v, folder, &tag, on)?;
    if changes.is_empty() {
        return Ok(Vec::new());
    }
    v.commit(
        CommitReason::new(CommitKind::SnapshotBeforeTags, Some(folder.to_string())),
        None,
    )?;
    let mut changed = Vec::new();
    for (rel, new) in &changes {
        write_note(v, rel, new)?;
        changed.push(rel.clone());
    }
    v.commit(
        CommitReason::new(
            CommitKind::Tags,
            Some(format!(
                "{} {tag} in {folder}",
                if on { "add" } else { "remove" }
            )),
        ),
        Some(&changed),
    )?;
    Ok(changed)
}

/// Where a tag is written: the pages that have it in their properties or on a task line.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TagUse {
    /// The pages that would change.
    pub pages: Vec<String>,
    /// How many tasks (and steps) have the tag on their line.
    pub tasks: u32,
}

/// The tags Nexmio Work itself uses: they decide what a page is and are never deleted here.
fn is_system_tag(tag: &str) -> bool {
    matches!(tag, "epic" | "meeting" | "pinned")
}

/// Every page with `tag` taken off, in its properties and on its task lines. A `#tag` written in
/// the running text of a page is the person's own text and stays.
fn delete_tag_changes(v: &OpenVault, tag: &str) -> AppResult<(Vec<(String, String)>, u32)> {
    let tag = page_tag(tag)?;
    if is_system_tag(&tag) {
        return Err(AppError::InvalidPath(format!(
            "“{tag}” is one of Nexmio Work's tags and cannot be deleted"
        )));
    }
    let mut changes = Vec::new();
    let mut tasks_changed = 0;
    for rel in v.file_list() {
        if !tree::is_markdown(&rel) || rel.starts_with(".vault/") {
            continue;
        }
        let note = fs_ops::read_note(&v.root, &rel)?;
        let mut new = crate::markdown::note_tags::remove_tag(&note.content, &tag);
        // Each pass takes the tag off one line; a line changes at most once.
        for _ in 0..10_000 {
            let found = crate::tasks::parse(&rel, &new)
                .into_iter()
                .flat_map(|t| std::iter::once((t.line, t.key, t.tags)))
                .find(|(_, _, tags)| tags.contains(&tag));
            let Some((line, key, _)) = found else { break };
            let next = crate::tasks::set_tag(&new, line, &key, &tag, false)?;
            if next == new {
                break;
            }
            new = next;
            tasks_changed += 1;
        }
        if new != note.content {
            changes.push((rel, new));
        }
    }
    Ok((changes, tasks_changed))
}

/// Makes a tag that nothing has yet, so it can be offered when tagging.
pub fn make_tag(v: &OpenVault, tag: &str) -> AppResult<String> {
    let tag = page_tag(tag)?;
    if is_system_tag(&tag) {
        return Err(AppError::InvalidPath(format!(
            "“{tag}” is one of Nexmio Work's tags"
        )));
    }
    crate::meta::set_declared_tag(&v.root, &tag, true)?;
    Ok(tag)
}

/// What deleting a tag everywhere would change, without changing anything.
pub fn tag_use(v: &OpenVault, tag: &str) -> AppResult<TagUse> {
    let (changes, tasks) = delete_tag_changes(v, tag)?;
    Ok(TagUse {
        pages: changes.into_iter().map(|(p, _)| p).collect(),
        tasks,
    })
}

/// Takes a tag off every page and task of the vault. A snapshot is saved before and the change
/// after, so History brings it back. Returns the pages that changed.
pub fn delete_tag(v: &OpenVault, tag: &str) -> AppResult<Vec<String>> {
    let tag = page_tag(tag)?;
    let (changes, _) = delete_tag_changes(v, &tag)?;
    crate::meta::set_declared_tag(&v.root, &tag, false)?;
    if changes.is_empty() {
        return Ok(Vec::new());
    }
    v.commit(
        CommitReason::new(
            CommitKind::SnapshotBeforeTags,
            Some(format!("delete {tag}")),
        ),
        None,
    )?;
    let mut changed = Vec::new();
    for (rel, new) in &changes {
        write_note(v, rel, new)?;
        changed.push(rel.clone());
    }
    v.commit(
        CommitReason::new(CommitKind::Tags, Some(format!("delete {tag} everywhere"))),
        Some(&changed),
    )?;
    Ok(changed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::search::{search, SearchQuery};
    use crate::vault::open_for_test;

    fn log_messages(v: &OpenVault) -> Vec<String> {
        v.with_repo(|r| {
            let mut w = r.revwalk()?;
            w.push_head()?;
            Ok(w.filter_map(|o| r.find_commit(o.ok()?).ok())
                .map(|c| c.message().unwrap_or("").to_string())
                .collect())
        })
        .unwrap()
    }

    #[test]
    fn pages_are_moved_together_with_links_and_one_version_and_can_be_moved_back() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "Move/Plan.md", "- test [[Move/Notes/test]] [[dummy]]\n").unwrap();
        write_note(&v, "Move/Notes/test.md", "![p](../files/p.png)\n").unwrap();
        write_note(&v, "Move/dummy.md", "# dummy\n").unwrap();
        v.refresh_files();
        let moves = vec![
            PageMove {
                from: "Move/Notes/test.md".into(),
                to: "Move/Pages/test_page.md".into(),
            },
            PageMove {
                from: "Move/dummy.md".into(),
                to: "Move/Pages/test/dummy_page.md".into(),
            },
        ];
        let before = log_messages(&v).len();
        move_pages(&v, &moves).unwrap();
        let read = |p: &str| fs_ops::read_note(&v.root, p).unwrap().content;
        assert!(read("Move/Plan.md").contains("test_page"));
        assert!(read("Move/Plan.md").contains("dummy_page"));
        assert_eq!(read("Move/Pages/test_page.md"), "![p](../files/p.png)\n");
        assert!(!v.root.join("Move/Notes").exists());
        let log = log_messages(&v);
        assert_eq!(log[0], "Rename 2 pages into folders");
        assert!(log.len() <= before + 2);

        let back: Vec<PageMove> = moves
            .iter()
            .map(|m| PageMove {
                from: m.to.clone(),
                to: m.from.clone(),
            })
            .collect();
        move_pages(&v, &back).unwrap();
        assert_eq!(read("Move/dummy.md"), "# dummy\n");
        assert!(v.root.join("Move/Notes/test.md").exists());
        assert!(!v.root.join("Move/Pages").exists());
    }

    #[test]
    fn nothing_is_moved_when_one_move_cannot_be_made() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "A.md", "a").unwrap();
        write_note(&v, "B.md", "b").unwrap();
        write_note(&v, "Pages/b_page.md", "taken").unwrap();
        v.refresh_files();
        let page = |from: &str, to: &str| PageMove {
            from: from.into(),
            to: to.into(),
        };
        for moves in [
            vec![
                page("A.md", "Pages/a_page.md"),
                page("B.md", "Pages/B_page.md"),
            ],
            vec![page("A.md", "Pages/x.md"), page("B.md", "Pages/X.md")],
            vec![
                page("A.md", "Pages/a_page.md"),
                page("Gone.md", "Pages/g.md"),
            ],
        ] {
            assert!(move_pages(&v, &moves).is_err());
            assert!(v.root.join("A.md").exists());
            assert!(!v.root.join("Pages/a_page.md").exists());
        }
    }

    #[test]
    fn a_tag_is_deleted_from_properties_and_task_lines_but_not_from_text() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(
            &v,
            "A.md",
            "---\ntags: [acme, other]\n---\n# A\nbody #acme here\n",
        )
        .unwrap();
        write_note(
            &v,
            "Tasks/E.md",
            "---\ntags: [epic, acme]\n---\n# E\n\n- [ ] Call #acme #x\n",
        )
        .unwrap();
        v.refresh_files();
        v.commit(CommitReason::new(CommitKind::Save, Some("x".into())), None)
            .unwrap();
        let u = tag_use(&v, "acme").unwrap();
        assert_eq!(u.pages.len(), 2);
        assert_eq!(u.tasks, 1);
        let changed = delete_tag(&v, "#Acme").unwrap();
        assert_eq!(changed.len(), 2);
        let a = fs_ops::read_note(&v.root, "A.md").unwrap().content;
        assert!(a.contains("tags: [other]") && a.contains("body #acme here"));
        let e = fs_ops::read_note(&v.root, "Tasks/E.md").unwrap().content;
        assert!(e.contains("- [ ] Call #x") && !e.contains("acme"));
        assert!(delete_tag(&v, "epic").is_err());
        assert_eq!(make_tag(&v, "#Ny").unwrap(), "ny");
        assert!(make_tag(&v, "epic").is_err());
    }

    #[test]
    fn rename_updates_links_in_one_commit_and_index() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "Old.md", "# Old topic\nbody").unwrap();
        write_note(&v, "Index.md", "Links: [[Old]] and [[old#Part|alias]]").unwrap();
        v.refresh_files();
        v.commit(CommitReason::new(CommitKind::Save, Some("x".into())), None)
            .unwrap();

        let p = preview_rename(&v, "Old.md", "New.md").unwrap();
        assert_eq!((p.link_count, p.note_count), (2, 1));

        let before = log_messages(&v).len();
        let r = rename_path(&v, "Old.md", "New.md", true).unwrap();
        assert_eq!(r.changed_files, vec!["Index.md"]);
        assert_eq!(
            std::fs::read_to_string(d.path().join("Index.md")).unwrap(),
            "Links: [[New]] and [[New#Part|alias]]"
        );
        let msgs = log_messages(&v);
        assert_eq!(
            msgs.len(),
            before + 1,
            "exactly one commit for a clean rename: {msgs:?}"
        );
        assert_eq!(msgs[0], "Rename Old.md → New.md");
        let hits = v
            .with_index(|c| {
                search(
                    c,
                    &SearchQuery {
                        text: "topic".into(),
                        ..Default::default()
                    },
                )
            })
            .unwrap();
        assert_eq!(hits[0].path, "New.md");
    }

    #[test]
    fn a_pinned_note_stays_pinned_when_it_is_renamed() {
        let d = tempfile::tempdir().unwrap();
        let v = crate::vault::open_for_test(d.path());
        write_note(&v, "Work/A.md", "# A\n").unwrap();
        crate::meta::set_pinned(&v.root, "Work/A.md", true).unwrap();
        rename_path(&v, "Work/A.md", "Work/B.md", false).unwrap();
        assert!(crate::meta::is_pinned(&v.root, "Work/B.md"));
        assert!(!crate::meta::is_pinned(&v.root, "Work/A.md"));
        rename_path(&v, "Work", "Jobs", false).unwrap();
        assert!(crate::meta::is_pinned(&v.root, "Jobs/B.md"));
    }

    #[test]
    fn rename_folder_moves_projects_and_links() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "Work/Plan.md", "plan").unwrap();
        write_note(&v, "Home.md", "[[Plan]] and [[Work/Plan]]").unwrap();
        v.refresh_files();
        let r = rename_path(&v, "Work", "Job", true).unwrap();
        assert_eq!(r.changed_files, vec!["Home.md"]);
        assert_eq!(
            std::fs::read_to_string(d.path().join("Home.md")).unwrap(),
            "[[Plan]] and [[Plan]]"
        );
        assert!(d.path().join("Job/Plan.md").exists());
    }

    #[test]
    fn delete_is_snapshotted_and_restorable() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "Keep.md", "important unsaved text").unwrap();
        v.refresh_files();
        delete_path(&v, "Keep.md").unwrap();
        assert!(!d.path().join("Keep.md").exists());
        let msgs = log_messages(&v);
        assert_eq!(msgs[0], "Delete Keep.md");
        assert!(msgs[1].starts_with("Snapshot before delete"));
        let deleted = v.with_repo(history::deleted_files).unwrap();
        assert_eq!(deleted.len(), 1);
        restore_deleted(&v, "Keep.md", &deleted[0].sha).unwrap();
        assert_eq!(
            std::fs::read_to_string(d.path().join("Keep.md")).unwrap(),
            "important unsaved text"
        );
    }

    #[test]
    fn an_ai_commit_can_be_undone_but_not_over_later_edits() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "A.md", "old A").unwrap();
        write_note(&v, "Gone.md", "to be deleted").unwrap();
        v.commit(CommitReason::new(CommitKind::Save, Some("x".into())), None)
            .unwrap();
        // What an AI apply does: edit, create, delete, then one commit.
        write_note(&v, "A.md", "new A").unwrap();
        write_note(&v, "New.md", "created").unwrap();
        std::fs::remove_file(d.path().join("Gone.md")).unwrap();
        v.refresh_files();
        let sha = v
            .commit(CommitReason::new(CommitKind::Ai, Some("AI".into())), None)
            .unwrap()
            .unwrap();

        // An edit after the AI change blocks the undo, and nothing is touched.
        write_note(&v, "A.md", "edited by hand").unwrap();
        let err = undo_commit(&v, &sha).unwrap_err();
        assert!(matches!(err, AppError::Conflict(_)), "{err:?}");
        assert!(d.path().join("New.md").exists());
        write_note(&v, "A.md", "new A").unwrap();

        let touched = undo_commit(&v, &sha).unwrap();
        assert_eq!(touched.len(), 3);
        assert_eq!(
            std::fs::read_to_string(d.path().join("A.md")).unwrap(),
            "old A"
        );
        assert!(!d.path().join("New.md").exists());
        assert_eq!(
            std::fs::read_to_string(d.path().join("Gone.md")).unwrap(),
            "to be deleted"
        );
        // The undo is a commit of its own, and the AI version is still in history.
        assert!(log_messages(&v)[0].contains("AI changes of"));
        let hist = v.with_repo(|r| history::file_history(r, "A.md")).unwrap();
        let texts: Vec<String> = hist
            .iter()
            .map(|e| {
                v.with_repo(|r| history::file_at_commit(r, "A.md", &e.sha))
                    .unwrap()
            })
            .collect();
        assert!(texts.contains(&"new A".to_string()));
    }

    #[test]
    fn a_note_moved_into_a_folder_keeps_its_picture() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        std::fs::create_dir_all(d.path().join("attachments")).unwrap();
        std::fs::write(d.path().join("attachments/pic one.png"), b"png").unwrap();
        std::fs::create_dir_all(d.path().join("Work/Sec")).unwrap();
        write_note(&v, "Note.md", "# N\n\n![](attachments/pic%20one.png)\n").unwrap();
        v.refresh_files();
        v.commit(CommitReason::new(CommitKind::Save, Some("x".into())), None)
            .unwrap();
        // Move into a folder two levels down, with and without link updates.
        let r = rename_path(&v, "Note.md", "Work/Sec/Note.md", false).unwrap();
        assert!(r.changed_files.contains(&"Work/Sec/Note.md".to_string()));
        let text = std::fs::read_to_string(d.path().join("Work/Sec/Note.md")).unwrap();
        assert!(
            text.contains("![](../../attachments/pic%20one.png)"),
            "{text}"
        );
        // The picture the link names exists from the note's new place.
        assert!(d
            .path()
            .join("Work/Sec")
            .join("../../attachments/pic one.png")
            .exists());
        // Moving a folder with the note keeps the link working too.
        rename_path(&v, "Work", "Jobs", true).unwrap();
        let text = std::fs::read_to_string(d.path().join("Jobs/Sec/Note.md")).unwrap();
        assert!(
            text.contains("![](../../attachments/pic%20one.png)"),
            "{text}"
        );
    }

    #[test]
    fn restore_old_version_creates_snapshot_and_commit() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "A.md", "v1").unwrap();
        v.commit(
            CommitReason::new(CommitKind::Save, Some("A.md".into())),
            Some(&["A.md".into()]),
        )
        .unwrap();
        write_note(&v, "A.md", "v2").unwrap();
        v.commit(
            CommitReason::new(CommitKind::Save, Some("A.md".into())),
            Some(&["A.md".into()]),
        )
        .unwrap();
        write_note(&v, "A.md", "v3 unsaved").unwrap();
        let hist = v.with_repo(|r| history::file_history(r, "A.md")).unwrap();
        let first = hist.last().unwrap().sha.clone();
        restore_file(&v, "A.md", &first).unwrap();
        assert_eq!(
            std::fs::read_to_string(d.path().join("A.md")).unwrap(),
            "v1"
        );
        // The unsaved v3 is still in history via the snapshot commit.
        let hist = v.with_repo(|r| history::file_history(r, "A.md")).unwrap();
        let contents: Vec<String> = hist
            .iter()
            .map(|e| {
                v.with_repo(|r| history::file_at_commit(r, "A.md", &e.sha))
                    .unwrap()
            })
            .collect();
        assert!(contents.contains(&"v3 unsaved".to_string()));
    }

    #[test]
    fn open_commits_dirty_tree_and_gitignores_index() {
        let d = tempfile::tempdir().unwrap();
        std::fs::write(d.path().join("pre.md"), "hello").unwrap();
        let v = open_for_test(d.path());
        assert_eq!(log_messages(&v), vec!["Initialize vault"]);
        drop(v);
        std::fs::write(d.path().join("later.md"), "x").unwrap();
        let v = open_for_test(d.path());
        assert_eq!(log_messages(&v)[0], "Recovered uncommitted changes");
        let tree_has_index = v
            .with_repo(|r| {
                Ok(r.head()?
                    .peel_to_tree()?
                    .get_path(std::path::Path::new(".vault/index.db"))
                    .is_ok())
            })
            .unwrap();
        assert!(!tree_has_index);
    }

    #[test]
    fn a_new_note_is_renamed_quietly_with_no_commit_and_the_index_follows() {
        let dir = tempfile::tempdir().unwrap();
        let v = open_for_test(dir.path());
        std::fs::write(dir.path().join("Untitled.md"), "# Weekly sync\n\nbody").unwrap();
        v.refresh_files();
        v.reindex("Untitled.md").unwrap();
        let count = |v: &OpenVault| {
            v.with_repo(|r| {
                let mut w = r.revwalk()?;
                w.push_head()?;
                Ok(w.count())
            })
            .unwrap()
        };
        let before = count(&v);
        rename_note_quietly(&v, "Untitled.md", "Weekly sync.md").unwrap();
        assert!(!dir.path().join("Untitled.md").exists());
        assert_eq!(
            std::fs::read_to_string(dir.path().join("Weekly sync.md")).unwrap(),
            "# Weekly sync\n\nbody"
        );
        assert_eq!(count(&v), before, "no commit is made");
        let hits = v
            .with_index(|c| {
                crate::search::search(
                    c,
                    &crate::search::SearchQuery {
                        text: "body".into(),
                        tag: None,
                        folder: None,
                    },
                )
            })
            .unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].path, "Weekly sync.md");
    }

    #[test]
    fn quiet_rename_refuses_other_folders_other_file_types_and_existing_files() {
        let dir = tempfile::tempdir().unwrap();
        let v = open_for_test(dir.path());
        std::fs::create_dir_all(dir.path().join("Work")).unwrap();
        std::fs::write(dir.path().join("Work/a.md"), "a").unwrap();
        std::fs::write(dir.path().join("Work/b.md"), "b").unwrap();
        std::fs::write(dir.path().join("Work/pic.png"), "p").unwrap();
        v.refresh_files();
        assert!(rename_note_quietly(&v, "Work/a.md", "Other/a.md").is_err());
        assert!(rename_note_quietly(&v, "Work/a.md", "a.md").is_err());
        assert!(rename_note_quietly(&v, "Work/pic.png", "Work/pic2.png").is_err());
        assert!(rename_note_quietly(&v, "Work/a.md", "Work/a.txt").is_err());
        assert!(rename_note_quietly(&v, "Work/a.md", "Work/b.md").is_err());
        assert!(rename_note_quietly(&v, "Work/a.md", "../x.md").is_err());
        assert_eq!(
            std::fs::read_to_string(dir.path().join("Work/b.md")).unwrap(),
            "b"
        );
        assert!(dir.path().join("Work/a.md").exists());
    }

    #[test]
    fn a_project_can_be_renamed_in_the_root_but_not_moved_into_a_folder() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        let p = crate::projects::service::create(&v, "Docs", String::new(), None).unwrap();
        std::fs::create_dir_all(v.root.join("Other")).unwrap();
        v.refresh_files();
        // Moving into a folder is refused, and nothing changed.
        let err = rename_path(&v, "Docs", "Other/Docs", false).unwrap_err();
        assert!(matches!(err, AppError::Conflict(m) if m.contains("stays in the vault root")));
        assert!(v.root.join("Docs").is_dir());
        // Renaming in the root works, and the project follows its folder (also its name).
        rename_path(&v, "Docs", "Manuals", false).unwrap();
        let moved = v.project_list().into_iter().find(|x| x.id == p.id).unwrap();
        assert_eq!(moved.folder, "Manuals");
        assert_eq!(moved.name, "Manuals");
    }

    #[test]
    fn a_tag_is_put_on_every_page_of_a_folder_with_a_snapshot_before_and_a_commit_after() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "Acme/Offer.md", "# Offer\nbody").unwrap();
        write_note(
            &v,
            "Acme/Deep/Contract.md",
            "---\ntags: [legal]\n---\n# Contract",
        )
        .unwrap();
        write_note(&v, "Acme/Has.md", "---\ntags: [kunde-x]\n---\n# Has").unwrap();
        write_note(&v, "Other/Page.md", "# Other").unwrap();
        v.refresh_files();
        v.commit(CommitReason::new(CommitKind::Save, Some("x".into())), None)
            .unwrap();

        let p = tag_preview(&v, "Acme", "Kunde-X", true).unwrap();
        assert_eq!(p.total, 3);
        assert_eq!(p.changing, vec!["Acme/Deep/Contract.md", "Acme/Offer.md"]);

        // A change that is not committed yet is saved by the snapshot before the tags.
        write_note(&v, "Acme/Offer.md", "# Offer\nedited").unwrap();
        let before = log_messages(&v).len();
        let changed = set_tag_in_folder(&v, "Acme", "kunde-x", true).unwrap();
        assert_eq!(changed.len(), 2);
        let offer = std::fs::read_to_string(d.path().join("Acme/Offer.md")).unwrap();
        assert!(offer.starts_with("---\ntags: [kunde-x]\n---\n# Offer"));
        let contract = std::fs::read_to_string(d.path().join("Acme/Deep/Contract.md")).unwrap();
        assert!(contract.contains("tags: [legal, kunde-x]"));
        // A page in another folder is left alone.
        assert_eq!(
            std::fs::read_to_string(d.path().join("Other/Page.md")).unwrap(),
            "# Other"
        );
        let msgs = log_messages(&v);
        assert!(msgs[0].starts_with("Tags"), "{msgs:?}");
        assert!(
            msgs.iter().any(|m| m.starts_with("Snapshot before tags")),
            "{msgs:?}"
        );
        assert_eq!(msgs.len(), before + 2, "{msgs:?}");

        // Putting it on again changes nothing and commits nothing.
        let n = log_messages(&v).len();
        assert!(set_tag_in_folder(&v, "Acme", "kunde-x", true)
            .unwrap()
            .is_empty());
        assert_eq!(log_messages(&v).len(), n);
    }

    #[test]
    fn a_tag_is_taken_off_every_page_of_a_folder() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        write_note(&v, "Acme/A.md", "---\ntags: [kunde-x, legal]\n---\n# A").unwrap();
        write_note(&v, "Acme/B.md", "# B").unwrap();
        v.refresh_files();
        v.commit(CommitReason::new(CommitKind::Save, Some("x".into())), None)
            .unwrap();
        let changed = set_tag_in_folder(&v, "Acme", "kunde-x", false).unwrap();
        assert_eq!(changed, vec!["Acme/A.md"]);
        let a = std::fs::read_to_string(d.path().join("Acme/A.md")).unwrap();
        assert!(a.contains("tags: [legal]") && !a.contains("kunde-x"), "{a}");
    }

    #[test]
    fn only_a_plain_tag_can_be_put_on_pages() {
        assert_eq!(page_tag("#Kunde-X").unwrap(), "kunde-x");
        assert!(page_tag("two words").is_err());
        assert!(page_tag("").is_err());
        assert!(page_tag("pinned").is_err());
    }
}
