import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, test, vi, afterEach } from "vitest";

afterEach(cleanup);
import { VoiceButton } from "../../components/VoiceButton";

describe("VoiceButton", () => {
  test('idle → aria-label "Start listening"', () => {
    render(<VoiceButton status="idle" onClick={vi.fn()} disabled={false} />);
    expect(
      screen.getByRole("button", { name: "Start listening" }),
    ).toBeDefined();
  });

  test("idle → gray background", () => {
    render(<VoiceButton status="idle" onClick={vi.fn()} disabled={false} />);
    const button = screen.getByRole("button", { name: "Start listening" });
    expect(button.className).toContain("bg-gray-100");
  });

  test("idle → shows mic icon (not speaker)", () => {
    const { container } = render(
      <VoiceButton status="idle" onClick={vi.fn()} disabled={false} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // Mic icon has the microphone path
    const paths = container.querySelectorAll("path");
    const pathData = Array.from(paths).map((p) => p.getAttribute("d"));
    expect(pathData.some((d) => d?.includes("M12 1a4"))).toBe(true);
  });

  test("idle → calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<VoiceButton status="idle" onClick={onClick} disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Start listening" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('listening → aria-label "Stop listening"', () => {
    render(
      <VoiceButton status="listening" onClick={vi.fn()} disabled={false} />,
    );
    expect(
      screen.getByRole("button", { name: "Stop listening" }),
    ).toBeDefined();
  });

  test("listening → red background", () => {
    render(
      <VoiceButton status="listening" onClick={vi.fn()} disabled={false} />,
    );
    const button = screen.getByRole("button", { name: "Stop listening" });
    expect(button.className).toContain("bg-coral");
  });

  test("processing → button is disabled", () => {
    render(
      <VoiceButton status="processing" onClick={vi.fn()} disabled={false} />,
    );
    const button = screen.getByRole("button", {
      name: "Start listening",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test("processing → onClick not fired", () => {
    const onClick = vi.fn();
    render(
      <VoiceButton status="processing" onClick={onClick} disabled={false} />,
    );
    const button = screen.getByRole("button", { name: "Start listening" });
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('speaking → aria-label "Stop speaking"', () => {
    render(
      <VoiceButton status="speaking" onClick={vi.fn()} disabled={false} />,
    );
    expect(
      screen.getByRole("button", { name: "Stop speaking" }),
    ).toBeDefined();
  });

  test("speaking → green background", () => {
    render(
      <VoiceButton status="speaking" onClick={vi.fn()} disabled={false} />,
    );
    const button = screen.getByRole("button", { name: "Stop speaking" });
    expect(button.className).toContain("bg-teal");
  });

  test("speaking → shows speaker icon", () => {
    const { container } = render(
      <VoiceButton status="speaking" onClick={vi.fn()} disabled={false} />,
    );
    const paths = container.querySelectorAll("path");
    const pathData = Array.from(paths).map((p) => p.getAttribute("d"));
    // Speaker icon has the speaker path, not the mic path
    expect(pathData.some((d) => d?.includes("M13.5 4.06"))).toBe(true);
    expect(pathData.some((d) => d?.includes("M12 1a4"))).toBe(false);
  });

  test("disabled prop → button disabled in idle", () => {
    render(<VoiceButton status="idle" onClick={vi.fn()} disabled={true} />);
    const button = screen.getByRole("button", {
      name: "Start listening",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
