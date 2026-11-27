import { describe, expect, it } from "vitest";
import { MIN_WIDTH, moveEdge } from "./tableColumns";

describe("moving the edge of a column", () => {
  it("gives one column what the next one loses", () => {
    expect(moveEdge([100, 300, 100], 0, 80)).toEqual([180, 220, 100]);
    expect(moveEdge([100, 300, 100], 1, -50)).toEqual([100, 250, 150]);
  });
  it("never makes a column narrower than the least width", () => {
    expect(moveEdge([100, 300], 0, -500)).toEqual([MIN_WIDTH, 400 - MIN_WIDTH]);
    expect(moveEdge([100, 300], 0, 500)).toEqual([400 - MIN_WIDTH, MIN_WIDTH]);
  });
  it("changes the table's width at the last column", () => {
    expect(moveEdge([100, 300], 1, 60)).toEqual([100, 360]);
  });
});
