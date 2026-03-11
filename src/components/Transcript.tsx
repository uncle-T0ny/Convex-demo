import { useEffect, useRef } from "react";
import type { AppStatus } from "../App";
import { Mascot } from "./Mascot";

export interface Message {
  key: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
}

function cleanDisplayText(text: string): string {
  return text
    .replace(/<emotion\s+value="[^"]*"\s*\/>/g, "")
    .replace(/\[laughter\]/g, "")
    .trim();
}

export function Transcript({
  messages,
  status,
}: {
  messages: Message[];
  status: AppStatus;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const visibleMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  if (visibleMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <Mascot status={status} size="lg" />
        <p className="text-center text-sm text-gray-400">
          Hi! I'm MyStoria, your fertility treatment companion. Tap the mic or
          type to get started.
        </p>
      </div>
    );
  }

  let lastAssistantIndex = -1;
  for (let i = visibleMessages.length - 1; i >= 0; i--) {
    if (visibleMessages[i].role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {visibleMessages.map((message, index) => (
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
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
