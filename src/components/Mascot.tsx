import type { AppStatus } from "../App";
import emberIdle from "../assets/ember-idle.svg";
import emberListening from "../assets/ember-listening.svg";
import emberProcessing from "../assets/ember-processing.svg";
import emberSpeaking from "../assets/ember-speaking.svg";
import emberMini from "../assets/ember-mini.svg";

const statusSvg: Record<AppStatus, string> = {
  idle: emberIdle,
  listening: emberListening,
  processing: emberProcessing,
  speaking: emberSpeaking,
};

const statusAnimation: Record<AppStatus, string> = {
  idle: "animate-breathe",
  listening: "animate-attentive",
  processing: "animate-think",
  speaking: "animate-speak",
};

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-[120px] w-[120px]",
} as const;

export function Mascot({
  status,
  size,
  className = "",
}: {
  status: AppStatus;
  size: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = size === "sm" ? emberMini : statusSvg[status];
  const animation = statusAnimation[status];

  return (
    <img
      src={src}
      alt=""
      role="img"
      aria-hidden="true"
      className={`${sizeClasses[size]} ${animation} motion-reduce:animate-none ${className}`}
    />
  );
}
