//! Where the built-in AI keeps its files.
//!
//! The engine (llama.cpp) is part of Nexmio Work's package: the folder `engine/` next to the
//! program (`bundled_engine`). Only what the app downloads or is given is kept in one folder,
//! `nexmio-work-ai`, with `models/` (the model files) and `logs/`. On Windows it sits next to the
//! installed program, so uninstalling Nexmio Work can remove it. Where that is not possible (Linux
//! packages, the Store package, `pnpm tauri dev`, a program folder that cannot be written to) it is
//! in the user's own data folder.

use crate::error::{AppError, AppResult};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, Runtime};

/// The name of the folder.
pub const FOLDER: &str = "nexmio-work-ai";

/// The folders of the built-in AI.
#[derive(Debug, Clone)]
pub struct Dirs {
    pub root: PathBuf,
    /// The engine that is part of the package (read-only).
    pub engine: PathBuf,
    pub models: PathBuf,
    pub logs: PathBuf,
    /// Why the files are not next to the program, when that was expected.
    pub note: Option<String>,
}

/// True when files can be created in `dir` (it is made if it is missing).
pub fn is_writable(dir: &Path) -> bool {
    if std::fs::create_dir_all(dir).is_err() {
        return false;
    }
    let probe = dir.join(".write-test");
    let ok = std::fs::write(&probe, b"x").is_ok();
    let _ = std::fs::remove_file(probe);
    ok
}

/// Chooses the root folder: inside `install_dir` when there is one and it can be written to,
/// otherwise inside `data_dir`.
pub fn choose_root(install_dir: Option<&Path>, data_dir: &Path) -> (PathBuf, Option<String>) {
    if let Some(install) = install_dir {
        let beside = install.join(FOLDER);
        if is_writable(&beside) {
            return (beside, None);
        }
        return (
            data_dir.join(FOLDER),
            Some(format!(
                "Nexmio Work cannot write to its program folder ({}), so the built-in AI is kept in your user data folder instead. It is not removed when Nexmio Work is uninstalled: use Remove files first.",
                install.display()
            )),
        );
    }
    (data_dir.join(FOLDER), None)
}

/// True when `exe` lives in a Microsoft Store (MSIX) package folder (`...\WindowsApps\...`).
/// Such a program folder is read-only, and the package's data is removed when the app is.
pub fn is_packaged_path(exe: &Path) -> bool {
    // Split on both kinds of slash so a Windows path is recognised wherever this runs.
    exe.to_string_lossy()
        .split(['/', '\\'])
        .any(|part| part.eq_ignore_ascii_case("WindowsApps"))
}

/// True when Nexmio Work runs as a Microsoft Store package.
pub fn is_packaged() -> bool {
    cfg!(windows)
        && std::env::current_exe()
            .ok()
            .is_some_and(|p| is_packaged_path(&p))
}

/// The folders for this computer. Does not create them.
pub fn dirs<R: Runtime>(app: &AppHandle<R>) -> AppResult<Dirs> {
    let data = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("Cannot find the user data folder: {e}")))?;
    // Only a release build on Windows lives in its own program folder. A Store package does not:
    // its program folder is read-only, so the data folder is used, and it goes with the app.
    let install = if cfg!(windows) && !cfg!(debug_assertions) && !is_packaged() {
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(Path::to_path_buf))
    } else {
        None
    };
    let (root, note) = choose_root(install.as_deref(), &data);
    Ok(Dirs {
        engine: bundled_engine(app),
        models: root.join("models"),
        logs: root.join("logs"),
        root,
        note,
    })
}

/// The folder with the engine that is part of the package: `engine/` among the program's
/// resources. A development build (`pnpm tauri dev`) uses `src-tauri/engine-bundle/`, which
/// `pnpm engine:fetch` fills.
pub fn bundled_engine<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    let packaged = app.path().resource_dir().ok().map(|d| d.join("engine"));
    match packaged {
        Some(p) if p.join(SERVER_NAME).is_file() => p,
        #[cfg(debug_assertions)]
        other => {
            let dev = Path::new(env!("CARGO_MANIFEST_DIR")).join("engine-bundle");
            if dev.join(SERVER_NAME).is_file() {
                dev
            } else {
                other.unwrap_or(dev)
            }
        }
        #[cfg(not(debug_assertions))]
        other => other.unwrap_or_default(),
    }
}

/// The name of the engine program.
pub const SERVER_NAME: &str = if cfg!(windows) {
    "llama-server.exe"
} else {
    "llama-server"
};

/// The full path of the engine program, when the package has it.
pub fn server_path(dirs: &Dirs) -> PathBuf {
    dirs.engine.join(SERVER_NAME)
}

/// Where the engine runs from: the package's own folder, or (when a package format dropped the
/// executable bit, as some Linux packages do) a copy in Nexmio Work's data folder.
pub fn runnable_engine(dirs: &Dirs) -> AppResult<PathBuf> {
    if !server_path(dirs).is_file() {
        return Err(AppError::NotFound(
            "The AI engine is missing from this installation of Nexmio Work. Reinstall Nexmio Work."
                .into(),
        ));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let executable = |p: &Path| {
            std::fs::metadata(p)
                .map(|m| m.permissions().mode() & 0o111 != 0)
                .unwrap_or(false)
        };
        if !executable(&server_path(dirs)) {
            let copy = dirs.root.join("engine-copy");
            std::fs::create_dir_all(&copy)?;
            for entry in std::fs::read_dir(&dirs.engine)?.flatten() {
                let dest = copy.join(entry.file_name());
                if entry.path().is_file() {
                    std::fs::copy(entry.path(), &dest)?;
                    std::fs::set_permissions(&dest, std::fs::Permissions::from_mode(0o755))?;
                }
            }
            return Ok(copy);
        }
    }
    Ok(dirs.engine.clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_program_folder_is_used_when_it_can_be_written() {
        let install = tempfile::tempdir().unwrap();
        let data = tempfile::tempdir().unwrap();
        let (root, note) = choose_root(Some(install.path()), data.path());
        assert_eq!(root, install.path().join(FOLDER));
        assert!(note.is_none());
        assert!(root.is_dir());
    }

    #[test]
    fn a_store_package_folder_is_recognised() {
        assert!(is_packaged_path(Path::new(
            r"C:\Program Files\WindowsApps\Nexmio.Work_0.8.1.0_x64__abc\nexmio-work.exe"
        )));
        assert!(is_packaged_path(Path::new(
            "/x/windowsapps/NexmioWork/nexmio-work.exe"
        )));
        assert!(!is_packaged_path(Path::new(
            r"C:\Users\me\AppData\Local\NexmioWork\nexmio-work.exe"
        )));
        assert!(!is_packaged_path(Path::new("/usr/bin/nexmio-work")));
    }

    #[test]
    fn the_data_folder_is_used_without_an_install_folder() {
        let data = tempfile::tempdir().unwrap();
        let (root, note) = choose_root(None, data.path());
        assert_eq!(root, data.path().join(FOLDER));
        assert!(note.is_none());
    }

    #[test]
    fn an_unwritable_program_folder_falls_back_and_says_why() {
        let data = tempfile::tempdir().unwrap();
        // A file where the folder should be makes the folder impossible to create.
        let blocker = tempfile::NamedTempFile::new().unwrap();
        let (root, note) = choose_root(Some(blocker.path()), data.path());
        assert_eq!(root, data.path().join(FOLDER));
        let note = note.unwrap();
        assert!(note.contains("cannot write"));
        assert!(note.contains("Remove files"));
    }

    #[test]
    fn the_engine_is_found_in_the_package_folder() {
        let engine = tempfile::tempdir().unwrap();
        let root = tempfile::tempdir().unwrap();
        let dirs = Dirs {
            root: root.path().into(),
            engine: engine.path().into(),
            models: root.path().join("models"),
            logs: root.path().join("logs"),
            note: None,
        };
        assert!(server_path(&dirs).ends_with(SERVER_NAME));
        assert!(runnable_engine(&dirs).is_err(), "missing engine");
        std::fs::write(server_path(&dirs), b"x").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            // Without the executable bit the engine is copied and made runnable.
            std::fs::set_permissions(server_path(&dirs), std::fs::Permissions::from_mode(0o644))
                .unwrap();
            let run = runnable_engine(&dirs).unwrap();
            assert_eq!(run, root.path().join("engine-copy"));
            let mode = std::fs::metadata(run.join(SERVER_NAME))
                .unwrap()
                .permissions()
                .mode();
            assert!(mode & 0o111 != 0);
            std::fs::set_permissions(server_path(&dirs), std::fs::Permissions::from_mode(0o755))
                .unwrap();
        }
        assert_eq!(runnable_engine(&dirs).unwrap(), engine.path());
    }
}
