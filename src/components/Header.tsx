import type { AppStatus } from "../App";
import { Mascot } from "./Mascot";

const statusLabels: Record<AppStatus, string> = {
  idle: "Ready",
  listening: "Listening...",
  processing: "Thinking...",
  speaking: "Speaking...",
};

export function Header({
  status,
  onTogglePanel,
}: {
  status: AppStatus;
  onTogglePanel?: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-purple px-6 py-4">
      <div className="flex items-center gap-3">
        {onTogglePanel && (
          <button
            onClick={onTogglePanel}
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Toggle dashboard"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-semibold text-white">MyStoria</h1>
      </div>
      <div className="flex items-center gap-2">
        <Mascot status={status} size="sm" />
        <span className="text-sm text-gray-300">{statusLabels[status]}</span>
      </div>
    </header>
  );
}
