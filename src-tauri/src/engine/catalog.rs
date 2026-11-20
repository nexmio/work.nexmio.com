//! What can be downloaded: the models. Every file is pinned to a size and a SHA-256, so a changed or
//! damaged download is refused. The engine (llama.cpp's `llama-server`) is part of the package; its
//! pins are in `src-tauri/engine.json`.

use super::hardware::{current_os, Os};
use serde::Serialize;
use ts_rs::TS;

/// The llama.cpp release of the engine in the package (the same as `engine.json`; a test checks).
pub const ENGINE_BUILD: &str = "b11636";

/// A model that can be downloaded.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ModelEntry {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    /// The file name inside Nexmio Work's models folder.
    pub file: &'static str,
    /// Where the file is downloaded from (pinned to a commit of the model repository).
    pub url: &'static str,
    pub size: u64,
    pub sha256: &'static str,
    /// Memory the model needs to run comfortably, in GB.
    pub ram_gb: u32,
    pub recommended: bool,
}

/// The models offered. All are Google's Gemma 4, quantisation-aware trained, Apache-2.0.
pub const MODELS: &[ModelEntry] = &[
    ModelEntry {
        id: "gemma-4-12b-qat",
        name: "Gemma 4 12B (recommended)",
        description: "A good balance of quality and speed for notes. Needs about 12 GB of memory.",
        file: "gemma-4-12b-it-qat-q4_0.gguf",
        url: "https://huggingface.co/google/gemma-4-12B-it-qat-q4_0-gguf/resolve/29d097773436b69ff9feafd636ab4cf873786537/gemma-4-12b-it-qat-q4_0.gguf",
        size: 6_975_879_296,
        sha256: "93567e57a8fe10b23569b9d9ec38cd005deedf71e29477c421a4b83f418a538b",
        ram_gb: 12,
        recommended: true,
    },
    ModelEntry {
        id: "gemma-4-e4b-qat",
        name: "Gemma 4 E4B (lighter)",
        description: "Smaller and faster, a little less capable. Needs about 8 GB of memory.",
        file: "gemma-4-E4B_q4_0-it.gguf",
        url: "https://huggingface.co/google/gemma-4-E4B-it-qat-q4_0-gguf/resolve/4b4a2c1d584be7264f87aac328a1bc739ce81b6c/gemma-4-E4B_q4_0-it.gguf",
        size: 5_154_941_280,
        sha256: "676c35070db6dbe52f93e9c864ee0fba4eddea94b9c875d9cb10daff453fbaee",
        ram_gb: 8,
        recommended: false,
    },
    ModelEntry {
        id: "gemma-4-e2b-qat",
        name: "Gemma 4 E2B (very light)",
        description: "For computers with little memory. Quick, but it makes more mistakes and may show its reasoning in the answer. Needs about 6 GB of memory.",
        file: "gemma-4-E2B_q4_0-it.gguf",
        url: "https://huggingface.co/google/gemma-4-E2B-it-qat-q4_0-gguf/resolve/675cff42a74c774d6cb76f76d8eacb49b48c9b93/gemma-4-E2B_q4_0-it.gguf",
        size: 3_349_516_256,
        sha256: "fa401b55b07ee70a54c6dae3903c783a6e65064312529ea57175cb5f8dec6634",
        ram_gb: 6,
        recommended: false,
    },
    ModelEntry {
        id: "gemma-4-26b-a4b-qat",
        name: "Gemma 4 26B-A4B (heavier)",
        description: "The most capable, and fast for its size. Needs about 24 GB of memory.",
        file: "gemma-4-26B_q4_0-it.gguf",
        url: "https://huggingface.co/google/gemma-4-26B-A4B-it-qat-q4_0-gguf/resolve/d1c082be9cf3c8a514acf63b8761f4b41935842e/gemma-4-26B_q4_0-it.gguf",
        size: 14_439_363_584,
        sha256: "3eca3b8f6d7baf218a7dd6bba5fb59a56ee25fe2d567b6f5f589b4f697eca51d",
        ram_gb: 24,
        recommended: false,
    },
];

/// Looks up a model by id.
pub fn model(id: &str) -> Option<&'static ModelEntry> {
    MODELS.iter().find(|m| m.id == id)
}

/// A model as shown in the settings.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    #[ts(type = "number")]
    pub size_bytes: u64,
    pub ram_gb: u32,
    pub recommended: bool,
}

/// Everything that can be downloaded on this operating system.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct Catalog {
    pub engine_build: String,
    pub os: Os,
    pub models: Vec<ModelInfo>,
    /// Set when the built-in AI cannot be downloaded in this version of Nexmio Work, and why.
    pub unavailable_reason: Option<String>,
}

/// Why the built-in AI cannot be used here, or `None` when it can. Every version of Nexmio Work
/// can, the Microsoft Store package too (the Store and the GitHub versions are the same build,
/// with the engine inside).
/// Kept as the one place to say no, should a version ever need to.
pub fn unavailable_reason() -> Option<String> {
    None
}

/// The catalog for this operating system.
pub fn catalog() -> Catalog {
    Catalog {
        unavailable_reason: unavailable_reason(),
        engine_build: ENGINE_BUILD.into(),
        os: current_os(),
        models: MODELS
            .iter()
            .map(|m| ModelInfo {
                id: m.id.into(),
                name: m.name.into(),
                description: m.description.into(),
                size_bytes: m.size,
                ram_gb: m.ram_gb,
                recommended: m.recommended,
            })
            .collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::hardware::Backend;

    fn is_sha256(s: &str) -> bool {
        s.len() == 64
            && s.chars()
                .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
    }

    #[test]
    fn the_engine_build_is_the_one_in_engine_json() {
        let json: serde_json::Value =
            serde_json::from_str(include_str!("../../engine.json")).unwrap();
        assert_eq!(json["build"], ENGINE_BUILD);
        for os in ["windows", "linux"] {
            assert!(is_sha256(json[os]["sha256"].as_str().unwrap()), "{os}");
            assert!(json[os]["file"].as_str().unwrap().contains(ENGINE_BUILD));
        }
    }

    #[test]
    fn settings_from_before_still_read_the_old_engine_names_as_vulkan() {
        for old in ["cuda12", "cuda13", "rocm", "sycl", "vulkan"] {
            let b: Backend = serde_json::from_str(&format!("\"{old}\"")).unwrap();
            assert_eq!(b, Backend::Vulkan, "{old}");
        }
        let cpu: Backend = serde_json::from_str("\"cpu\"").unwrap();
        assert_eq!(cpu, Backend::Cpu);
    }

    #[test]
    fn every_model_is_pinned_to_a_commit_and_a_checksum() {
        let mut ids = std::collections::HashSet::new();
        for m in MODELS {
            assert!(ids.insert(m.id), "duplicate id {}", m.id);
            assert!(is_sha256(m.sha256), "{}", m.id);
            assert!(m.url.starts_with("https://huggingface.co/google/"));
            assert!(m.url.ends_with(m.file), "{}", m.id);
            let commit = m
                .url
                .split("/resolve/")
                .nth(1)
                .and_then(|r| r.split('/').next());
            assert_eq!(
                commit.map(str::len),
                Some(40),
                "{} is not pinned to a commit",
                m.id
            );
            assert!(m.file.ends_with(".gguf"));
            assert!(m.size > 1_000_000_000);
        }
        assert_eq!(MODELS.iter().filter(|m| m.recommended).count(), 1);
    }

    #[test]
    fn model_lookup_by_id() {
        assert!(model("gemma-4-12b-qat").is_some());
        assert!(model("nope").is_none());
    }
}
