import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, test, vi, afterEach } from "vitest";

afterEach(cleanup);
import { TextInput } from "../../components/TextInput";

describe("TextInput", () => {
  test("renders input with placeholder", () => {
    render(<TextInput onSend={vi.fn()} disabled={false} />);
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  test("renders Send button", () => {
    render(<TextInput onSend={vi.fn()} disabled={false} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  test("calls onSend with text on submit", () => {
    const onSend = vi.fn();
    render(<TextInput onSend={onSend} disabled={false} />);
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(input.closest("form")!);
    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  test("clears input after submit", () => {
    render(<TextInput onSend={vi.fn()} disabled={false} />);
    const input = screen.getByPlaceholderText(
      "Type a message...",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(input.closest("form")!);
    expect(input.value).toBe("");
  });

  test("does not call onSend when empty", () => {
    const onSend = vi.fn();
    render(<TextInput onSend={onSend} disabled={false} />);
    fireEvent.submit(
      screen.getByPlaceholderText("Type a message...").closest("form")!,
    );
    expect(onSend).not.toHaveBeenCalled();
  });

  test("does not call onSend with only whitespace", () => {
    const onSend = vi.fn();
    render(<TextInput onSend={onSend} disabled={false} />);
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form")!);
    expect(onSend).not.toHaveBeenCalled();
  });

  test("input disabled when disabled=true", () => {
    render(<TextInput onSend={vi.fn()} disabled={true} />);
    const input = screen.getByPlaceholderText(
      "Type a message...",
    ) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  test("send button disabled when disabled=true", () => {
    render(<TextInput onSend={vi.fn()} disabled={true} />);
    const button = screen.getByRole("button", {
      name: /send/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test("send button disabled when input is empty", () => {
    render(<TextInput onSend={vi.fn()} disabled={false} />);
    const button = screen.getByRole("button", {
      name: /send/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test("send button enabled when text entered", () => {
    render(<TextInput onSend={vi.fn()} disabled={false} />);
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Hello" } });
    const button = screen.getByRole("button", {
      name: /send/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});
