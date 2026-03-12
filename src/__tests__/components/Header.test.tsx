import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, test, afterEach } from "vitest";

afterEach(cleanup);
import { Header } from "../../components/Header";
import type { AppStatus } from "../../App";

describe("Header", () => {
  test('renders title "MyStoria"', () => {
    render(<Header status="idle" />);
    expect(screen.getByText("MyStoria")).toBeInTheDocument();
  });

  describe("status labels", () => {
    const cases: [AppStatus, string][] = [
      ["idle", "Ready"],
      ["listening", "Listening..."],
      ["processing", "Thinking..."],
      ["speaking", "Speaking..."],
    ];

    test.each(cases)('%s → "%s" label', (status, label) => {
      render(<Header status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe("mascot", () => {
    test("renders mascot image for each status", () => {
      const statuses: AppStatus[] = ["idle", "listening", "processing", "speaking"];
      for (const status of statuses) {
        const { container, unmount } = render(<Header status={status} />);
        const img = container.querySelector("img[aria-hidden='true']");
        expect(img).not.toBeNull();
        unmount();
      }
    });
  });
});
