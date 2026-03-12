import { useState, type FormEvent } from "react";

interface TextInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function TextInput({ onSend, disabled }: TextInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-light focus:outline-none focus:ring-1 focus:ring-purple-light disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-full bg-purple px-4 py-2.5 text-sm font-medium text-white hover:bg-burgundy disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
