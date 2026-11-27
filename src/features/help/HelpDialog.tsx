import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { helpImage } from "./helpImages";
import { findTopic, searchTopics, topicParts, type HelpTopic } from "./helpTopics";
import { PlainButton } from "@/components/ui/plain-button";

const MARKDOWN: Components = {
  img: ({ src, alt }) => (
    <img
      src={typeof src === "string" ? helpImage(src) : undefined}
      alt={alt ?? ""}
      className="my-3 h-auto max-w-full rounded-lg border shadow-sm"
    />
  ),
};

function Text({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN}>
      {text}
    </ReactMarkdown>
  );
}

/** A topic: the short steps, and the details behind "More details" (open while searching). */
function Topic({ topic, searching }: { topic: HelpTopic; searching: boolean }) {
  const [open, setOpen] = useState(false);
  const { steps, more } = topicParts(topic);
  const shown = open || searching;
  return (
    <>
      <h1 className="mb-3 text-xl font-semibold">{topic.title}</h1>
      <Text text={steps} />
      {more !== "" && (
        <>
          <PlainButton
            type="button"
            aria-expanded={shown}
            className="mt-4 flex w-full items-center gap-1.5 rounded-md border px-3 py-2 text-left font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setOpen(!shown);
            }}
          >
            {shown ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
            More details
          </PlainButton>
          {shown && (
            <div className="pt-2">
              <Text text={more} />
            </div>
          )}
        </>
      )}
    </>
  );
}

/** The how-to guide: the topics in groups on the left and the chosen one on the right. */
export function HelpDialog() {
  const open = useUiStore((s) => s.helpOpen);
  const topicId = useUiStore((s) => s.helpTopic);
  const setHelpOpen = useUiStore((s) => s.setHelpOpen);
  const openHelp = useUiStore((s) => s.openHelp);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const topics = useMemo(() => searchTopics(query), [query]);
  const topic = findTopic(topicId);

  return (
    <Dialog open={open} onOpenChange={setHelpOpen}>
      <DialogContent className="h-[80vh] max-w-4xl overflow-hidden p-0">
        <DialogTitle className="sr-only">How to use Nexmio Work</DialogTitle>
        <DialogDescription className="sr-only">
          A guide to the features of Nexmio Work. Choose a topic on the left.
        </DialogDescription>
        <div className="flex h-full min-h-0">
          <nav aria-label="Topics" className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
            <div className="p-3 pb-2 text-sm font-semibold">How to use Nexmio Work</div>
            <div className="px-2 pb-2">
              <Input
                data-no-ai
                aria-label="Search the guide"
                placeholder="Search the guide…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-auto px-1 pb-2">
              {topics.map((t, i) => (
                <Fragment key={t.id}>
                  {t.group !== topics[i - 1]?.group && (
                    <li className="section-label px-2 pb-1 pt-3 first:pt-1">{t.group}</li>
                  )}
                  <li>
                    <PlainButton
                      type="button"
                      aria-current={t.id === topic.id}
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left hover:bg-muted",
                        t.id === topic.id && "bg-accent",
                      )}
                      onClick={() => {
                        openHelp(t.id);
                      }}
                    >
                      <div className="text-[13px] font-medium">{t.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.summary}</div>
                    </PlainButton>
                  </li>
                </Fragment>
              ))}
              {topics.length === 0 && (
                <li className="p-2 text-xs text-muted-foreground">Nothing in the guide matches.</li>
              )}
            </ul>
          </nav>
          <article
            key={topic.id}
            aria-label={topic.title}
            className="chat-markdown help-markdown min-w-0 flex-1 overflow-auto p-6 text-[14px] leading-relaxed"
          >
            <Topic key={topic.id} topic={topic} searching={query.trim() !== ""} />
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
