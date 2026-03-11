import type { AppStatus } from "@/App";
import { Header } from "@/components/Header";
import { Transcript, type Message } from "@/components/Transcript";
import { VoiceButton } from "@/components/VoiceButton";
import { TextInput } from "@/components/TextInput";
import { Section } from "../UIKit";

const conversation: Message[] = [
  { key: "c1", role: "user", text: "What's the weather like today?" },
  {
    key: "c2",
    role: "assistant",
    text: "It looks like it's going to be a sunny day with a high of 72°F. Perfect weather to be outside!",
  },
  { key: "c3", role: "user", text: "Great, thanks!" },
];

function AppPreview({ status, label }: { status: AppStatus; label: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
      <div className="mx-auto flex h-[420px] max-w-sm flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
        <Header status={status} />
        <Transcript
          messages={status === "idle" ? [] : conversation}
          status={status}
        />
        <div className="border-t border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <VoiceButton
              status={status}
              onClick={() => console.log("mic toggle")}
              disabled={false}
            />
            <TextInput
              onSend={(t) => console.log("send:", t)}
              disabled={status === "processing" || status === "speaking"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompositionSection() {
  return (
    <div className="space-y-12">
      <Section title="Full App States">
        <p className="mb-6 text-sm text-gray-500">
          The complete app assembled in each of its 4 status states, showing how
          all components work together.
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AppPreview status="idle" label="Idle — empty, ready to start" />
          <AppPreview
            status="listening"
            label="Listening — mic active, recording"
          />
          <AppPreview
            status="processing"
            label="Processing — waiting for AI response"
          />
          <AppPreview
            status="speaking"
            label="Speaking — reading response aloud"
          />
        </div>
      </Section>

      <Section title="Input Bar Composition">
        <p className="mb-6 text-sm text-gray-500">
          VoiceButton + TextInput combined as they appear in the app footer.
        </p>
        <div className="space-y-4">
          {(
            [
              { label: "Ready to interact", status: "idle" as const, disabled: false },
              { label: "Currently listening", status: "listening" as const, disabled: false },
              { label: "Waiting for response (inputs disabled)", status: "processing" as const, disabled: true },
              { label: "Speaking response (inputs disabled)", status: "speaking" as const, disabled: true },
            ]
          ).map((variant) => (
            <div key={variant.label}>
              <p className="mb-2 text-xs font-medium text-gray-400">
                {variant.label}
              </p>
              <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <VoiceButton
                    status={variant.status}
                    onClick={() => console.log("mic toggle")}
                    disabled={false}
                  />
                  <TextInput
                    onSend={(t) => console.log("send:", t)}
                    disabled={variant.disabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
