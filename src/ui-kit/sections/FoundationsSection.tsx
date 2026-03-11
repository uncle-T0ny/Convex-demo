import { useState } from "react";
import { Section } from "../UIKit";

interface ColorSwatchProps {
  name: string;
  value: string;
  cssVar: string;
}

function ColorSwatch({ name, value, cssVar }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  const isLight = [
    "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#fdf5f1", "#ffdb8d",
  ].includes(value.toLowerCase());

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleCopy}
        className={`relative h-20 w-full cursor-pointer rounded-lg border transition-all hover:scale-105 hover:shadow-md ${
          isLight ? "border-gray-300" : "border-transparent"
        }`}
        style={{ backgroundColor: value }}
        title={`Click to copy ${value}`}
      >
        {copied && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-xs font-medium text-white">
            Copied!
          </span>
        )}
      </button>
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="font-mono text-xs text-gray-500">{value}</p>
        <p className="text-xs text-gray-400">{cssVar}</p>
      </div>
    </div>
  );
}

const brandColors: ColorSwatchProps[] = [
  { name: "purple", value: "#3d1b4d", cssVar: "Primary actions, headings" },
  { name: "burgundy", value: "#5e1d49", cssVar: "Hover states, dark accents" },
  { name: "purple-light", value: "#7e7bff", cssVar: "Focus rings, highlights" },
  { name: "coral", value: "#ff7f6c", cssVar: "Listening state, CTA sections" },
  { name: "teal", value: "#07c5ce", cssVar: "Speaking state, success" },
  { name: "gold", value: "#ffdb8d", cssVar: "Processing, accents" },
  { name: "bright-pink", value: "#e073a7", cssVar: "Secondary accent" },
  { name: "coral-light", value: "#fdf5f1", cssVar: "Page background" },
];

const neutralColors: ColorSwatchProps[] = [
  { name: "white", value: "#ffffff", cssVar: "Backgrounds, cards" },
  { name: "gray-50", value: "#f9fafb", cssVar: "Page background" },
  { name: "gray-100", value: "#f3f4f6", cssVar: "Button backgrounds" },
  { name: "gray-200", value: "#e5e7eb", cssVar: "Borders" },
  { name: "gray-400", value: "#9ca3af", cssVar: "Placeholder text" },
  { name: "gray-500", value: "#6b7280", cssVar: "Secondary text" },
  { name: "gray-600", value: "#4b5563", cssVar: "Icons" },
  { name: "gray-900", value: "#111827", cssVar: "Primary text" },
];

export function FoundationsSection() {
  return (
    <div className="space-y-12">
      <Section title="Color Palette">
        <p className="mb-6 text-sm text-gray-500">
          Click any color swatch to copy the hex value to clipboard.
        </p>
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Brand & Status Colors
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {brandColors.map((c) => (
                <ColorSwatch key={c.name} {...c} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Neutral Colors
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {neutralColors.map((c) => (
                <ColorSwatch key={c.name} {...c} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Color Combinations
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-purple p-4 text-white">
                <p className="font-medium">White on Purple</p>
                <p className="text-sm opacity-80">
                  Header, send button, active tabs
                </p>
              </div>
              <div className="rounded-lg bg-burgundy p-4 text-white">
                <p className="font-medium">White on Burgundy</p>
                <p className="text-sm opacity-80">Hover states, dark accents</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-purple">
                <p className="font-medium">Purple on White</p>
                <p className="text-sm text-gray-500">
                  Cards, assistant messages
                </p>
              </div>
              <div className="rounded-lg bg-coral p-4 text-white">
                <p className="font-medium">White on Coral</p>
                <p className="text-sm opacity-80">Listening state, CTAs</p>
              </div>
              <div className="rounded-lg bg-teal p-4 text-white">
                <p className="font-medium">White on Teal</p>
                <p className="text-sm opacity-80">Speaking state</p>
              </div>
              <div className="rounded-2xl bg-purple p-4 text-white">
                <p className="text-sm leading-relaxed">
                  User message bubble style
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
          <div>
            <p className="mb-1 text-xs text-gray-400">Font Family</p>
            <p className="font-mono text-base text-gray-900">
              system-ui, -apple-system, sans-serif
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Font Sizes</p>
            <div className="space-y-3">
              {[
                { cls: "text-xs", label: "text-xs", sample: "Status labels, variant tags (12px)" },
                { cls: "text-sm", label: "text-sm", sample: "Message text, input text, buttons (14px)" },
                { cls: "text-base", label: "text-base", sample: "Body text, section content (16px)" },
                { cls: "text-lg", label: "text-lg", sample: "Section headings (18px)" },
                { cls: "text-xl", label: "text-xl", sample: "Header title — Voice Assistant (20px)" },
                { cls: "text-2xl", label: "text-2xl", sample: "Page titles (24px)" },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline gap-4">
                  <span className="w-20 shrink-0 font-mono text-xs text-gray-400">
                    {item.label}
                  </span>
                  <span className={`${item.cls} text-gray-900`}>
                    {item.sample}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Font Weights</p>
            <div className="space-y-3">
              {[
                { cls: "font-normal", label: "font-normal", sample: "Message content, descriptions (400)" },
                { cls: "font-medium", label: "font-medium", sample: "Buttons, labels, tab items (500)" },
                { cls: "font-semibold", label: "font-semibold", sample: "Section headings, header title (600)" },
                { cls: "font-bold", label: "font-bold", sample: "Page titles (700)" },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline gap-4">
                  <span className="w-28 shrink-0 font-mono text-xs text-gray-400">
                    {item.label}
                  </span>
                  <span className={`text-base ${item.cls} text-gray-900`}>
                    {item.sample}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Animations">
        <p className="mb-6 text-sm text-gray-500">
          Mascot animations mapped to app status. All animations respect{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">
            prefers-reduced-motion
          </code>
          .
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              { name: "breathe", cls: "animate-breathe", status: "idle" },
              { name: "attentive", cls: "animate-attentive", status: "listening" },
              { name: "think", cls: "animate-think", status: "processing" },
              { name: "speak", cls: "animate-speak", status: "speaking" },
            ] as const
          ).map((anim) => (
            <div
              key={anim.name}
              className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4"
            >
              <div
                className={`mb-3 h-16 w-16 rounded-full bg-purple ${anim.cls}`}
              />
              <p className="font-mono text-xs text-gray-500">
                animate-{anim.name}
              </p>
              <p className="text-xs text-gray-400">{anim.status}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing & Radius">
        <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
          <div>
            <p className="mb-3 text-xs text-gray-400">Border Radius</p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "rounded", value: "4px", cls: "rounded" },
                { label: "rounded-lg", value: "8px", cls: "rounded-lg" },
                { label: "rounded-2xl", value: "16px", cls: "rounded-2xl" },
                { label: "rounded-full", value: "9999px", cls: "rounded-full" },
              ].map((r) => (
                <div key={r.label} className="text-center">
                  <div
                    className={`h-16 w-16 border-2 border-purple bg-coral-light ${r.cls}`}
                  />
                  <p className="mt-1 font-mono text-xs text-gray-500">
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-400">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs text-gray-400">Shadows</p>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "shadow-sm", cls: "shadow-sm" },
                { label: "shadow", cls: "shadow" },
                { label: "shadow-lg", cls: "shadow-lg" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div
                    className={`h-16 w-24 rounded-lg border border-gray-100 bg-white ${s.cls}`}
                  />
                  <p className="mt-1 font-mono text-xs text-gray-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
