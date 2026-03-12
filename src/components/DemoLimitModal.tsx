import { Mascot } from "./Mascot";
import { DEMO_LIMIT } from "../hooks/useDemoLimit";

export function DemoLimitModal() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mb-4 flex justify-center">
          <Mascot status="idle" size="lg" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-purple">
          Demo Limit Reached
        </h2>
        <p className="mb-6 text-gray-600">
          You've used all {DEMO_LIMIT} demo messages. Thanks for trying
          MyStoria!
        </p>
        <a
          href="https://www.linkedin.com/in/anton-romankov/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-coral px-6 py-3 font-medium text-white transition-colors hover:bg-coral-dark"
        >
          Contact Anton on LinkedIn
        </a>
      </div>
    </div>
  );
}
