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
  onReset,
}: {
  status: AppStatus;
  onTogglePanel?: () => void;
  onReset?: () => void;
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
        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Demo
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onReset && (
          <button
            onClick={onReset}
            className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Reset conversation"
            title="Start over"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M18,28A12,12,0,1,0,6,16v6.2L2.4,18.6,1,20l6,6,6-6-1.4-1.4L8,22.2V16H8A10,10,0,1,1,18,26Z" />
            </svg>
          </button>
        )}
        <Mascot status={status} size="sm" />
        <span className="text-sm text-gray-300">{statusLabels[status]}</span>
      </div>
    </header>
  );
}
