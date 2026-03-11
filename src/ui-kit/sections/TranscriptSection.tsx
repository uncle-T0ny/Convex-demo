import type { Message } from "@/components/Transcript";
import { Transcript } from "@/components/Transcript";
import { Section, Variant } from "../UIKit";

const emptyMessages: Message[] = [];

const userOnly: Message[] = [
  { key: "u1", role: "user", text: "Hello, how are you?" },
  { key: "u2", role: "user", text: "Can you help me with something?" },
  { key: "u3", role: "user", text: "What is the weather like today?" },
];

const assistantOnly: Message[] = [
  {
    key: "a1",
    role: "assistant",
    text: "Hello! I'm doing well, thank you for asking.",
  },
  {
    key: "a2",
    role: "assistant",
    text: "Of course! I'd be happy to help you with anything.",
  },
];

const mixed: Message[] = [
  { key: "m1", role: "user", text: "Hi there!" },
  {
    key: "m2",
    role: "assistant",
    text: "Hello! How can I help you today?",
  },
  { key: "m3", role: "user", text: "What can you do?" },
  {
    key: "m4",
    role: "assistant",
    text: "I can answer questions, have conversations, and help with a variety of tasks. Just ask!",
  },
  { key: "m5", role: "user", text: "That sounds great, thanks!" },
];

const withFiltered: Message[] = [
  { key: "f1", role: "system", text: "System prompt: you are a helpful assistant." },
  { key: "f2", role: "user", text: "Summarize this document." },
  { key: "f3", role: "tool", text: "tool_call: summarize(doc_id=123)" },
  {
    key: "f4",
    role: "assistant",
    text: "Here is a summary of the document you requested.",
  },
];

const variants: { label: string; messages: Message[] }[] = [
  { label: "Empty state", messages: emptyMessages },
  { label: "User messages only", messages: userOnly },
  { label: "Assistant messages only", messages: assistantOnly },
  { label: "Mixed conversation", messages: mixed },
  { label: "With filtered roles (system + tool hidden)", messages: withFiltered },
];

export function TranscriptSection() {
  return (
    <Section title="Transcript">
      <div className="space-y-4">
        {variants.map((v) => (
          <Variant key={v.label} label={v.label}>
            <div className="h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex h-full flex-col">
                <Transcript messages={v.messages} status="idle" />
              </div>
            </div>
          </Variant>
        ))}
      </div>
    </Section>
  );
}
