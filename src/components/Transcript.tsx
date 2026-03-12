import { useEffect, useRef, useState } from "react";
import type { AppStatus } from "../App";
import { Mascot } from "./Mascot";

export interface Message {
  key: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
}

const RECENT_COUNT = 2;

/** Strip balanced JSON objects/arrays that some models emit inline as tool data. */
function stripInlineJson(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "{" || text[i] === "[") {
      const open = text[i];
      const close = open === "{" ? "}" : "]";
      let depth = 1;
      let j = i + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === open) depth++;
        else if (text[j] === close) depth--;
        j++;
      }
      // Only strip if it looks like JSON (contains a quoted key or is an array)
      const block = text.slice(i, j);
      if (depth === 0 && (/"[^"]*"\s*:/.test(block) || open === "[")) {
        i = j;
        continue;
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

function cleanDisplayText(text: string): string {
  return stripInlineJson(text)
    .replace(/<emotion\s+value="[^"]*"\s*\/>/g, "")
    .replace(/\[laughter\]/g, "")
    .trim();
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
    </div>
  );
}

export function Transcript({
  messages,
  status,
  hiddenMessageKey,
  started,
  onStart,
}: {
  messages: Message[];
  status: AppStatus;
  hiddenMessageKey?: string | null;
  started?: boolean;
  onStart?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Collapse back to recent-only whenever new messages arrive
  const msgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length !== msgCountRef.current) {
      msgCountRef.current = messages.length;
      setExpanded(false);
    }
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, hiddenMessageKey]);

  const visibleMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter(
      (m, i) => !(i === 0 && m.role === "user" && m.text.trim() === "Hi!"),
    )
    .filter((m) => m.key !== hiddenMessageKey);

  if (!started) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <button
          onClick={onStart}
          className="group flex flex-col items-center gap-4 transition-transform hover:scale-105 focus:outline-none"
          aria-label="Tap to start conversation"
        >
          <Mascot status={status} size="lg" className="cursor-pointer" />
          <p className="text-center text-sm text-gray-400 transition-colors group-hover:text-gray-600">
            Tap to start the conversation
          </p>
        </button>
      </div>
    );
  }

  if (visibleMessages.length === 0) {
    return (
      <div className="flex flex-1 items-start justify-start p-4">
        <div className="flex items-end gap-2">
          <Mascot status="processing" size="md" />
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  const hasOlder = visibleMessages.length > RECENT_COUNT;
  const displayMessages = expanded
    ? visibleMessages
    : visibleMessages.slice(-RECENT_COUNT);

  // Recompute lastAssistantIndex relative to displayMessages
  let lastAssistantIndex = -1;
  for (let i = displayMessages.length - 1; i >= 0; i--) {
    if (displayMessages[i].role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  const handleExpand = () => {
    setExpanded(true);
    // Scroll to top after expanding so user sees the older messages
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto p-4">
      {/* Expand-history button */}
      {hasOlder && !expanded && (
        <div className="sticky top-0 z-10 flex justify-center pb-2">
          <button
            onClick={handleExpand}
            className="flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-xs text-gray-400 shadow-sm backdrop-blur transition-opacity hover:text-gray-600 hover:opacity-100"
            style={{ opacity: 0.4 }}
            aria-label="Show earlier messages"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                clipRule="evenodd"
              />
            </svg>
            {visibleMessages.length - RECENT_COUNT} earlier
          </button>
        </div>
      )}

      <div className="space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={message.key}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="mr-2 mt-1 shrink-0">
                <Mascot
                  status={index === lastAssistantIndex ? status : "idle"}
                  size="md"
                />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                message.role === "user"
                  ? "bg-purple text-white"
                  : "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
              }`}
            >
              <p className="text-sm leading-relaxed">
                {cleanDisplayText(message.text)}
              </p>
            </div>
          </div>
        ))}
        {status === "processing" && (
          <div className="flex items-end gap-2">
            <Mascot status="processing" size="md" />
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
