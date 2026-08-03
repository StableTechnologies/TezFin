import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?state=near-liquidation");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the complete approved dashboard state", () => {
    render(<App />);

    expect(
      screen.getByRole("link", { name: "TezFin dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#dashboard",
    );
    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Your position is close to liquidation");
    expect(
      screen.getByRole("region", { name: "Supplying" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Borrowing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Assets to Supply" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Assets to Borrow" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "dashboard");
  });

  it("switches between the approved account fixtures", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Disconnected" }));

    expect(
      screen.getByRole("heading", { name: "Your TezFin passbook" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Connect wallet" }),
    ).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(window.location.search).toContain("state=disconnected");
  });

  it("requires an explicit debt choice before opening a repayment review", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Choose debt to repay" }));

    const chooser = screen.getByRole("dialog", { name: "Choose debt to repay" });
    expect(chooser).toHaveTextContent(
      "TezFin will not select or batch debts automatically",
    );

    const usdTzChoice = within(chooser).getByRole("button", {
      name: /USDtz.*2,000 USDtz/s,
    });
    fireEvent.click(usdTzChoice);

    expect(
      screen.getByRole("dialog", { name: "Repay USDtz" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Offline fixture — wallet and RPC access are disabled"),
    ).toBeInTheDocument();
  });

  it("rejects a malformed decimal amount instead of accepting its valid prefix", () => {
    render(<App />);

    const supplyBoard = screen.getByRole("region", {
      name: "Assets to Supply",
    });
    fireEvent.click(
      within(supplyBoard).getAllByRole("button", { name: "Supply" })[0],
    );

    const dialog = screen.getByRole("dialog", { name: "Supply XTZ" });
    const input = within(dialog).getByRole("textbox", {
      name: "Amount in XTZ",
    });

    fireEvent.change(input, { target: { value: "1.2.3" } });

    expect(input).toHaveValue("1.2.3");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Enter a valid decimal amount",
    );
    expect(
      within(dialog).getByRole("button", { name: "Check amount" }),
    ).toBeDisabled();

    fireEvent.change(input, { target: { value: "1.23" } });

    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Review supply" }),
    ).toBeEnabled();
  });

  it("keeps wallet connection local to the offline fixture", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/?state=disconnected");

    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Connect wallet" })[0]);

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent("Wallet access is disabled in this offline design preview.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
