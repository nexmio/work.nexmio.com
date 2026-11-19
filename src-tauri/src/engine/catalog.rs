//! What can be downloaded: the engine (llama.cpp's `llama-server`) and the models. Every file is
//! pinned to a size and a SHA-256, so a changed or damaged download is refused.

use super::hardware::{current_os, Backend, GpuVendor, Os};
use serde::Serialize;
use ts_rs::TS;

/// The llama.cpp release the engine files come from.
pub const ENGINE_BUILD: &str = "b11636";

/// Where llama.cpp releases are downloaded from.
const ENGINE_URL: &str = "https://github.com/ggml-org/llama.cpp/releases/download";

/// One downloadable file with its expected size and SHA-256.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EngineFile {
    pub name: &'static str,
    pub size: u64,
    pub sha256: &'static str,
}

impl EngineFile {
    /// The address the file is downloaded from.
    pub fn url(&self) -> String {
        format!("{ENGINE_URL}/{ENGINE_BUILD}/{}", self.name)
    }
}

/// The files that make up one engine build (the program, and for CUDA the runtime too).
pub fn engine_files(os: Os, backend: Backend) -> Option<&'static [EngineFile]> {
    Some(match (os, backend) {
        (Os::Windows, Backend::Cpu) => &[EngineFile {
            name: "llama-b11636-bin-win-cpu-x64.zip",
            size: 19519411,
            sha256: "1318f9043a8dfdbaf461f2a56ceea5b6ae31b8f25649cb1b85e2bb744d032db5",
        }],
        (Os::Windows, Backend::Vulkan) => &[EngineFile {
            name: "llama-b11636-bin-win-vulkan-x64.zip",
            size: 32142425,
            sha256: "50f23bc8b87d611e332e1529fa849095719f4f5c257b6c4c847f62c0d391ff1c",
        }],
        (Os::Linux, Backend::Cpu) => &[EngineFile {
            name: "llama-b11636-bin-ubuntu-x64.tar.gz",
            size: 17823415,
            sha256: "4295a463857a767d957c724cbad2f366d1e6aad21f54f8f88782287da86324ba",
        }],
        (Os::Linux, Backend::Vulkan) => &[EngineFile {
            name: "llama-b11636-bin-ubuntu-vulkan-x64.tar.gz",
            size: 30450220,
            sha256: "23927de7c4080d3eceb32920d670205f495c345fb1b06de173637b549efa11f0",
        }],
        _ => return None,
    })
}

/// One engine build as shown in the settings.
#[derive(Debug, Clone, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct BackendInfo {
    pub id: Backend,
    pub label: String,
    pub description: String,
    /// The graphics cards this build is the default for.
    pub default_for: Vec<GpuVendor>,
    #[ts(type = "number")]
    pub download_bytes: u64,
}

/// The engine builds that exist for this operating system.
pub fn backends(os: Os) -> Vec<BackendInfo> {
    let all = [
        (
            Backend::Cpu,
            "CPU only",
            "Runs on the processor. Works everywhere and is the slowest.",
            vec![GpuVendor::None],
        ),
        (
            Backend::Vulkan,
            "Graphics card (Vulkan)",
            "Works with AMD, Intel and Nvidia graphics cards. Needs an up-to-date graphics driver.",
            vec![GpuVendor::Nvidia, GpuVendor::Amd, GpuVendor::Intel],
        ),
    ];
    all.into_iter()
        .filter_map(|(id, label, description, default_for)| {
            let files = engine_files(os, id)?;
            Some(BackendInfo {
                id,
                label: label.into(),
                description: description.into(),
                default_for,
                download_bytes: files.iter().map(|f| f.size).sum(),
            })
        })
        .collect()
}

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
    pub backends: Vec<BackendInfo>,
    pub models: Vec<ModelInfo>,
    /// Set when the built-in AI cannot be downloaded in this version of Nexmio Work, and why.
    pub unavailable_reason: Option<String>,
}

/// Why the llama.cpp engine cannot be downloaded here, or `None` when it can. A Microsoft Store
/// (MSIX) package never runs a downloaded program: some organisations block it from starting
/// (seen on a managed laptop) and the Store's policy 10.2.2 is against it.
pub fn unavailable_reason() -> Option<String> {
    if super::paths::is_packaged() {
        return Some(
            "The Microsoft Store version of Nexmio Work cannot run the downloaded engine. Use LM Studio, or install Nexmio Work from GitHub to use the built-in AI."
                .into(),
        );
    }
    None
}

/// The catalog for this operating system.
pub fn catalog() -> Catalog {
    Catalog {
        unavailable_reason: unavailable_reason(),
        engine_build: ENGINE_BUILD.into(),
        os: current_os(),
        backends: backends(current_os()),
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

    const ALL: [Backend; 2] = [Backend::Cpu, Backend::Vulkan];

    fn is_sha256(s: &str) -> bool {
        s.len() == 64
            && s.chars()
                .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
    }

    #[test]
    fn every_engine_file_is_pinned_and_comes_from_the_pinned_build() {
        for os in [Os::Windows, Os::Linux] {
            for b in ALL {
                let files = engine_files(os, b).unwrap_or_else(|| panic!("{os:?} {b:?}"));
                assert!(!files.is_empty());
                for f in files {
                    assert!(is_sha256(f.sha256), "{}", f.name);
                    assert!(f.size > 1_000_000, "{}", f.name);
                    assert!(f.url().starts_with(&format!(
                        "https://github.com/ggml-org/llama.cpp/releases/download/{ENGINE_BUILD}/"
                    )));
                    // Windows gets zip files, Linux tar.gz files.
                    assert_eq!(f.name.ends_with(".zip"), os == Os::Windows, "{}", f.name);
                    assert!(f.name.ends_with(".zip") || f.name.ends_with(".tar.gz"));
                }
            }
        }
        assert!(engine_files(Os::Unsupported, Backend::Cpu).is_none());
    }

    #[test]
    fn only_the_cpu_and_the_vulkan_builds_are_offered() {
        for os in [Os::Windows, Os::Linux] {
            let ids: Vec<Backend> = backends(os).iter().map(|b| b.id).collect();
            assert_eq!(ids, vec![Backend::Cpu, Backend::Vulkan]);
            // One file each: the build is a single archive, with no runtime to add.
            for b in ALL {
                assert_eq!(engine_files(os, b).unwrap().len(), 1);
            }
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
    fn the_catalog_lists_a_default_engine_for_every_graphics_vendor() {
        for os in [Os::Windows, Os::Linux] {
            let list = backends(os);
            for v in [
                GpuVendor::Nvidia,
                GpuVendor::Amd,
                GpuVendor::Intel,
                GpuVendor::None,
            ] {
                assert!(
                    list.iter().any(|b| b.default_for.contains(&v)),
                    "{os:?} {v:?}"
                );
            }
        }
        assert!(backends(Os::Unsupported).is_empty());
    }

    #[test]
    fn model_lookup_by_id() {
        assert!(model("gemma-4-12b-qat").is_some());
        assert!(model("nope").is_none());
    }
}
