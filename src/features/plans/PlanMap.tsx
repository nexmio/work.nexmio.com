import { LocateFixed, Rows3, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InlineEdit } from "@/components/RowActions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import {
  joinText,
  samePath,
  setText,
  splitText,
  type NodePath,
  type PlanNode,
} from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { usePlanStore } from "@/stores/planStore";
import { useUiStore } from "@/stores/uiStore";
import { NodeChips } from "./NodeChips";
import { infoFor, type InfoContext } from "./nodeInfo";
import { nodeActions } from "./planActions";
import { ChosenPart } from "./ChosenPart";
import { usePartSlot } from "./PartSlot";
import {
  type Arrange,
  BOX_H,
  BOX_W,
  layout,
  lines,
  moveBoxes,
  readChoices,
  writeChoices,
  type MapChoices,
} from "./mapLayout";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
/** The room left round the map when it is put in the middle. */
const PAD_VIEW = 8;
/** How far the pointer must go before a press becomes a move of the box. */
const DRAG_FROM = 5;

/**
 * Follows the pointer over the whole window from a press until it is let go, and tells how far it
 * has gone. It does not depend on the pointer being "captured" by an element.
 */
function follow(
  e: React.PointerEvent<HTMLElement>,
  onMove: (dx: number, dy: number) => void,
  onEnd: () => void,
): void {
  const sx = e.clientX;
  const sy = e.clientY;
  // Nothing else on the page is marked while the pointer is dragged.
  const before = document.body.style.userSelect;
  document.body.style.userSelect = "none";
  const stop = (): void => {
    document.body.style.userSelect = before;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    onEnd();
  };
  const move = (ev: PointerEvent): void => {
    // The button was let go without us hearing about it.
    if (ev.buttons === 0) stop();
    else onMove(ev.clientX - sx, ev.clientY - sy);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}

/**
 * The parts of the open plan as a map. It is the same list as the outline. A box can be moved with
 * the mouse (its parts follow), a box with parts can have them side by side or stacked, and the
 * map zooms. How it is arranged is remembered for each plan on this computer; the list is not changed.
 */
export function PlanMap({ nodes, ctx }: { nodes: readonly PlanNode[]; ctx: InfoContext }) {
  const selected = usePlanStore((s) => s.selected);
  const title = usePlanStore((s) => s.title);
  const plan = usePlanStore((s) => s.path);
  const aiOff = useAiBlocked();
  const slot = usePartSlot();
  const [editing, setEditing] = useState<string | null>(null);
  const [choices, setChoices] = useState<{ plan: string | null; value: MapChoices }>(() => ({
    plan,
    value: readChoices(plan),
  }));
  // Another plan was opened: read what was chosen for it.
  const current = choices.plan === plan ? choices.value : readChoices(plan);
  const scroller = useRef<HTMLDivElement>(null);
  /** Where the map is in its window and how large it is drawn: it is moved by dragging, not scrolled. */
  const [view, setViewState] = useState({ x: 0, y: 0, zoom: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const setView = (v: { x: number; y: number; zoom: number }): void => {
    viewRef.current = v;
    setViewState(v);
  };
  const zoom = view.zoom;
  /** Zooms (the wheel, the buttons) round a point of the window, or its middle: that point stays put. */
  const zoomBy = (factor: number, at?: { x: number; y: number }): void => {
    const el = scroller.current;
    const v = viewRef.current;
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.zoom * factor));
    if (next === v.zoom || !el) return;
    const box = el.getBoundingClientRect();
    const mx = at ? at.x - box.left : box.width / 2;
    const my = at ? at.y - box.top : box.height / 2;
    const k = next / v.zoom;
    setView({ zoom: next, x: mx - (mx - v.x) * k, y: my - (my - v.y) * k });
  };
  const arranged = current.arranged;
  const base = useMemo(() => layout(title, nodes, arranged), [title, nodes, arranged]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const { shown, width, height } = useMemo(
    () => moveBoxes(base.placed, current.moved),
    [base.placed, current.moved],
  );
  sizeRef.current = { width, height };
  const choicesRef = useRef({ plan, value: current });
  choicesRef.current = { plan, value: current };
  const choose = (next: MapChoices): void => {
    setChoices({ plan, value: next });
    writeChoices(plan, next);
  };
  /** Chooses how the parts of a box stand. Places made by hand under it are let go, so the choice shows. */
  const setArrange = (key: string, how: Arrange | null): void => {
    const rest = Object.fromEntries(Object.entries(current.arranged).filter(([k]) => k !== key));
    const below = (k: string): boolean => (key === "" ? k !== "" : k.startsWith(`${key}\u001f`));
    const moved = Object.fromEntries(Object.entries(current.moved).filter(([k]) => !below(k)));
    choose({ arranged: how ? { ...rest, [key]: how } : rest, moved });
  };
  const tidy = (): void => {
    choose({ ...current, moved: {} });
  };
  // The wheel zooms (the map is moved by dragging it). It needs its own listener to stop the scrolling.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.0015), { x: e.clientX, y: e.clientY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
    // `zoomBy` only reads refs and sets state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** Puts the map in the middle of the window, made smaller if it is larger than the window. */
  const center = (): void => {
    const el = scroller.current;
    const w = el?.clientWidth ?? 0;
    const h = el?.clientHeight ?? 0;
    const mapW = Math.max(sizeRef.current.width, 600);
    const mapH = Math.max(sizeRef.current.height, 300);
    // A map larger than the window is made smaller to fit; a small one keeps its own size.
    const fit =
      w > 0 && h > 0 ? Math.min(1, (w - PAD_VIEW * 2) / mapW, (h - PAD_VIEW * 2) / mapH) : 1;
    const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fit));
    setView({ zoom, x: Math.max(PAD_VIEW, (w - mapW * zoom) / 2), y: PAD_VIEW });
  };
  // A plan was opened: start with its map in the middle.
  useLayoutEffect(() => {
    center();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  /** What can be done with a box: the plan itself only takes new parts and AI parts. */
  const actionsFor = (path: NodePath) =>
    nodeActions(path)
      .filter((a) => !["up", "down", "in", "out"].includes(a.id))
      .filter((a) => path.length > 0 || a.id === "sub" || a.id === "parts")
      .map((a) =>
        a.id === "sub"
          ? {
              ...a,
              run: () => {
                usePlanStore.getState().setDialog({ kind: "add", path });
              },
            }
          : a,
      );
  /** How the parts under a box can stand: the choices are offered, and the one in use is ticked. */
  const arrangeFor = (p: { key: string; node: PlanNode }) => {
    if (p.node.children.length === 0) return [];
    const now = arranged[p.key];
    const same = (a: Arrange): boolean => now?.by === a.by && now.n === a.n;
    const pick = (label: string, how: Arrange | null) => ({
      label,
      on: how === null ? now === undefined : same(how),
      run: () => {
        setArrange(p.key, how);
      },
    });
    return [
      pick("Parts side by side", null),
      pick("Parts stacked", { by: "cols", n: 1 }),
      pick("In 2 columns", { by: "cols", n: 2 }),
      pick("In 3 columns", { by: "cols", n: 3 }),
      pick("In 2 rows", { by: "rows", n: 2 }),
      pick("In 3 rows", { by: "rows", n: 3 }),
    ];
  };
  const change = (path: NodePath, node: PlanNode, t: string): void => {
    const links = splitText(node.text).links;
    void usePlanStore.getState().edit((all) => setText(all, path, joinText(t, links)));
  };
  const chosen = selected ? shown.find((p) => samePath(p.path, selected)) : undefined;
  const info = chosen ? infoFor(chosen.node, ctx) : null;
  const chosenArrange = chosen ? arrangeFor(chosen) : [];
  const anyMoved = Object.keys(current.moved).length > 0;

  /** Chooses a box and shows it in the right panel. */
  const choosePart = (path: NodePath): void => {
    usePlanStore.getState().select(path);
    useUiStore.getState().setRightTab("part");
  };

  const onBoxDown = (
    e: React.PointerEvent<HTMLElement>,
    key: string,
    atX: number,
    atY: number,
    path: NodePath,
  ): void => {
    if (e.button !== 0) return;
    choosePart(path);
    const from = choicesRef.current.value.moved[key] ?? [0, 0];
    let own = from;
    let moved = false;
    follow(
      e,
      (dx, dy) => {
        if (!moved && Math.hypot(dx, dy) < DRAG_FROM) return;
        moved = true;
        const k = viewRef.current.zoom;
        // The box may not go off the left or the top of the map.
        own = [
          Math.round(Math.max(from[0] + dx / k, from[0] - atX)),
          Math.round(Math.max(from[1] + dy / k, from[1] - atY)),
        ];
        const cur = choicesRef.current.value;
        setChoices({ plan, value: { ...cur, moved: { ...cur.moved, [key]: own } } });
      },
      () => {
        if (!moved) return;
        const cur = choicesRef.current.value;
        writeChoices(plan, { ...cur, moved: { ...cur.moved, [key]: own } });
      },
    );
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="relative min-w-0 flex-1">
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => {
              zoomBy(1 / 1.2);
            }}
          >
            <ZoomOut />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => {
              zoomBy(1.2);
            }}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Center the map"
            title="Put the whole map in the window"
            onClick={center}
          >
            <LocateFixed />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!anyMoved}
            title="Put the boxes back where the map places them"
            onClick={tidy}
          >
            <Rows3 /> Tidy up
          </Button>
        </div>
        <div
          ref={scroller}
          className="h-full min-w-0 relative cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
          style={{
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          onPointerDown={(e) => {
            // Dragging the empty map moves it.
            if (e.button !== 0) return;
            if (e.target instanceof Element && e.target.closest("[data-box], button")) return;
            const v = viewRef.current;
            follow(
              e,
              (dx, dy) => {
                setView({ ...viewRef.current, x: v.x + dx, y: v.y + dy });
              },
              () => undefined,
            );
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: Math.max(width, 600),
              height: Math.max(height, 300),
              transform: `translate(${String(view.x)}px, ${String(view.y)}px) scale(${String(zoom)})`,
            }}
          >
            <div className="relative h-full w-full">
              {shown.map((p) => (
                <div key={`l${p.path.join(".")}`} aria-hidden>
                  {lines(p, arranged).map((b, i) => (
                    <div key={i} className="absolute bg-input" style={b} />
                  ))}
                </div>
              ))}
              {shown.map((p) => {
                const isSel = samePath(selected, p.path);
                const isRoot = p.path.length === 0;
                const branch = p.node.children.length > 0 || isRoot;
                const k = p.path.join(".");
                const plain = splitText(p.node.text).plain;
                const pos = { left: p.x, top: p.y, width: BOX_W, height: BOX_H };
                if (editing === k && !isRoot) {
                  return (
                    <div
                      key={k}
                      className="absolute flex items-center rounded-lg border-2 border-primary bg-card px-2"
                      style={pos}
                    >
                      <InlineEdit
                        value={plain}
                        label={`Words of ${plain}`}
                        className="text-sm"
                        onSave={(t) => {
                          setEditing(null);
                          change(p.path, p.node, t);
                        }}
                        onCancel={() => {
                          setEditing(null);
                        }}
                      />
                    </div>
                  );
                }
                const boxInfo = infoFor(p.node, ctx);
                const tied =
                  boxInfo.epic !== null || boxInfo.notes.length > 0 || boxInfo.task !== null;
                const arrange = arrangeFor(p);
                return (
                  <ContextMenu key={k}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "absolute flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-card px-3 text-center text-sm",
                          branch && "border-primary font-semibold",
                          isRoot && "bg-primary text-primary-foreground",
                          isSel && "border-2 border-primary bg-accent text-accent-foreground",
                        )}
                        style={pos}
                        data-box
                      >
                        <PlainButton
                          type="button"
                          aria-pressed={isSel}
                          title={
                            isRoot
                              ? plain
                              : `${plain} (drag to move it, double-click to change the words)`
                          }
                          className="absolute inset-0 touch-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={plain || "(empty)"}
                          onPointerDown={(e) => {
                            onBoxDown(e, p.key, p.x, p.y, p.path);
                          }}
                          onClick={() => {
                            choosePart(p.path);
                          }}
                          onContextMenu={() => {
                            choosePart(p.path);
                          }}
                          onDoubleClick={() => {
                            if (!isRoot) setEditing(k);
                          }}
                        />
                        <span className="pointer-events-none max-w-full truncate">
                          {plain || "(empty)"}
                        </span>
                        {tied && !isRoot && (
                          <span className="relative z-10 flex max-w-full flex-wrap justify-center gap-1 overflow-hidden">
                            <NodeChips info={boxInfo} compact />
                          </span>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-60">
                      {arrange.length > 0 && (
                        <>
                          <ContextMenuSub>
                            <ContextMenuSubTrigger>Arrange the parts</ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-52">
                              {arrange.map((o) => (
                                <ContextMenuItem key={o.label} onSelect={o.run}>
                                  <span aria-hidden className="w-4">
                                    {o.on ? "✓" : ""}
                                  </span>
                                  {o.label}
                                </ContextMenuItem>
                              ))}
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                          <ContextMenuSeparator />
                        </>
                      )}
                      {actionsFor(p.path).map((a, i) => (
                        <div key={a.id}>
                          {a.id === "delete" && i > 0 && <ContextMenuSeparator />}
                          <ContextMenuItem
                            disabled={a.needsAi === true && aiOff !== null}
                            onSelect={a.run}
                            className={cn(a.id === "delete" && "text-destructive")}
                          >
                            {a.label}
                          </ContextMenuItem>
                        </div>
                      ))}
                      {!isRoot && (
                        <ContextMenuItem
                          onSelect={() => {
                            setEditing(k);
                          }}
                        >
                          Change the words
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {slot !== null &&
        createPortal(
          chosen && info ? (
            <ChosenPart
              info={info}
              node={chosen.node}
              path={chosen.path}
              arrange={chosenArrange}
              arrangedNow={arranged[chosen.key]}
              onArrange={(how) => {
                setArrange(chosen.key, how);
              }}
              onEdit={() => {
                setEditing(chosen.path.join("."));
              }}
              aiOff={aiOff}
            />
          ) : (
            <p className="p-4 text-sm leading-relaxed text-muted-foreground">
              Choose a box to see what you can do with it, or right-click it. Drag a box to move it
              (its parts follow), drag the empty map to move around, and use the mouse wheel to
              zoom. The map and the outline are the same list: change it in one, and it changes in
              the other.
            </p>
          ),
          slot,
        )}
    </div>
  );
}
