//! Idle autosave: commits all changes after a period without edits.

use crate::state::AppState;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};

use super::{CommitKind, CommitReason};

/// Records the time of the latest change.
#[derive(Debug, Default)]
pub struct AutosaveState {
    pub last_change: Option<Instant>,
    /// When a version was last saved (idle or every N minutes), for the periodic save.
    pub last_commit: Option<Instant>,
}

impl AutosaveState {
    /// Marks "now" as the latest change.
    pub fn touch(&mut self) {
        self.last_change = Some(Instant::now());
    }

    /// True when changes are waiting and `every` has passed since the last version (or since the
    /// first change after it). An `every` of zero means never.
    pub fn is_due(&self, every: Duration) -> bool {
        if every.is_zero() || self.last_change.is_none() {
            return false;
        }
        self.last_commit.is_none_or(|t| t.elapsed() >= every)
    }

    /// True when `idle` has passed since the latest change.
    pub fn is_idle(&self, idle: Duration) -> bool {
        self.last_change.is_some_and(|t| t.elapsed() >= idle)
    }
}

/// Spawns the background task that commits after the idle period.
pub fn spawn_idle_task(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(20)).await;
            let state = app.state::<AppState>();
            let minutes = state
                .settings
                .read()
                .map(|s| s.git.idle_commit_minutes)
                .unwrap_or(5);
            let Ok(vault) = state.current_vault() else {
                continue;
            };
            let every = state
                .settings
                .read()
                .map(|s| s.git.commit_every_minutes)
                .unwrap_or(0);
            let (idle, due) = vault
                .autosave
                .lock()
                .map(|a| {
                    (
                        a.is_idle(Duration::from_secs(u64::from(minutes) * 60)),
                        a.is_due(Duration::from_secs(u64::from(every) * 60)),
                    )
                })
                .unwrap_or((false, false));
            if !idle && !due {
                continue;
            }
            let v = vault.clone();
            let _ = tauri::async_runtime::spawn_blocking(move || {
                let r = v.commit(CommitReason::new(CommitKind::Idle, None), None);
                if let Ok(mut a) = v.autosave.lock() {
                    // A version saved while you are still writing: the next one is due later.
                    a.last_commit = Some(Instant::now());
                    if idle {
                        a.last_change = None;
                    }
                }
                r
            })
            .await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_version_is_due_every_so_often_while_changes_wait() {
        let mut a = AutosaveState::default();
        assert!(!a.is_due(Duration::from_secs(60)));
        a.touch();
        assert!(a.is_due(Duration::from_secs(60)));
        assert!(!a.is_due(Duration::ZERO));
        a.last_commit = Some(Instant::now());
        assert!(!a.is_due(Duration::from_secs(60)));
    }

    #[test]
    fn idle_detection() {
        let mut a = AutosaveState::default();
        assert!(!a.is_idle(Duration::from_secs(0)));
        a.touch();
        assert!(a.is_idle(Duration::from_secs(0)));
        assert!(!a.is_idle(Duration::from_secs(60)));
    }
}
