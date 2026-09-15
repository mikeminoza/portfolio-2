import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: number;
  from: "visitor" | "site";
  text: string;
  suggestions?: string[];
};

/** Display form of a URL: scheme dropped, percent-escapes decoded. */
function prettyUrl(url: string) {
  const bare = url.replace(/^https?:\/\//, "");
  try {
    return decodeURI(bare);
  } catch {
    // Malformed escapes make decodeURI throw; the raw form still reads fine.
    return bare;
  }
}

/** Turn bare URLs in an answer into real links. */
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="break-all text-accent underline underline-offset-2"
      >
        {prettyUrl(part)}
      </a>
    ) : (
      part
    ),
  );
}

export function ChatBubble({
  message,
  onAsk,
}: {
  message: ChatMessage;
  onAsk: (question: string) => void;
}) {
  const fromVisitor = message.from === "visitor";

  return (
    <div className={cn("flex flex-col gap-2", fromVisitor && "items-end")}>
      <div
        className={cn(
          "max-w-[85%] border px-3 py-2 text-sm leading-relaxed",
          fromVisitor
            ? "border-accent/40 bg-surface text-foreground"
            : "border-border text-muted",
        )}
      >
        {message.text.split("\n\n").map((paragraph, i) => (
          // Single newlines are meaningful here (one social link per line),
          // so they render as breaks rather than collapsing to spaces.
          <p key={i} className={cn("whitespace-pre-line", i > 0 && "mt-2")}>
            {linkify(paragraph)}
          </p>
        ))}
      </div>

      {message.suggestions && message.suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {message.suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button type="button" onClick={() => onAsk(suggestion)}>
                <Tag size="sm" interactive>
                  {suggestion}
                </Tag>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
