import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { Transcript } from "../../components/Transcript";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

function msg(
  role: "user" | "assistant" | "system" | "tool",
  text: string,
  key?: string,
) {
  return { key: key ?? text, role, text };
}

describe("Transcript", () => {
  test("empty messages → placeholder text", () => {
    render(<Transcript messages={[]} status="idle" />);
    expect(
      screen.getByText(/tap the mic or type to get started/i),
    ).toBeDefined();
  });

  test("only system/tool messages → placeholder shown", () => {
    render(
      <Transcript
        messages={[
          msg("system", "System prompt"),
          msg("tool", "tool_result"),
        ]}
        status="idle"
      />,
    );
    expect(
      screen.getByText(/tap the mic or type to get started/i),
    ).toBeDefined();
  });

  test("renders user messages", () => {
    render(<Transcript messages={[msg("user", "Hello")]} status="idle" />);
    expect(screen.getByText("Hello")).toBeDefined();
  });

  test("renders assistant messages", () => {
    render(<Transcript messages={[msg("assistant", "Hi there!")]} status="idle" />);
    expect(screen.getByText("Hi there!")).toBeDefined();
  });

  test("filters out system messages", () => {
    render(
      <Transcript
        messages={[
          msg("user", "Hello"),
          msg("system", "System prompt"),
        ]}
        status="idle"
      />,
    );
    expect(screen.queryByText("System prompt")).toBeNull();
  });

  test("filters out tool messages", () => {
    render(
      <Transcript
        messages={[
          msg("user", "Hello"),
          msg("tool", "tool_result"),
        ]}
        status="idle"
      />,
    );
    expect(screen.queryByText("tool_result")).toBeNull();
  });

  test("user messages right-aligned", () => {
    render(<Transcript messages={[msg("user", "Hello")]} status="idle" />);
    const text = screen.getByText("Hello");
    const container = text.closest(".flex.justify-end");
    expect(container).not.toBeNull();
  });

  test("assistant messages left-aligned", () => {
    render(<Transcript messages={[msg("assistant", "Hi!")]} status="idle" />);
    const text = screen.getByText("Hi!");
    const container = text.closest(".flex.justify-start");
    expect(container).not.toBeNull();
  });

  test("user bubble is blue", () => {
    render(<Transcript messages={[msg("user", "Hello")]} status="idle" />);
    const text = screen.getByText("Hello");
    const bubble = text.closest(".bg-purple");
    expect(bubble).not.toBeNull();
  });

  test("assistant bubble is white", () => {
    render(<Transcript messages={[msg("assistant", "Hi!")]} status="idle" />);
    const text = screen.getByText("Hi!");
    const bubble = text.closest(".bg-white");
    expect(bubble).not.toBeNull();
  });

  test("auto-scrolls on new messages", () => {
    const { rerender } = render(
      <Transcript messages={[msg("user", "Hello")]} status="idle" />,
    );
    rerender(
      <Transcript
        messages={[msg("user", "Hello"), msg("assistant", "Hi!")]}
        status="idle"
      />,
    );
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
    });
  });
});
