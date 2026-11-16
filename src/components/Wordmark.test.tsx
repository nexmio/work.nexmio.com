import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Wordmark } from "./Wordmark";

describe("Wordmark", () => {
  it("is one picture named Nexmio Work, made of the mark, real text and a Work tag", () => {
    const { container } = render(<Wordmark size="lg" />);
    expect(screen.getByRole("img", { name: "Nexmio Work" })).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container).toHaveTextContent("exmioWork");
  });

  it("the compact one is only the mark and the Work tag, with the same name", () => {
    const { container } = render(<Wordmark size="sm" compact />);
    expect(screen.getByRole("img", { name: "Nexmio Work" })).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Work$/);
  });
});
