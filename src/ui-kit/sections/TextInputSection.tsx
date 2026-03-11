import { TextInput } from "@/components/TextInput";
import { Section, Variant } from "../UIKit";

export function TextInputSection() {
  const handleSend = (text: string) => {
    console.log("TextInput onSend:", text);
  };

  return (
    <Section title="TextInput">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <Variant label="Enabled">
          <div className="max-w-lg">
            <TextInput onSend={handleSend} disabled={false} />
          </div>
        </Variant>
        <Variant label="Disabled">
          <div className="max-w-lg">
            <TextInput onSend={handleSend} disabled={true} />
          </div>
        </Variant>
      </div>
    </Section>
  );
}
