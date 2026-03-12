import type { AppStatus } from "../App";

interface VoiceButtonProps {
  status: AppStatus;
  onClick: () => void;
  disabled: boolean;
}

export function VoiceButton({ status, onClick, disabled }: VoiceButtonProps) {
  const isActive = status === "listening";
  const isSpeaking = status === "speaking";

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      {isActive && (
        <span className="absolute inset-0 animate-ping rounded-full bg-coral/40" />
      )}
      <button
        onClick={onClick}
        disabled={disabled || status === "processing"}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all ${
          isActive
            ? "animate-pulse bg-coral text-white shadow-lg shadow-coral/30"
            : isSpeaking
              ? "bg-teal text-white"
              : "bg-gray-100 text-purple hover:bg-gray-200"
        } disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label={
          isActive
            ? "Stop listening"
            : isSpeaking
              ? "Stop speaking"
              : "Start listening"
        }
      >
        {isSpeaking ? <SpeakerIcon /> : <MicIcon />}
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
      <path d="M6 10a1 1 0 0 0-2 0 8 8 0 0 0 7 7.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.07A8 8 0 0 0 20 10a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
      <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}
