import { render, screen } from "@testing-library/react";
import { lazy } from "react";
import { describe, expect, it } from "vitest";
import { LazyWhen } from "./LazyWhen";

const Window = lazy(() => Promise.resolve({ default: () => <p>The window</p> }));

describe("LazyWhen", () => {
  it("loads nothing until it is first wanted, and keeps it after", async () => {
    const { rerender } = render(
      <LazyWhen when={false}>
        <Window />
      </LazyWhen>,
    );
    expect(screen.queryByText("The window")).toBeNull();
    rerender(
      <LazyWhen when={true}>
        <Window />
      </LazyWhen>,
    );
    expect(await screen.findByText("The window")).toBeInTheDocument();
    rerender(
      <LazyWhen when={false}>
        <Window />
      </LazyWhen>,
    );
    expect(screen.getByText("The window")).toBeInTheDocument();
  });
});
