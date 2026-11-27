import { lazy, Suspense, useRef } from "react";
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
import { NotesPage } from "@/features/start/NotesPage";
import { StartPage } from "@/features/start/StartPage";
import { EpicPage } from "@/features/tasks/EpicPage";
import { TaskPage } from "@/features/tasks/TaskPage";
import { TasksPanel } from "@/features/tasks/TasksPanel";
import { PartSlot } from "@/features/plans/PartSlot";
import { TaskDetail } from "@/features/tasks/TaskDetail";
import { TimerPanel } from "@/features/tasks/TimerPanel";
import { useTimerStore } from "@/stores/timerStore";
import { TasksView } from "@/features/tasks/TasksView";
import { cn } from "@/lib/utils";
import { FilesPanel } from "@/features/fileTree/FilesPanel";
import { HistoryPanel } from "@/features/history/HistoryPanel";
import { ImagesPanel } from "@/features/images/ImagesPanel";
import { SearchPanel } from "@/features/search/SearchPanel";
import { panelStorage } from "@/lib/safeStorage";

import { type CenterView, type RightTab, useUiStore } from "@/stores/uiStore";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { usePanelCollapse } from "./usePanelCollapse";
import { ActivityRail } from "./ActivityRail";
import { FieldAi } from "@/features/fieldAi/FieldAi";
import { AiBox } from "@/features/chat/AiBox";
import { RIGHT_LABELS, RightTabs } from "./RightTabs";
import { LinksPanel } from "@/features/notePanels/LinksPanel";
import { OutlinePanel } from "@/features/notePanels/OutlinePanel";
import { activeTitle, useVaultStore } from "@/stores/vaultStore";

/**
 * The tabs of the right panel, in order: the page panels where a page is shown, "Task" in the
 * Tasks area and "Part" in the Plans area, and the Timer while one runs. The AI is not a tab: it
 * is a box over the right side (`AiBox`). An area with none of these has an empty panel.
 */
export function rightTabsFor(view: CenterView, timerRunning = false): RightTab[] {
  // The Timer tab is there only while a timer runs (it is started under Tasks → Time).
  const always: RightTab[] = timerRunning ? ["timer"] : [];
  // Outline, Links, History and Images are about the page in the middle: only where one is open.
  // Elsewhere they would show the last page, which is not on the screen (and its tags).
  if (view === "notes" || view === "start") {
    return ["outline", "links", "history", "images", ...always];
  }
  // The Task tab is the quick view of a task on the epic page. The task list has its own quick
  // look over the list, and a task opened as a full page is only there.
  if (view === "epic") return ["task", ...always];
  if (view === "plans") return ["part", ...always];
  return always;
}

/** Title bar, three resizable/collapsible columns and the status bar. */
const PlansView = lazy(() =>
  import("@/features/plans/PlansView").then((m) => ({ default: m.PlansView })),
);
const TimeView = lazy(() =>
  import("@/features/tasks/TimePage").then((m) => ({ default: m.TimePage })),
);
const LookBackPage = lazy(() =>
  import("@/features/tasks/LookBackPage").then((m) => ({ default: m.LookBackPage })),
);
export function AppShell() {
  const ui = useUiStore();
  const timerRunning = useTimerStore((s) => s.running !== null);
  const tabs = rightTabsFor(ui.centerView, timerRunning);
  // A tab that does not belong to the area in the middle falls back to the first one; with no
  // tab at all, no panel is shown (not the last page's outline).
  const rightTab: RightTab | null = tabs.includes(ui.rightTab) ? ui.rightTab : (tabs[0] ?? null);
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
  // The task list has nothing for the right panel until a timer runs: then it is not there at
  // all, and the list has the room.
  const hasRight = !(ui.centerView === "tasks" && tabs.length === 0);
  usePanelCollapse(right, ui.rightCollapsed || startOnly, hasRight);

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="relative flex min-h-0 flex-1">
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
              {ui.centerView === "time" && (
                <Suspense fallback={null}>
                  <TimeView />
                </Suspense>
              )}
              {ui.centerView === "lookback" && (
                <Suspense fallback={null}>
                  <LookBackPage />
                </Suspense>
              )}
              {ui.centerView === "ideas" && <IdeasView />}
              {ui.centerView === "meetings" && <MeetingsView />}
              {ui.centerView === "plans" && (
                <Suspense fallback={null}>
                  <PlansView />
                </Suspense>
              )}
              {showStart && <StartPage />}
              {showNoteList && <NotesPage />}
            </main>
          </Panel>
          {hasRight && (
            <>
              <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-primary data-[resize-handle-active]:bg-primary" />
              <Panel
                ref={right}
                id="right"
                order={3}
                defaultSize={26}
                minSize={16}
                maxSize={50}
                collapsible
                collapsedSize={0}
                onCollapse={() => {
                  if (
                    useUiStore.getState().centerView !== "start" &&
                    !useUiStore.getState().rightCollapsed
                  )
                    useUiStore.setState({ rightCollapsed: true });
                }}
                onExpand={() => {
                  if (
                    useUiStore.getState().centerView !== "start" &&
                    useUiStore.getState().rightCollapsed
                  )
                    useUiStore.setState({ rightCollapsed: false });
                }}
                className="bg-sidebar"
              >
                <div className="flex h-full min-h-0 flex-col">
                  {rightTab !== null && <RightTabs tabs={tabs} current={rightTab} />}
                  {/* The name of the page, over the tabs that are about it (never over Task or Part). */}
                  {(rightTab === "outline" || rightTab === "links" || rightTab === "history") &&
                    activePath !== null && (
                      <p className="truncate border-b px-3 py-1 text-xs text-muted-foreground">
                        {RIGHT_LABELS[rightTab]} · {activeTitle(activePath)}
                      </p>
                    )}
                  <div className="min-h-0 flex-1">
                    {rightTab === "task" && <TaskDetail />}
                    {rightTab === "timer" && <TimerPanel />}
                    {rightTab === "part" && <PartSlot />}
                    {rightTab === "outline" && <OutlinePanel />}
                    {rightTab === "links" && <LinksPanel />}
                    {rightTab === "images" && <ImagesPanel />}
                    {rightTab === "history" && <HistoryPanel />}
                    {tabs.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        Nothing here for this area. The AI opens with AI in the top bar.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
        <AiBox />
      </div>
      <FieldAi />
      <StatusBar />
    </div>
  );
}
