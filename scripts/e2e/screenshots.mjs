// `pnpm screenshots`: takes the pictures in docs/screenshots/ (README, website and Microsoft Store).
// It starts and stops the frontend itself. Look at the pictures before you commit them.
import { fillDates, launch, loadDemoNotes, rail } from "./harness.mjs";
import { startServer } from "./server.mjs";

const out = new URL("../../docs/screenshots/", import.meta.url).pathname;
const executablePath = process.env.CHROMIUM || undefined;

async function run(theme, steps, options = {}) {
  const { browser, page } = await launch({ theme, executablePath, ...options });
  await page.goto("http://localhost:1420/");
  await page.waitForTimeout(1500);
  const shot = async (name) => {
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}${name}.png` });
  };
  try {
    await steps(page, shot);
  } finally {
    await browser.close();
  }
}

/** A project with its plan (the parts as a list) and the epic made for it, for the project pictures. */
const PROJECT = {
  schemaVersion: 1,
  id: "move",
  name: "Move the office",
  folder: "Move the office",
  instructions: "",
  providerId: null,
  localOnly: false,
  tag: "move-the-office",
  createdAt: "",
  updatedAt: "",
};
const projectNotes = () => {
  const notes = loadDemoNotes();
  notes["Move the office/Plan.md"] = [
    "---",
    "tags: [plan, move-the-office]",
    "---",
    "# Move the office",
    "",
    "- Find a moving company",
    "- IT and network",
    "  - Network",
    "  - Servers",
    "- Tell the customers",
    "  - Letter",
    "  - Website",
    "",
  ].join("\n");
  notes["Move the office/Epics/Move the office.md"] = fillDates(
    [
      "---",
      "tags: [epic, move-the-office]",
      "source: Move the office/Plan",
      "---",
      "# Move the office",
      "",
      "- [x] Get three quotes made:{{days_ago:6}}",
      "- [x] Choose the moving company made:{{days_ago:5}}",
      "- [ ] Order the new network cables made:{{days_ago:3}} status:doing",
      "- [ ] Ask the supplier about the switch made:{{days_ago:2}} status:waiting",
      "- [ ] Write the letter to the customers made:{{days_ago:1}}",
      "",
    ].join("\n"),
  );
  notes["Move the office/Kick-off.md"] = fillDates(
    [
      "---",
      "tags: [meeting, move-the-office]",
      "meeting: {{days_ago:2}} 10:00",
      "parts: [decisions]",
      "---",
      "# Kick-off",
      "",
      "## Decisions",
      "",
      "- We move on 1 December",
      "",
    ].join("\n"),
  );
  return notes;
};
/** The demo vault with a week of work in it, for Look back: finished tasks and time on them. */
const lookBackNotes = () => {
  const notes = loadDemoNotes();
  notes["Projects/Office move.md"] = fillDates(
    [
      "---",
      "tags: [epic]",
      "---",
      "# Office move",
      "",
      "- [x] Book the movers made:{{days_ago:5}}",
      "  - {{days_ago:2}} ⏱ 2 h · 13:00–15:00 · Got three quotes",
      "- [x] Update the address on the website made:{{days_ago:1}}",
      "  - {{days_ago:1}} ⏱ 40 min · 15:00–15:40 · Changed the footer",
      "",
    ].join("\n"),
  );
  notes["Projects/VPN rollout.md"] = fillDates(
    notes["Projects/VPN rollout.md"].replace(
      "  - {{days_ago:3}} Asked three suppliers for a price.",
      "  - {{days_ago:3}} Asked three suppliers for a price.\n  - {{days_ago:1}} ⏱ 1 h 30 min · 09:00–10:30 · Wrote the offer\n  - {{today}} ⏱ 45 min · 08:00–08:45 · Called the suppliers",
    ),
  );
  return notes;
};

const stop = await startServer();
try {
  // A freshly started dev server prepares its files on the first visit and reloads the page
  // while it does: one visit first, so the pictures are not taken in the middle of that.
  const warm = await launch({ executablePath });
  await warm.page.goto("http://localhost:1420/");
  await warm.page.waitForTimeout(8000);
  await warm.browser.close();
  await run("light", async (page, shot) => {
    await rail(page, "Start");
    await shot("start-page");
    await rail(page, "Pages");
    await page
      .getByRole("button", { name: /VPN rollout plan.*Work/ })
      .first()
      .click();
    await shot("note-editor");
    await page.getByRole("button", { name: "More for this page" }).click();
    await page.getByRole("menuitem", { name: "Tags…" }).click();
    await shot("tags");
    await page.keyboard.press("Escape");
    await rail(page, "Tasks");
    // Tasks opens on every epic in rows.
    await page.getByRole("table", { name: "All epics" }).waitFor();
    await shot("tasks-all");
    // Then one epic: the VPN rollout.
    await page
      .getByRole("button", { name: /^VPN rollout/ })
      .first()
      .click();
    await shot("tasks");
    // A timer is started under Tasks > Time; while it runs, its tab is in the right panel.
    await page.getByRole("button", { name: "Time", exact: true }).click();
    await page
      .getByRole("button", { name: /^Start the timer on/ })
      .first()
      .click();
    await page.getByRole("tab", { name: "Timer" }).waitFor();
    await shot("timer");
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    // Still in Tasks (the rail would fold the panel): choose the epic at the left.
    await page
      .getByRole("button", { name: /^VPN rollout/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Send the offer to Acme", exact: true }).first().click();
    // A task in the list opens in the quick look over it.
    await page.getByRole("dialog").waitFor();
    await shot("task-page");
    await page.keyboard.press("Escape");
    await rail(page, "Meetings");
    await page.getByRole("button", { name: /Start meeting/ }).click();
    await shot("meeting");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await rail(page, "Ideas");
    await shot("ideas");
    await page
      .getByRole("button", { name: /Settings/ })
      .first()
      .click();
    await shot("themes");
  });
  await run(
    "light",
    async (page, shot) => {
      await page.keyboard.press("Control+4");
      await page
        .getByRole("button", { name: /Move the office/ })
        .first()
        .click();
      await page.getByRole("button", { name: "Map", exact: true }).click();
      await page.getByText("IT and network").first().click({ force: true });
      await shot("projects");
      await page.getByRole("button", { name: "Overview", exact: true }).click();
      await shot("project-overview");
    },
    { notes: projectNotes(), projects: [PROJECT] },
  );
  await run(
    "light",
    async (page, shot) => {
      await rail(page, "Tasks");
      await page.getByRole("button", { name: "Look back", exact: true }).click();
      await shot("look-back");
    },
    { notes: lookBackNotes() },
  );
  await run("light", async (page, shot) => {
    await rail(page, "Tasks");
    await page.waitForTimeout(1500);
    await page
      .getByRole("button", { name: /^VPN rollout/ })
      .first()
      .click();
    await page.getByRole("button", { name: "AI", exact: true }).click();
    await shot("ai-box");
  });
  await run("midnight", async (page, shot) => {
    await rail(page, "Start");
    await shot("midnight");
  });
} finally {
  stop();
}
