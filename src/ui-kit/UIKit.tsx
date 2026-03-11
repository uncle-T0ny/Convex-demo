import { useState, type ReactNode } from "react";
import { FoundationsSection } from "./sections/FoundationsSection";
import { MascotSection } from "./sections/MascotSection";
import { HeaderSection } from "./sections/HeaderSection";
import { VoiceButtonSection } from "./sections/VoiceButtonSection";
import { TranscriptSection } from "./sections/TranscriptSection";
import { TextInputSection } from "./sections/TextInputSection";
import { CompositionSection } from "./sections/CompositionSection";

type TabId = "foundations" | "components" | "patterns";

const TABS: { id: TabId; label: string; description: string }[] = [
  {
    id: "foundations",
    label: "Foundations",
    description: "Core design tokens: colors, typography, and animations",
  },
  {
    id: "components",
    label: "Components",
    description: "All UI components with their visual states and variants",
  },
  {
    id: "patterns",
    label: "Patterns",
    description: "Real-world component compositions and usage examples",
  },
];

export function UIKit() {
  const [activeTab, setActiveTab] = useState<TabId>("foundations");
  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="h-screen overflow-y-auto bg-coral-light">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-14 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple text-xs font-bold text-white">
              VA
            </div>
            <div>
              <h1 className="text-lg font-semibold text-purple">
                UI Kit Playground
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                Component library reference
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="-mb-px flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple text-white"
                    : "text-gray-600 hover:bg-purple/5 hover:text-purple"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-purple">
            {activeTabData.label}
          </h2>
          <p className="mt-1 text-gray-500">{activeTabData.description}</p>
        </div>

        {activeTab === "foundations" && <FoundationsSection />}

        {activeTab === "components" && (
          <div className="space-y-12">
            <MascotSection />
            <HeaderSection />
            <VoiceButtonSection />
            <TranscriptSection />
            <TextInputSection />
          </div>
        )}

        {activeTab === "patterns" && <CompositionSection />}
      </main>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-6 border-b border-gray-200 pb-2 text-xl font-semibold text-purple">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Variant({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
      {children}
    </div>
  );
}
