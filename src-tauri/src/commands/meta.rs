//! Commands on `.vault/meta.json`: the column widths of tables, and (TEMPORARY, since 0.23) the
//! move of pins and "waiting for" from the notes, which asks the person first (see `meta::migrate`).

use crate::error::AppError;
use crate::meta::{
    self,
    migrate::{self, MigrationCount},
};
use crate::state::AppState;
use crate::vault::paths;
use std::collections::BTreeMap;
use tauri::State;

/// How much in the open vault is still written the old way.
#[tauri::command]
pub async fn meta_migration_status(state: State<'_, AppState>) -> Result<MigrationCount, AppError> {
    let v = state.current_vault()?;
    Ok(migrate::scan(&v))
}

/// Moves it, after the person said yes. Returns how much was moved.
#[tauri::command]
pub async fn meta_migrate(state: State<'_, AppState>) -> Result<MigrationCount, AppError> {
    let v = state.current_vault()?;
    migrate::run(&v)
}

/// The column widths kept for the tables of a page, by the words of each header.
#[tauri::command]
pub async fn table_widths(
    state: State<'_, AppState>,
    path: String,
) -> Result<BTreeMap<String, Vec<u32>>, AppError> {
    let v = state.current_vault()?;
    paths::resolve(&v.root, &path, None)?;
    Ok(meta::table_widths(&v.root, &path))
}

/// Keeps (or, with no widths, forgets) the column widths of a table; committed with the vault.
#[tauri::command]
pub async fn set_table_widths(
    state: State<'_, AppState>,
    path: String,
    key: String,
    widths: Vec<u32>,
) -> Result<(), AppError> {
    let v = state.current_vault()?;
    paths::resolve(&v.root, &path, None)?;
    meta::set_table_widths(&v.root, &path, &key, widths)?;
    v.touch();
    Ok(())
}
