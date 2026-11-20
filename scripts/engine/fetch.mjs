// `pnpm engine:fetch [windows|linux] [--smoke]`
//
// Fetches the llama.cpp engine that is part of Nexmio Work (pinned in src-tauri/engine.json),
// checks its size and SHA-256, and puts the files the app needs in src-tauri/engine-bundle/, where
// the installer and the Store package pick them up (`bundle.resources` in tauri.conf.json,
// scripts/msix/Build-Msix.ps1). The tools that only a developer needs (cli, bench, quantize, …)
// are left out. With --smoke the engine program is started with --version, so a missing library
// fails here and not on somebody's computer.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const pins = JSON.parse(fs.readFileSync(path.join(root, "src-tauri/engine.json"), "utf8"));
const args = process.argv.slice(2);
const smoke = args.includes("--smoke");
const target =
  args.find((a) => a === "windows" || a === "linux") ??
  (process.platform === "win32" ? "windows" : process.platform === "linux" ? "linux" : null);
if (target === null || pins[target] === undefined) {
  console.error("The engine is built for windows and linux only.");
  process.exit(1);
}
const pin = pins[target];
const out = path.join(root, "src-tauri/engine-bundle");
const work = path.join(os.tmpdir(), `nexmio-engine-${pins.build}-${target}`);

/** The engine program. */
const SERVER = target === "windows" ? "llama-server.exe" : "llama-server";

/** Whether a file of the download is part of what the app needs (the tools are not). */
export function keep(name) {
  if (target === "windows") {
    if (name === "llama.exe" || name === "ggml-rpc-server.exe" || name === "ggml-rpc.dll")
      return false;
    if (/^llama-(?!server|common)/.test(name)) return false;
    return true;
  }
  if (name === "llama" || name === "ggml-rpc-server" || name === "libggml-rpc.so") return false;
  if (name === "LICENSE") return false; // our own copy of the licence goes in instead
  if (/^llama-(?!server$)/.test(name)) return false;
  if (/^libllama-.*-impl\.so$/.test(name) && name !== "libllama-server-impl.so") return false;
  return true;
}

async function download(file) {
  fs.mkdirSync(work, { recursive: true });
  const dest = path.join(work, pin.file);
  const verified = () => {
    if (!fs.existsSync(dest) || fs.statSync(dest).size !== pin.size) return false;
    return crypto.createHash("sha256").update(fs.readFileSync(dest)).digest("hex") === pin.sha256;
  };
  if (verified()) return dest;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`Downloading ${pin.file} (attempt ${attempt})…`);
    try {
      const res = await fetch(`${pins.url}/${pins.build}/${pin.file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      if (verified()) return dest;
      console.error("The file is not the one that is pinned (size or SHA-256).");
    } catch (e) {
      console.error(String(e));
    }
  }
  throw new Error(`Could not get ${file}`);
}

/** The folder the archive unpacks into (the files themselves, or one folder holding them). */
function unpack(archive) {
  const dir = path.join(work, "unpacked");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  // `tar` reads .zip on Windows (bsdtar) and .tar.gz on Linux.
  // On Windows the system's own tar (bsdtar) is used: a tar from Git for Windows cannot read zip files.
  const tar =
    process.platform === "win32"
      ? path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe")
      : "tar";
  execFileSync(tar, ["-xf", archive, "-C", dir], { stdio: "inherit" });
  const entries = fs.readdirSync(dir);
  const only = entries.length === 1 ? path.join(dir, entries[0]) : null;
  return only !== null && fs.statSync(only).isDirectory() ? only : dir;
}

function assemble(from) {
  for (const f of fs.readdirSync(out))
    if (f !== "README.txt") fs.rmSync(path.join(out, f), { force: true, recursive: true });
  let count = 0;
  let bytes = 0;
  for (const name of fs.readdirSync(from)) {
    const src = path.join(from, name);
    const link = fs.lstatSync(src).isSymbolicLink();
    if (!keep(name)) continue;
    // A shared library comes as libx.so -> libx.so.0 -> libx.so.0.6.0. The program asks for
    // libx.so.0, so that one is kept (as a real file) and the other two are not.
    if (link && !/\.so\.\d+$/.test(name)) continue;
    if (!link && /\.so\.\d+\.\d+\.\d+$/.test(name)) continue;
    const dest = path.join(out, name);
    fs.copyFileSync(src, dest); // follows a link
    if (target === "linux") fs.chmodSync(dest, 0o755);
    count += 1;
    bytes += fs.statSync(dest).size;
  }
  fs.copyFileSync(
    path.join(root, "src-tauri/engine-licenses/llama.cpp-LICENSE.txt"),
    path.join(out, "LICENSE-llama.cpp.txt"),
  );
  if (!fs.existsSync(path.join(out, SERVER))) throw new Error(`${SERVER} is not in the download.`);
  fs.writeFileSync(
    path.join(out, "ENGINE.txt"),
    `llama.cpp ${pins.build}, ${target}: the graphics card (Vulkan) backend and every processor backend.\n`,
  );
  console.log(
    `${String(count)} files, ${(bytes / 1048576).toFixed(1)} MB, in ${path.relative(root, out)}`,
  );
}

fs.mkdirSync(out, { recursive: true });
const archive = await download(pin.file);
assemble(unpack(archive));

if (smoke) {
  const server = path.join(out, SERVER);
  console.log(`Starting ${SERVER} --version…`);
  try {
    const text = execFileSync(server, ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(text.trim());
  } catch (e) {
    console.error(`The engine does not start from ${out}:\n${String(e.stderr ?? e)}`);
    process.exit(1);
  }
}
