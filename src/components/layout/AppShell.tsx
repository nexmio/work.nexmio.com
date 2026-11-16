import { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { EditorArea } from "@/features/workspace/EditorArea";
import { IdeasPanel } from "@/features/capture/IdeasPanel";
import { IdeasView } from "@/features/capture/IdeasView";
import { MeetingsPanel } from "@/features/meetings/MeetingsPanel";
import { MeetingsView } from "@/features/meetings/MeetingsView";
import { PlansPanel } from "@/features/plans/PlansPanel";
import { PlansView } from "@/features/plans/PlansView";
import { NotesPage } from "@/features/start/NotesPage";
import { StartPage } from "@/features/start/StartPage";
import { EpicPage } from "@/features/tasks/EpicPage";
import { TaskPage } from "@/features/tasks/TaskPage";
import { TasksPanel } from "@/features/tasks/TasksPanel";
import { PartSlot } from "@/features/plans/PartSlot";
import { TaskDetail } from "@/features/tasks/TaskDetail";
import { TasksView } from "@/features/tasks/TasksView";
import { cn } from "@/lib/utils";
import { FilesPanel } from "@/features/fileTree/FilesPanel";
import { HistoryPanel } from "@/features/history/HistoryPanel";
import { ImagesPanel } from "@/features/images/ImagesPanel";
import { SearchPanel } from "@/features/search/SearchPanel";
import { panelStorage } from "@/lib/safeStorage";

import { type CenterView, isTasksView, type RightTab, useUiStore } from "@/stores/uiStore";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { usePanelCollapse } from "./usePanelCollapse";
import { ActivityRail } from "./ActivityRail";
import { FieldAi } from "@/features/fieldAi/FieldAi";
import { ChatPanel } from "@/features/chat/ChatPanel";
import { RIGHT_LABELS, RightTabs } from "./RightTabs";
import { LinksPanel } from "@/features/notePanels/LinksPanel";
import { OutlinePanel } from "@/features/notePanels/OutlinePanel";
import { activeTitle, useVaultStore } from "@/stores/vaultStore";

/**
 * The tabs of the right panel, in order. The panel always has the note panels and the AI; the
 * Tasks area adds "Task" in front, and the Plans area "Part".
 */
export function rightTabsFor(view: CenterView): RightTab[] {
  const base: RightTab[] = ["outline", "links", "history", "images", "ai"];
  if (isTasksView(view)) return ["task", ...base];
  if (view === "plans") return ["part", ...base];
  return base;
}

/** Title bar, three resizable/collapsible columns and the status bar. */
export function AppShell() {
  const ui = useUiStore();
  const tabs = rightTabsFor(ui.centerView);
  // A tab that does not belong to the area in the middle falls back to the first one.
  const rightTab: RightTab = tabs.includes(ui.rightTab) ? ui.rightTab : (tabs[0] ?? "outline");
  const activePath = useVaultStore((s) => s.activePath);
  const left = useRef<ImperativePanelHandle>(null);
  const right = useRef<ImperativePanelHandle>(null);

  // With no note open the middle shows the start page instead of an empty editor.
  const showStart = ui.centerView === "start";
  // With no note open the notes show a list of notes instead of an empty editor.
  const showNoteList = ui.centerView === "notes" && activePath === null;
  const showNotes = ui.centerView === "notes" && !showNoteList;

  // The house opens the start page on its own: both side panels go while it is shown (and come
  // back as they were). With no note open they stay.
  const startOnly = ui.centerView === "start";
  usePanelCollapse(left, ui.leftCollapsed || startOnly);
  usePanelCollapse(right, ui.rightCollapsed || startOnly);

  // The chat stays mounted once it has been shown, so a half-written question survives a change
  // of tab. Before that nothing of it is loaded.
  const [chatSeen, setChatSeen] = useState(false);
  const aiShown = rightTab === "ai" && !ui.rightCollapsed && !startOnly;
  useEffect(() => {
    if (aiShown) setChatSeen(true);
  }, [aiShown]);

  // The chat needs room: the panel is made about 24rem wide when the AI tab is chosen.
  useEffect(() => {
    if (!aiShown) return;
    try {
      const panel = right.current;
      if (!panel) return;
      const wanted = Math.min(50, (384 / Math.max(window.innerWidth - 44, 1)) * 100);
      if (panel.getSize() < wanted) panel.resize(wanted);
    } catch {
      /* layout not ready; the panel keeps its width */
    }
  }, [aiShown]);

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <ActivityRail />
        <PanelGroup
          direction="horizontal"
          autoSaveId="nexmio-layout"
          storage={panelStorage}
          className="min-h-0 flex-1"
        >
          <Panel
            ref={left}
            id="left"
            order={1}
            defaultSize={20}
            minSize={12}
            maxSize={40}
            collapsible
            collapsedSize={0}
            onCollapse={() => {
              if (
                useUiStore.getState().centerView !== "start" &&
                !useUiStore.getState().leftCollapsed
              )
                useUiStore.setState({ leftCollapsed: true });
            }}
            onExpand={() => {
              if (
                useUiStore.getState().centerView !== "start" &&
                useUiStore.getState().leftCollapsed
              )
                useUiStore.setState({ leftCollapsed: false });
            }}
            className="bg-sidebar"
          >
            <div className="flex h-full min-h-0 flex-col">
              {ui.leftTab === "files" && <FilesPanel />}
              {ui.leftTab === "search" && (
                <div className="min-h-0 flex-1">
                  <SearchPanel />
                </div>
              )}
              {ui.leftTab === "tasks" && <TasksPanel />}
              {ui.leftTab === "ideas" && <IdeasPanel />}
              {ui.leftTab === "meetings" && <MeetingsPanel />}
              {ui.leftTab === "plans" && <PlansPanel />}
            </div>
          </Panel>
          <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-primary data-[resize-handle-active]:bg-primary" />
          <Panel id="center" order={2} minSize={30}>
            <main className="h-full min-h-0">
              {/* The notes stay mounted while the tasks are shown, so nothing typed is lost. */}
              <div className={cn("h-full min-h-0", !showNotes && "hidden")}>
                <EditorArea />
              </div>
              {ui.centerView === "tasks" && <TasksView />}
              {ui.centerView === "epic" && <EpicPage />}
              {ui.centerView === "task" && <TaskPage />}
              {ui.centerView === "ideas" && <IdeasView />}
              {ui.centerView === "meetings" && <MeetingsView />}
              {ui.centerView === "plans" && <PlansView />}
              {showStart && <StartPage />}
              {showNoteList && <NotesPage />}
            </main>
          </Panel>
          <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-primary data-[resize-handle-active]:bg-primary" />
          <Panel
            ref={right}
            id="right"
            order={3}
            defaultSize={24}
            minSize={16}
            maxSize={50}
            collapsible
            collapsedSize={0}
            onCollapse={() => {
              if (
                useUiStore.getState().centerView !== "start" &&
                !useUiStore.getState().rightCollapsed
              )
                useUiStore.setState({ rightCollapsed: true, askOpen: false });
            }}
            onExpand={() => {
              if (
                useUiStore.getState().centerView !== "start" &&
                useUiStore.getState().rightCollapsed
              )
                useUiStore.setState((st) => ({
                  rightCollapsed: false,
                  askOpen: st.rightTab === "ai",
                }));
            }}
            className="bg-sidebar"
          >
            <div className="flex h-full min-h-0 flex-col">
              <RightTabs tabs={tabs} current={rightTab} />
              {rightTab !== "ai" && rightTab !== "images" && activePath !== null && (
                <p className="truncate border-b px-3 py-1 text-xs text-muted-foreground">
                  {RIGHT_LABELS[rightTab]} · {activeTitle(activePath)}
                </p>
              )}
              <div className="min-h-0 flex-1">
                {rightTab === "task" && <TaskDetail />}
                {rightTab === "part" && <PartSlot />}
                {rightTab === "outline" && <OutlinePanel />}
                {rightTab === "links" && <LinksPanel />}
                {rightTab === "images" && <ImagesPanel />}
                {rightTab === "history" && <HistoryPanel />}
                {chatSeen && (
                  <div className={cn("h-full min-h-0", rightTab !== "ai" && "hidden")}>
                    <ChatPanel />
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
      <FieldAi />
      <StatusBar />
    </div>
  );
}
