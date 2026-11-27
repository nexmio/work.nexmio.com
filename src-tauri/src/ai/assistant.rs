//! The assistant's tools beyond pages: it reads the tasks, the projects (with their plans) and
//! the meetings, searches the help of Nexmio Work, can offer a place to open ("Show me"), and
//! proposes tasks and parts. A proposal is a change to the epic or plan page, queued for the same
//! review as any other change: nothing is written before the user accepts it.
//!
//! What is read follows the chat's rules: inside a project's chat only that project's folder, and
//! with a cloud AI nothing from a project marked Local AI only.

use super::proposals::{ProposalAction, ProposalSet};
use super::providers::types::{parse_args, ToolCall, ToolDef};
use super::tools::{arg, err, queue, ToolOutcome};
use crate::commands::tasks::{all_epics, all_tasks, notes_with_front_tag};
use crate::projects::Project;
use crate::tasks::Task;
use crate::vault::{fs_ops, paths, OpenVault};
use serde_json::{json, Value};

/// The most lines a listing gives the model.
const MAX_LINES: usize = 200;

/// The help of Nexmio Work, as the app shows it (the topics are compiled in).
const HELP: &[(&str, &str)] = &[
    (
        "start",
        include_str!("../../../src/features/help/topics/start.md"),
    ),
    (
        "writing",
        include_str!("../../../src/features/help/topics/writing.md"),
    ),
    (
        "tasks",
        include_str!("../../../src/features/help/topics/tasks.md"),
    ),
    (
        "plans",
        include_str!("../../../src/features/help/topics/plans.md"),
    ),
    (
        "templates",
        include_str!("../../../src/features/help/topics/templates.md"),
    ),
    (
        "projects",
        include_str!("../../../src/features/help/topics/projects.md"),
    ),
    (
        "ai",
        include_str!("../../../src/features/help/topics/ai.md"),
    ),
    (
        "builtin",
        include_str!("../../../src/features/help/topics/builtin.md"),
    ),
    (
        "search",
        include_str!("../../../src/features/help/topics/search.md"),
    ),
    (
        "history",
        include_str!("../../../src/features/help/topics/history.md"),
    ),
    (
        "links",
        include_str!("../../../src/features/help/topics/links.md"),
    ),
    (
        "images",
        include_str!("../../../src/features/help/topics/images.md"),
    ),
    (
        "mermaid",
        include_str!("../../../src/features/help/topics/mermaid.md"),
    ),
    (
        "shortcuts",
        include_str!("../../../src/features/help/topics/shortcuts.md"),
    ),
    (
        "vaults",
        include_str!("../../../src/features/help/topics/vaults.md"),
    ),
    (
        "import",
        include_str!("../../../src/features/help/topics/import.md"),
    ),
    (
        "export",
        include_str!("../../../src/features/help/topics/export.md"),
    ),
    (
        "title",
        include_str!("../../../src/features/help/topics/title.md"),
    ),
    (
        "helper",
        include_str!("../../../src/features/help/topics/helper.md"),
    ),
];

/// The places "Show me" can open, with the words on the button. The frontend knows the same ids.
pub const PLACES: &[(&str, &str)] = &[
    ("start", "Start"),
    ("pages", "Pages"),
    ("tasks", "Tasks"),
    ("time", "Time"),
    ("projects", "Projects"),
    ("meetings", "Meetings"),
    ("decisions", "Decisions"),
    ("ideas", "Ideas"),
    ("new-project", "New project"),
    ("new-meeting", "New meeting"),
    ("new-task", "New task"),
    ("write-it-down", "Write it down"),
    ("settings-ai", "Settings → AI"),
    ("settings-vault", "Settings → Pages and backup"),
    ("help", "Help"),
];

/// What these tools need to know about the turn: where the chat may look, and whether the AI is
/// in the cloud (then nothing of a Local AI only project is given to it).
pub struct Reach<'a> {
    pub scope: Option<&'a str>,
    pub cloud: bool,
    pub projects: &'a [Project],
}

impl Reach<'_> {
    /// Whether the page at `path` may be read in this turn.
    fn may_read(&self, path: &str) -> bool {
        if let Some(scope) = self.scope {
            if !paths::is_inside(path, scope) {
                return false;
            }
        }
        !(self.cloud
            && crate::projects::for_path(self.projects, path).is_some_and(|p| p.local_only))
    }
}

/// The schemas of these tools. The `propose_*` ones are offered in the plain chat too.
pub fn definitions() -> Vec<ToolDef> {
    let s = |props: Value, required: &[&str]| json!({"type": "object", "properties": props, "required": required});
    vec![
        ToolDef {
            name: "list_projects",
            description: "List the projects (folders with their own AI rules), each with its plan page and how many of the plan's tasks are done. Use it to find a project's plan or epic.",
            parameters: s(json!({}), &[]),
        },
        ToolDef {
            name: "list_tasks",
            description: "List the tasks, grouped by epic: status (doing, waiting and for what, done), steps done, the day it was made and when its status last changed. Narrow it to one project (its name or folder) or one epic (its path). Done tasks are left out unless include_done is true.",
            parameters: s(
                json!({"project": {"type": "string"}, "epic": {"type": "string"}, "include_done": {"type": "boolean"}}),
                &[],
            ),
        },
        ToolDef {
            name: "list_meetings",
            description: "List the meetings (newest first, at most 20): day, title, project, decisions and open actions. Narrow it to one project (its name or folder).",
            parameters: s(json!({"project": {"type": "string"}}), &[]),
        },
        ToolDef {
            name: "search_help",
            description: "Search the help of Nexmio Work for how something is done in the app (buttons, menus, settings). Answer how-to questions from this, never from guesses.",
            parameters: s(json!({"query": {"type": "string"}}), &["query"]),
        },
        ToolDef {
            name: "show_place",
            description: "Offer the user a button that opens a place in Nexmio Work. Use it after explaining how to do something. place is one of: start, pages, tasks, time, projects, meetings, decisions, ideas, new-project, new-meeting, new-task, write-it-down, settings-ai, settings-vault, help.",
            parameters: s(json!({"place": {"type": "string"}}), &["place"]),
        },
        ToolDef {
            name: "propose_tasks",
            description: "Propose new tasks in an epic (its path, from list_tasks or list_projects). Each task is one short line that starts with a verb. The user reviews them before anything is written.",
            parameters: s(
                json!({"epic": {"type": "string"}, "tasks": {"type": "array", "items": {"type": "string"}}, "reason": {"type": "string"}}),
                &["epic", "tasks"],
            ),
        },
        ToolDef {
            name: "propose_parts",
            description: "Propose new parts in a plan (the plan's page path), under the part with the words `under` (left out: at the top level). Each part is one to six words. The user reviews them before anything is written.",
            parameters: s(
                json!({"plan": {"type": "string"}, "under": {"type": "string"}, "parts": {"type": "array", "items": {"type": "string"}}, "reason": {"type": "string"}}),
                &["plan", "parts"],
            ),
        },
    ]
}

/// Whether a tool is one of these.
pub fn handles(name: &str) -> bool {
    definitions().iter().any(|d| d.name == name)
}

/// The place a `show_place` call names, with its words, when it is a known one.
pub fn place_of(call: &ToolCall) -> Option<(&'static str, &'static str)> {
    if call.name != "show_place" {
        return None;
    }
    let args = parse_args(&call.arguments).ok()?;
    let wanted = arg(&args, "place")?.trim().to_lowercase();
    PLACES.iter().copied().find(|(id, _)| *id == wanted)
}

/// Runs one of these tools. Never writes: a proposal goes into `set` for review.
pub fn execute(
    v: &OpenVault,
    reach: &Reach,
    set: &mut ProposalSet,
    call: &ToolCall,
) -> ToolOutcome {
    let args = match parse_args(&call.arguments) {
        Ok(a) => a,
        Err(e) => {
            return err(
                format!("Invalid arguments for {}", call.name),
                format!("arguments are not valid JSON: {e}"),
            )
        }
    };
    match call.name.as_str() {
        "list_projects" => list_projects(v, reach),
        "list_tasks" => list_tasks(v, reach, &args),
        "list_meetings" => list_meetings(v, reach, &args),
        "search_help" => search_help(arg(&args, "query").unwrap_or("")),
        "show_place" => match place_of(call) {
            Some((_, label)) => ToolOutcome {
                result: format!("The user now has a button that opens {label}."),
                summary: format!("Offered: {label}"),
            },
            None => err(
                "Show a place".into(),
                "unknown place; use one of the names in the tool's description",
            ),
        },
        "propose_tasks" => propose_tasks(v, reach, set, &args),
        "propose_parts" => propose_parts(v, reach, set, &args),
        other => err(format!("Run {other}"), "unknown tool"),
    }
}

/// The project a name or folder means (case does not matter).
fn find_project<'a>(projects: &'a [Project], wanted: &str) -> Option<&'a Project> {
    let w = wanted.trim().to_lowercase();
    projects
        .iter()
        .find(|p| p.name.to_lowercase() == w || p.folder.to_lowercase() == w)
}

/// The plan pages (tag `plan`) that may be read.
fn plans(v: &OpenVault, reach: &Reach) -> Vec<fs_ops::NoteContent> {
    notes_with_front_tag(v, "plan")
        .into_iter()
        .filter(|n| reach.may_read(&n.path))
        .collect()
}

/// The link target of a page path: the path without `.md`.
fn target(path: &str) -> &str {
    path.strip_suffix(".md").unwrap_or(path)
}

/// The epics made for a plan: their `source` names the plan page.
fn epics_of_plan<'a>(epics: &'a [crate::tasks::epics::Epic], plan: &str) -> Vec<&'a str> {
    epics
        .iter()
        .filter(|e| {
            e.source
                .as_deref()
                .is_some_and(|s| s.trim_end_matches(".md") == target(plan))
        })
        .map(|e| e.path.as_str())
        .collect()
}

fn list_projects(v: &OpenVault, reach: &Reach) -> ToolOutcome {
    let plans = plans(v, reach);
    let epics = all_epics(v);
    let tasks = all_tasks(v);
    let mut out = Vec::new();
    for p in reach.projects.iter().filter(|p| reach.may_read(&p.folder)) {
        let own: Vec<_> = plans
            .iter()
            .filter(|n| paths::is_inside(&n.path, &p.folder))
            .collect();
        if own.is_empty() {
            out.push(format!("- {} (folder {}): no plan yet", p.name, p.folder));
        }
        for plan in own {
            let e = epics_of_plan(&epics, &plan.path);
            let mine: Vec<&Task> = tasks
                .iter()
                .filter(|t| e.contains(&t.path.as_str()))
                .collect();
            let done = mine.iter().filter(|t| t.done).count();
            out.push(format!(
                "- {} (folder {}): plan {}, epic {}, {} of {} tasks done",
                p.name,
                p.folder,
                plan.path,
                e.first().copied().unwrap_or("none yet"),
                done,
                mine.len()
            ));
        }
    }
    for plan in plans
        .iter()
        .filter(|n| crate::projects::for_path(reach.projects, &n.path).is_none())
    {
        out.push(format!("- (no project) plan {}", plan.path));
    }
    ToolOutcome {
        result: if out.is_empty() {
            "No projects.".into()
        } else {
            out.join("\n")
        },
        summary: "Read the projects".into(),
    }
}

/// One task as a line for the model.
fn task_line(t: &Task) -> String {
    let mut facts = Vec::new();
    match t.status.as_deref() {
        Some("waiting") => facts.push(format!(
            "waiting for {}",
            t.waiting_for.as_deref().unwrap_or("someone")
        )),
        Some(s) if !s.is_empty() => facts.push(s.to_string()),
        _ => {}
    }
    if !t.steps.is_empty() {
        let done = t.steps.iter().filter(|s| s.done).count();
        facts.push(format!("steps {done} of {}", t.steps.len()));
    }
    if let Some(made) = &t.made {
        facts.push(format!("made {made}"));
    }
    if let Some(last) = t.history.last() {
        facts.push(format!("last change {} ({})", last.date, last.text));
    }
    let tick = if t.done { "x" } else { " " };
    let rest = if facts.is_empty() {
        String::new()
    } else {
        format!(" — {}", facts.join(", "))
    };
    format!("- [{tick}] {}{rest}", t.title)
}

fn list_tasks(v: &OpenVault, reach: &Reach, args: &Value) -> ToolOutcome {
    let include_done = args.get("include_done").and_then(Value::as_bool) == Some(true);
    let epics = all_epics(v);
    let tasks = all_tasks(v);
    let folder = match arg(args, "project").filter(|p| !p.trim().is_empty()) {
        Some(p) => match find_project(reach.projects, p) {
            Some(found) => Some(found.folder.clone()),
            None => return err("Read the tasks".into(), format!("no project called {p}")),
        },
        None => None,
    };
    let epic = arg(args, "epic").filter(|e| !e.trim().is_empty());
    let mut groups: Vec<(String, Vec<&Task>)> = Vec::new();
    for t in tasks.iter().filter(|t| reach.may_read(&t.path)) {
        if !include_done && (t.done || t.status.as_deref() == Some("dropped")) {
            continue;
        }
        if let Some(f) = &folder {
            if !paths::is_inside(&t.path, f) {
                continue;
            }
        }
        if let Some(e) = epic {
            if target(&t.path) != target(e) {
                continue;
            }
        }
        match groups.iter_mut().find(|(p, _)| *p == t.path) {
            Some((_, list)) => list.push(t),
            None => groups.push((t.path.clone(), vec![t])),
        }
    }
    let mut lines = Vec::new();
    for (path, list) in &groups {
        let title = epics
            .iter()
            .find(|e| &e.path == path)
            .map_or(path.as_str(), |e| e.title.as_str());
        lines.push(format!("## {title} ({path})"));
        lines.extend(list.iter().map(|t| task_line(t)));
    }
    lines.truncate(MAX_LINES);
    let what = folder.as_deref().or(epic).unwrap_or("all epics");
    ToolOutcome {
        result: if lines.is_empty() {
            "No tasks.".into()
        } else {
            lines.join("\n")
        },
        summary: format!("Read the tasks of {what}"),
    }
}

/// The `- ` lines of a section `## name` of a page.
fn section_items(content: &str, name: &str) -> Vec<String> {
    let mut inside = false;
    let mut out = Vec::new();
    for line in content.lines() {
        let l = line.trim();
        if let Some(h) = l.strip_prefix("## ") {
            inside = h.trim().eq_ignore_ascii_case(name);
            continue;
        }
        if inside {
            if let Some(item) = l.strip_prefix("- ") {
                if !item.starts_with('[') {
                    out.push(item.trim().to_string());
                }
            }
        }
    }
    out
}

/// A meeting's day from its properties (`meeting: YYYY-MM-DD HH:MM`), or "".
fn meeting_day(content: &str) -> String {
    content
        .lines()
        .take_while(|l| !l.starts_with("# "))
        .find_map(|l| l.strip_prefix("meeting:"))
        .map(|d| d.trim().to_string())
        .unwrap_or_default()
}

fn list_meetings(v: &OpenVault, reach: &Reach, args: &Value) -> ToolOutcome {
    let project = match arg(args, "project").filter(|p| !p.trim().is_empty()) {
        Some(p) => match find_project(reach.projects, p) {
            Some(found) => Some(found),
            None => return err("Read the meetings".into(), format!("no project called {p}")),
        },
        None => None,
    };
    let tasks = all_tasks(v);
    let mut meetings: Vec<_> = notes_with_front_tag(v, "meeting")
        .into_iter()
        .filter(|n| reach.may_read(&n.path))
        .filter(|n| {
            project.is_none_or(|p| {
                let tag = p
                    .tag
                    .clone()
                    .unwrap_or_else(|| crate::projects::tag_for(&p.name));
                crate::markdown::note_tags::front_matter_tags(&n.content).contains(&tag)
                    || paths::is_inside(&n.path, &p.folder)
            })
        })
        .map(|n| (meeting_day(&n.content), n))
        .collect();
    meetings.sort_by(|a, b| b.0.cmp(&a.0));
    let mut lines = Vec::new();
    for (day, n) in meetings.iter().take(20) {
        let title = n
            .content
            .lines()
            .find_map(|l| l.strip_prefix("# "))
            .unwrap_or(n.path.as_str());
        let tags = crate::markdown::note_tags::front_matter_tags(&n.content);
        let in_project = reach
            .projects
            .iter()
            .find(|p| {
                tags.contains(
                    &p.tag
                        .clone()
                        .unwrap_or_else(|| crate::projects::tag_for(&p.name)),
                )
            })
            .map(|p| format!(", project {}", p.name))
            .unwrap_or_default();
        lines.push(format!(
            "## {} — {}{} ({})",
            if day.is_empty() { "no date" } else { day },
            title,
            in_project,
            n.path
        ));
        for d in section_items(&n.content, "decisions") {
            lines.push(format!("- decision: {d}"));
        }
        for t in tasks.iter().filter(|t| t.path == n.path && !t.done) {
            lines.push(format!("- open action: {}", t.title));
        }
    }
    lines.truncate(MAX_LINES);
    ToolOutcome {
        result: if lines.is_empty() {
            "No meetings.".into()
        } else {
            lines.join("\n")
        },
        summary: match project {
            Some(p) => format!("Read the meetings of {}", p.name),
            None => "Read the meetings".into(),
        },
    }
}

/// The sections (`##`) of the help whose words match the query best, at most three.
pub fn search_help(query: &str) -> ToolOutcome {
    let words: Vec<String> = query
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() > 2)
        .map(str::to_string)
        .collect();
    let mut found: Vec<(usize, &str, String)> = Vec::new();
    for (topic, text) in HELP {
        let mut sections = Vec::new();
        let mut current = String::new();
        for line in text.lines() {
            // The pictures of the guide say nothing to the model.
            if line.starts_with("![") {
                continue;
            }
            // The short steps end at the "more" line; after it each heading starts a section.
            let more = line == "<!-- more -->";
            if (more || line.starts_with("## ")) && !current.trim().is_empty() {
                sections.push(std::mem::take(&mut current));
            }
            if more {
                continue;
            }
            current.push_str(line);
            current.push('\n');
        }
        if !current.trim().is_empty() {
            sections.push(current);
        }
        for s in sections {
            let low = s.to_lowercase();
            // A word in the section's heading or in the topic's name counts for more than one
            // somewhere in the text, so "make a plan" finds the plans topic first.
            let heading = low.lines().next().unwrap_or("").to_string();
            let score: usize = words
                .iter()
                .map(|w| {
                    let w = w.as_str();
                    usize::from(low.contains(w))
                        + 2 * usize::from(heading.contains(w))
                        + usize::from(topic.contains(w))
                })
                .sum();
            if score > 0 {
                found.push((score, topic, s));
            }
        }
    }
    found.sort_by_key(|f| std::cmp::Reverse(f.0));
    let best: Vec<String> = found
        .iter()
        .take(3)
        .map(|(_, topic, s)| format!("[help: {topic}]\n{}", s.trim()))
        .collect();
    ToolOutcome {
        result: if best.is_empty() {
            "Nothing in the help matches. Say that you do not know.".into()
        } else {
            best.join("\n\n")
        },
        summary: match found.first() {
            Some((_, topic, _)) => format!("Looked in the help: {topic}"),
            None => "Looked in the help".into(),
        },
    }
}

/// The text items of an array argument, trimmed, empty ones left out.
fn items(args: &Value, key: &str) -> Vec<String> {
    args.get(key)
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(Value::as_str)
                .map(|s| s.trim().replace('\n', " "))
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

/// Reads a page that may be read and is there, for a proposal.
fn page_for(v: &OpenVault, reach: &Reach, path: &str) -> Result<String, String> {
    if !reach.may_read(path) {
        return Err(format!("{path} cannot be changed from this chat"));
    }
    paths::resolve(&v.root, path, reach.scope).map_err(|e| e.to_string())?;
    fs_ops::read_note(&v.root, path)
        .map(|n| n.content)
        .map_err(|_| {
            format!("{path} does not exist; use the path list_tasks or list_projects gives")
        })
}

fn propose_tasks(v: &OpenVault, reach: &Reach, set: &mut ProposalSet, args: &Value) -> ToolOutcome {
    let Some(epic) = arg(args, "epic") else {
        return err("Propose tasks".into(), "missing required argument 'epic'");
    };
    let epic = if epic.ends_with(".md") {
        epic.to_string()
    } else {
        format!("{epic}.md")
    };
    let tasks = items(args, "tasks");
    let summary = format!("Proposed {} tasks in {epic}", tasks.len());
    if tasks.is_empty() {
        return err(summary, "no tasks given");
    }
    let original = match page_for(v, reach, &epic) {
        Ok(c) => c,
        Err(e) => return err(summary, e),
    };
    let mut next = original.trim_end().to_string();
    next.push('\n');
    for t in &tasks {
        next.push_str(&format!("- [ ] {t}\n"));
    }
    queue(
        set,
        ProposalAction::Edit,
        &epic,
        None,
        Some(&next),
        Some(original),
        arg(args, "reason"),
        summary,
    )
}

/// The words of a list line (`- words [[link]]`), without the marker and the links.
fn part_words(line: &str) -> Option<(usize, String)> {
    let indent = line.len() - line.trim_start().len();
    let rest = line.trim_start().strip_prefix("- ")?;
    if rest.starts_with("[ ]") || rest.starts_with("[x]") || rest.starts_with("[X]") {
        return None;
    }
    let mut words = String::new();
    let mut s = rest;
    while let Some(start) = s.find("[[") {
        words.push_str(&s[..start]);
        s = s[start..]
            .find("]]")
            .map_or("", |end| &s[start + end + 2..]);
    }
    words.push_str(s);
    Some((
        indent,
        words.split_whitespace().collect::<Vec<_>>().join(" "),
    ))
}

/// The plan page with new parts: under the part with the words `under` (after its own parts),
/// or after the list at the top level. None when that part is not in the plan.
pub fn with_parts(content: &str, under: Option<&str>, parts: &[String]) -> Option<String> {
    let lines: Vec<&str> = content.lines().collect();
    let (at, indent) = match under.map(str::trim).filter(|u| !u.is_empty()) {
        Some(u) => {
            let want = u.to_lowercase();
            let head = lines
                .iter()
                .position(|l| part_words(l).is_some_and(|(_, w)| w.to_lowercase() == want))?;
            let own = part_words(lines[head]).map_or(0, |(i, _)| i);
            let mut end = head + 1;
            while end < lines.len() {
                let l = lines[end];
                let deeper = l.trim().is_empty() || (l.len() - l.trim_start().len()) > own;
                if !deeper {
                    break;
                }
                end += 1;
            }
            while end > head + 1 && lines[end - 1].trim().is_empty() {
                end -= 1;
            }
            (end, own + 2)
        }
        None => {
            let last = lines.iter().rposition(|l| part_words(l).is_some());
            let at = last.map_or(lines.len(), |i| {
                let mut end = i + 1;
                while end < lines.len() && lines[end].starts_with(' ') {
                    end += 1;
                }
                end
            });
            (at, 0)
        }
    };
    let mut out: Vec<String> = lines.iter().map(|l| (*l).to_string()).collect();
    let new: Vec<String> = parts
        .iter()
        .map(|p| format!("{}- {p}", " ".repeat(indent)))
        .collect();
    out.splice(at..at, new);
    let mut text = out.join("\n");
    if content.ends_with('\n') {
        text.push('\n');
    }
    Some(text)
}

fn propose_parts(v: &OpenVault, reach: &Reach, set: &mut ProposalSet, args: &Value) -> ToolOutcome {
    let Some(plan) = arg(args, "plan") else {
        return err("Propose parts".into(), "missing required argument 'plan'");
    };
    let plan = if plan.ends_with(".md") {
        plan.to_string()
    } else {
        format!("{plan}.md")
    };
    let parts = items(args, "parts");
    let under = arg(args, "under");
    let summary = match under.filter(|u| !u.trim().is_empty()) {
        Some(u) => format!("Proposed {} parts under “{u}” in {plan}", parts.len()),
        None => format!("Proposed {} parts in {plan}", parts.len()),
    };
    if parts.is_empty() {
        return err(summary, "no parts given");
    }
    let original = match page_for(v, reach, &plan) {
        Ok(c) => c,
        Err(e) => return err(summary, e),
    };
    let Some(next) = with_parts(&original, under, &parts) else {
        return err(
            summary,
            "that part is not in the plan; read the plan page for its words",
        );
    };
    queue(
        set,
        ProposalAction::Edit,
        &plan,
        None,
        Some(&next),
        Some(original),
        arg(args, "reason"),
        summary,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::{open_for_test, ops};

    fn call(name: &str, args: Value) -> ToolCall {
        ToolCall {
            id: "1".into(),
            name: name.into(),
            arguments: args.to_string(),
        }
    }

    fn reach(projects: &[Project]) -> Reach<'_> {
        Reach {
            scope: None,
            cloud: false,
            projects,
        }
    }

    #[test]
    fn parts_go_under_their_part_after_its_own_parts_or_at_the_end() {
        let page =
            "# P\n\n- Servers\n  - Disks\n  - Backup\n- Network [[N]]\n  - Wi-Fi\n\nAfter.\n";
        let under = with_parts(page, Some("servers"), &["Racks".into()]).unwrap();
        assert_eq!(
            under,
            "# P\n\n- Servers\n  - Disks\n  - Backup\n  - Racks\n- Network [[N]]\n  - Wi-Fi\n\nAfter.\n"
        );
        let linked = with_parts(page, Some("Network"), &["Switches".into()]).unwrap();
        assert!(linked.contains("  - Wi-Fi\n  - Switches\n"));
        let top = with_parts(page, None, &["Moving day".into()]).unwrap();
        assert!(top.contains("  - Wi-Fi\n- Moving day\n\nAfter."));
        assert!(with_parts(page, Some("Nothing"), &["X".into()]).is_none());
    }

    #[test]
    fn tasks_are_proposed_as_a_change_to_the_epic_and_nothing_is_written() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        ops::write_note(
            &v,
            "Tasks/Move.md",
            "---\ntags: [epic]\n---\n# Move\n\n- [ ] Book the van\n",
        )
        .unwrap();
        let mut set = ProposalSet::new(None);
        let out = execute(
            &v,
            &reach(&[]),
            &mut set,
            &call(
                "propose_tasks",
                json!({"epic": "Tasks/Move", "tasks": ["Label the boxes", " "]}),
            ),
        );
        assert_eq!(out.summary, "Proposed 1 tasks in Tasks/Move.md");
        assert_eq!(set.proposals.len(), 1);
        let p = &set.proposals[0];
        assert!(p
            .content
            .as_deref()
            .unwrap()
            .ends_with("- [ ] Book the van\n- [ ] Label the boxes\n"));
        let on_disk = std::fs::read_to_string(d.path().join("Tasks/Move.md")).unwrap();
        assert!(!on_disk.contains("Label the boxes"));
    }

    #[test]
    fn tasks_are_listed_by_epic_with_what_they_wait_for() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        ops::write_note(
            &v,
            "Tasks/Move.md",
            "---\ntags: [epic]\n---\n# Move\n\n- [ ] Book the van\n- [x] Old one\n",
        )
        .unwrap();
        v.refresh_files();
        let mut set = ProposalSet::new(None);
        let out = execute(&v, &reach(&[]), &mut set, &call("list_tasks", json!({})));
        assert!(
            out.result.contains("## Move (Tasks/Move.md)"),
            "{}",
            out.result
        );
        assert!(out.result.contains("- [ ] Book the van"));
        assert!(!out.result.contains("Old one"));
    }

    #[test]
    fn a_cloud_ai_gets_nothing_from_a_local_only_project() {
        let d = tempfile::tempdir().unwrap();
        let v = open_for_test(d.path());
        ops::write_note(
            &v,
            "Secret/Epic.md",
            "---\ntags: [epic]\n---\n# S\n\n- [ ] Hidden task\n",
        )
        .unwrap();
        v.refresh_files();
        let project: Project = serde_json::from_value(json!({
            "schemaVersion": 1, "id": "p", "name": "Secret", "folder": "Secret", "instructions": "",
            "providerId": null, "localOnly": true, "createdAt": "", "updatedAt": ""
        }))
        .unwrap();
        let projects = [project];
        let cloud = Reach {
            scope: None,
            cloud: true,
            projects: &projects,
        };
        let mut set = ProposalSet::new(None);
        let out = execute(&v, &cloud, &mut set, &call("list_tasks", json!({})));
        assert!(!out.result.contains("Hidden task"));
        let local = execute(
            &v,
            &reach(&projects),
            &mut set,
            &call("list_tasks", json!({})),
        );
        assert!(local.result.contains("Hidden task"));
    }

    #[test]
    fn the_help_answers_how_to_questions_and_places_are_known() {
        let out = search_help("how do I make a plan");
        assert!(out.result.contains("[help: plans]"), "{}", out.result);
        let steps = search_help("status dot quick look");
        assert!(!steps.result.contains("img/"), "{}", steps.result);
        assert!(!steps.result.contains("<!--"), "{}", steps.result);
        assert_eq!(
            place_of(&call("show_place", json!({"place": "New-Meeting"}))),
            Some(("new-meeting", "New meeting"))
        );
        assert_eq!(
            place_of(&call("show_place", json!({"place": "nowhere"}))),
            None
        );
    }
}
