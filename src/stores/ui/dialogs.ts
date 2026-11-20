import type { StateCreator } from "zustand";
import type { MeetingSeed } from "@/lib/meeting";
import type { ImagePreview, ProjectDialogState } from "./types";
import type { UiState } from "./state";

/** Which windows are open, and what they start with. */
export interface DialogsSlice {
  /** The folder a new note is being named for, or null when the dialog is closed. */
  newNoteDialog: { folder: string } | null;
  openNewNoteDialog: (folder: string | null) => void;
  imagePreview: ImagePreview | null;
  /** Shows a picture large, or closes the view with `null`. */
  openImagePreview: (preview: ImagePreview | null) => void;
  /** The window for writing one thing down: that kind's box, or "choose" first (Ctrl+Shift+N). */
  captureKind: "task" | "idea" | "choose" | null;
  openCapture: (kind?: "task" | "idea") => void;
  closeCapture: () => void;
  /** The "In short" window (main points and things to do of the open note) is open. */
  inShortOpen: boolean;
  setInShortOpen: (open: boolean) => void;
  findTasksOpen: boolean;
  /** Look for tasks in this text instead of the whole open note (a selection). */
  findTasksIn: string | null;
  /** What the task finder reads and does: look for tasks in a note, or suggest missing steps. */
  findTasksOpts: { path: string | null; mode: "tasks" | "steps" };
  setFindTasksOpen: (
    open: boolean,
    text?: string,
    opts?: { path: string; mode: "tasks" | "steps" },
  ) => void;
  /** The window that prepares a meeting (title, when, who, agenda). */
  meetingFormOpen: boolean;
  setMeetingFormOpen: (open: boolean) => void;
  /** What the meeting window starts with (the next meeting), or null for an empty one. */
  meetingSeed: MeetingSeed | null;
  /**
   * An idea that is to become a part of a plan (Ideas → To plan…): the Projects area asks where.
   * `done` is called once it is in the plan, so Ideas can mark it used.
   */
  ideaToPlan: { text: string; note: string; done: () => void } | null;
  setIdeaToPlan: (v: { text: string; note: string; done: () => void } | null) => void;
  openMeetingFormWith: (seed: MeetingSeed) => void;
  /** The note of the meeting that is running (the meeting screen is open), or null. */
  meetingFocus: string | null;
  setMeetingFocus: (path: string | null) => void;
  quickOpen: boolean;
  commandPalette: boolean;
  settingsOpen: boolean;
  /** The Settings tab to show when the dialog opens (`null` = the first). */
  settingsTab: string | null;
  /** Opens Settings on the Built-in AI tab. */
  openBuiltInSettings: () => void;
  /** Opens Settings on the Vault tab. */
  openVaultSettings: () => void;
  recoverOpen: boolean;
  /** The window that lists your tags and deletes one. */
  tagsOpen: boolean;
  vaultSwitcherOpen: boolean;
  setVaultSwitcherOpen: (open: boolean) => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
  /** "What's new in Nexmio Work" is open. */
  whatsNewOpen: boolean;
  setWhatsNewOpen: (open: boolean) => void;
  aboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;
  /** The first-start notice (first version, AI is beta) is shown. */
  betaNoticeOpen: boolean;
  setBetaNoticeOpen: (open: boolean) => void;
  helpOpen: boolean;
  /** The topic of the how-to guide that is shown. */
  helpTopic: string;
  setHelpOpen: (open: boolean) => void;
  /** Opens the how-to guide, at `topic` when given. */
  openHelp: (topic?: string) => void;
  exportDialog: { path: string; isFolder: boolean } | null;
  openExportDialog: (target: { path: string; isFolder: boolean } | null) => void;
  projectDialog: ProjectDialogState | null;
  setQuickOpen: (open: boolean) => void;
  setCommandPalette: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setRecoverOpen: (open: boolean) => void;
  setTagsOpen: (open: boolean) => void;
  openProjectDialog: (state: ProjectDialogState | null) => void;
}

export const dialogsSlice: StateCreator<UiState, [], [], DialogsSlice> = (set) => ({
  newNoteDialog: null,
  openNewNoteDialog: (folder) => {
    set({ newNoteDialog: folder === null ? null : { folder } });
  },
  captureKind: null,
  openCapture: (kind) => {
    set({ captureKind: kind ?? "choose" });
  },
  closeCapture: () => {
    set({ captureKind: null });
  },
  inShortOpen: false,
  setInShortOpen: (inShortOpen) => {
    set({ inShortOpen });
  },
  findTasksOpen: false,
  findTasksIn: null,
  findTasksOpts: { path: null, mode: "tasks" },
  setFindTasksOpen: (findTasksOpen, text, opts) => {
    set({
      findTasksOpen,
      findTasksIn: findTasksOpen ? (text ?? null) : null,
      findTasksOpts: findTasksOpen && opts ? opts : { path: null, mode: "tasks" },
    });
  },
  meetingFormOpen: false,
  setMeetingFormOpen: (meetingFormOpen) => {
    set(meetingFormOpen ? { meetingFormOpen } : { meetingFormOpen, meetingSeed: null });
  },
  meetingSeed: null,
  ideaToPlan: null,
  setIdeaToPlan: (ideaToPlan) => {
    set({ ideaToPlan });
  },
  openMeetingFormWith: (meetingSeed) => {
    set({ meetingSeed, meetingFormOpen: true });
  },
  meetingFocus: null,
  setMeetingFocus: (meetingFocus) => {
    set({ meetingFocus });
  },
  quickOpen: false,
  commandPalette: false,
  settingsOpen: false,
  settingsTab: null,
  openBuiltInSettings: () => {
    set({ settingsOpen: true, settingsTab: "builtin" });
  },
  openVaultSettings: () => {
    set({ settingsOpen: true, settingsTab: "vault" });
  },
  recoverOpen: false,
  tagsOpen: false,
  vaultSwitcherOpen: false,
  setVaultSwitcherOpen: (vaultSwitcherOpen) => {
    set({ vaultSwitcherOpen });
  },
  imagePreview: null,
  openImagePreview: (imagePreview) => {
    set({ imagePreview });
  },
  importOpen: false,
  setImportOpen: (importOpen) => {
    set({ importOpen });
  },
  whatsNewOpen: false,
  setWhatsNewOpen: (whatsNewOpen) => {
    set({ whatsNewOpen });
  },
  aboutOpen: false,
  setAboutOpen: (aboutOpen) => {
    set({ aboutOpen });
  },
  betaNoticeOpen: false,
  setBetaNoticeOpen: (betaNoticeOpen) => {
    set({ betaNoticeOpen });
  },
  helpOpen: false,
  helpTopic: "start",
  setHelpOpen: (helpOpen) => {
    set({ helpOpen });
  },
  openHelp: (topic) => {
    set((s) => ({ helpOpen: true, helpTopic: topic ?? s.helpTopic }));
  },
  exportDialog: null,
  openExportDialog: (exportDialog) => {
    set({ exportDialog });
  },
  projectDialog: null,
  setQuickOpen: (quickOpen) => {
    set({ quickOpen });
  },
  setCommandPalette: (commandPalette) => {
    set({ commandPalette });
  },
  setSettingsOpen: (settingsOpen) => {
    set({ settingsOpen, settingsTab: null });
  },
  setTagsOpen: (tagsOpen) => {
    set({ tagsOpen });
  },
  setRecoverOpen: (recoverOpen) => {
    set({ recoverOpen });
  },
  openProjectDialog: (projectDialog) => {
    set({ projectDialog });
  },
});
