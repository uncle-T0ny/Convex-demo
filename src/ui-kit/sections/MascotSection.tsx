import type { AppStatus } from "@/App";
import { Mascot } from "@/components/Mascot";
import { Section, Variant } from "../UIKit";

const statuses: AppStatus[] = ["idle", "listening", "processing", "speaking"];
const sizes = ["sm", "md", "lg"] as const;

export function MascotSection() {
  return (
    <Section title="Mascot">
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {sizes.map((size) => (
          <div key={size}>
            <p className="mb-3 text-xs text-gray-400">Size: {size}</p>
            <div className="flex flex-wrap items-end gap-6">
              {statuses.map((status) => (
                <Variant key={status} label={status}>
                  <Mascot status={status} size={size} />
                </Variant>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
