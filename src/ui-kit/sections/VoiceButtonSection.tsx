import type { AppStatus } from "@/App";
import { VoiceButton } from "@/components/VoiceButton";
import { Section, Variant } from "../UIKit";

const statuses: AppStatus[] = ["idle", "listening", "processing", "speaking"];

export function VoiceButtonSection() {
  const handleClick = () => {
    console.log("VoiceButton clicked");
  };

  return (
    <Section title="VoiceButton">
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <p className="mb-3 text-xs text-gray-400">Enabled</p>
          <div className="flex flex-wrap gap-6">
            {statuses.map((status) => (
              <Variant key={status} label={status}>
                <VoiceButton
                  status={status}
                  onClick={handleClick}
                  disabled={false}
                />
              </Variant>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs text-gray-400">Disabled</p>
          <div className="flex flex-wrap gap-6">
            {statuses.map((status) => (
              <Variant key={status} label={status}>
                <VoiceButton
                  status={status}
                  onClick={handleClick}
                  disabled={true}
                />
              </Variant>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
