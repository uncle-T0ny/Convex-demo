import type { AppStatus } from "@/App";
import { Header } from "@/components/Header";
import { Section, Variant } from "../UIKit";

const statuses: AppStatus[] = ["idle", "listening", "processing", "speaking"];

export function HeaderSection() {
  return (
    <Section title="Header">
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        {statuses.map((status) => (
          <Variant key={status} label={status}>
            <Header status={status} />
          </Variant>
        ))}
      </div>
    </Section>
  );
}
