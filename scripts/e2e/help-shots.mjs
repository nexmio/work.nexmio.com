// `pnpm help:shots`: takes the small pictures of the in-app guide (src/features/help/img/), from
// the demo vault in a headless browser. Each picture is a part of the window, so it stays small.
// Run it again when a screen changes, and look at the pictures before you commit them.
import { mkdirSync } from "node:fs";
import { fillDates, launch, loadDemoNotes, rail } from "./harness.mjs";
import { startServer } from "./server.mjs";

const out = new URL("../../src/features/help/img/", import.meta.url).pathname;
const executablePath = process.env.CHROMIUM || undefined;
const SIZE = { width: 1280, height: 800 };
const failed = [];

const PROJECT = {
  schemaVersion: 1,
  id: "move",
  name: "Move the office",
  folder: "Move the office",
  instructions: "The office moves on 1 December. Write short answers.",
  providerId: null,
  localOnly: true,
  tag: "move-the-office",
  createdAt: "",
  updatedAt: "",
};
const notes = () => {
  const all = loadDemoNotes();
  all["Move the office/Plan.md"] = fillDates(
    [
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
      "",
    ].join("\n"),
  );
  all["Links.md"] = "# Links\n\nSee also:\n";
  all["Diagram.md"] =
    "# Diagram\n\n```mermaid\nflowchart LR\n  A[Idea] --> B{Worth it?}\n  B -- yes --> C[Epic]\n  B -- no --> D[Park it]\n```\n";
  return all;
};

/** The box around one or more elements, with a little air, kept inside the window. */
async function around(page, targets, pad = 12) {
  const boxes = [];
  for (const t of targets) {
    await t.waitFor({ timeout: 5000 });
    boxes.push(await t.boundingBox());
  }
  const view = page.viewportSize();
  const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  const right = Math.min(view.width, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
  const bottom = Math.min(view.height, Math.max(...boxes.map((b) => b.y + b.height)) + pad);
  return { x, y, width: right - x, height: bottom - y };
}

/** One picture from a fresh window: `steps` goes there and says which part to take. */
async function shot(name, steps, options = {}) {
  const { browser, page } = await launch({
    ...SIZE,
    executablePath,
    notes: notes(),
    projects: [PROJECT],
    ...options,
  });
  try {
    await page.goto("http://localhost:1420/");
    await page.waitForTimeout(1500);
    const clip = await steps(page);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}${name}.png`, ...(clip ? { clip } : {}) });
    console.log("ok   ", name);
  } catch (e) {
    failed.push(name);
    console.log("FAIL ", name, String(e).split("\n").slice(0, 3).join(" | "));
  } finally {
    await browser.close();
  }
}

const button = (page, name, exact = true) => page.getByRole("button", { name, exact }).first();
const dialog = (page) => page.getByRole("dialog").first();
const openNote = async (page) => {
  await rail(page, "Pages");
  await page.keyboard.press("Control+p");
  await page.keyboard.type("VPN rollout plan");
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");
  await page.locator(".cm-content").first().waitFor({ timeout: 5000 });
};
const openEpic = async (page) => {
  await rail(page, "Tasks");
  await button(page, /^VPN rollout/).click();
};
mkdirSync(out, { recursive: true });
const stop = await startServer();
try {
  const warm = await launch({ executablePath });
  await warm.page.goto("http://localhost:1420/");
  await warm.page.waitForTimeout(8000);
  await warm.browser.close();

  await shot(
    "window",
    async (page) => {
      await rail(page, "Tasks");
    },
    { width: 1600, height: 900 },
  );
  await shot("vaults", async (page) => {
    await page.waitForTimeout(3000);
    await page.keyboard.press("Control+Shift+O");
    return around(page, [page.getByRole("menu", { name: "Switch vault" })]);
  });
  await shot("quick-open", async (page) => {
    await page.keyboard.press("Control+p");
    await page.keyboard.type("VPN");
    return around(page, [dialog(page)]);
  });
  await shot("toolbar", async (page) => {
    await openNote(page);
    return around(page, [page.getByRole("toolbar").first()], 4);
  });
  await shot("new-page", async (page) => {
    await rail(page, "Pages");
    await page.keyboard.press("Control+n");
    return around(page, [dialog(page)]);
  });
  await shot("link", async (page) => {
    await page.keyboard.press("Control+p");
    await page.keyboard.type("Links");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.locator(".cm-content").first().click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" [[");
    const list = page.locator(".cm-tooltip-autocomplete").first();
    await list.waitFor();
    const box = await list.boundingBox();
    return { x: box.x - 110, y: box.y - 90, width: 440, height: Math.min(box.height + 100, 300) };
  });
  await shot("diagram", async (page) => {
    await rail(page, "Pages");
    await page.keyboard.press("Control+p");
    await page.keyboard.type("Diagram");
    await page.keyboard.press("Enter");
    const drawing = page.locator(".cm-content svg").first();
    return around(page, [drawing], 20);
  });
  await shot(
    "new-meeting",
    async (page) => {
      await rail(page, "Meetings");
      await button(page, "New meeting").click();
      return around(page, [dialog(page)]);
    },
    { height: 1000 },
  );
  await shot(
    "tasks-all",
    async (page) => {
      await rail(page, "Tasks");
      const table = page.getByRole("table", { name: "All epics" });
      return around(page, [table]);
    },
    { width: 1600, height: 900 },
  );
  await shot("status", async (page) => {
    await openEpic(page);
    const dot = button(page, /Change the status$/);
    await dot.waitFor();
    const at = await dot.boundingBox();
    await dot.click();
    const menu = await page.getByRole("menu").boundingBox();
    return { x: at.x - 40, y: at.y - 24, width: 420, height: menu.y + menu.height - at.y + 36 };
  });
  await shot("quick-look", async (page) => {
    await openEpic(page);
    await button(page, "Send the offer to Acme").click();
    return around(page, [dialog(page)], 6);
  });
  await shot("project", async (page) => {
    await page.keyboard.press("Control+4");
    await button(page, /Move the office/).click();
    await button(page, "Map").click();
    await page.getByText("IT and network").first().click({ force: true });
    return { x: 190, y: 36, width: 834, height: 430 };
  });
  await shot("ai", async (page) => {
    await openNote(page);
    await button(page, "AI").click();
    return { x: 624, y: 36, width: 400, height: 460 };
  });
  await shot("settings-ai", async (page) => {
    await page.waitForTimeout(3000);
    await page.keyboard.press("Control+,");
    await dialog(page).getByRole("button", { name: /^AI/ }).click();
    return around(page, [dialog(page)], 0);
  });
  await shot(
    "project-settings",
    async (page) => {
      await page.waitForTimeout(4000);
      const gear = button(page, "Settings for Move the office");
      // The Pages panel is open from the start; pressing its icon again would fold it away.
      if (!(await gear.isVisible())) await rail(page, "Pages");
      await gear.click();
      await page.waitForTimeout(1500);
      return around(page, [dialog(page)]);
    },
    { height: 1000 },
  );
} finally {
  await stop();
}
if (failed.length > 0) {
  console.log(`\n${String(failed.length)} failed: ${failed.join(", ")}`);
  process.exit(1);
}
