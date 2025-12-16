import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navigation from "./Navigation";

describe("Navigation Component", () => {
  it("should contain all required links with Czech labels", () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Check all navigation links are present with correct Czech labels
    expect(screen.getByRole("link", { name: "Domů" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portfolio" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Kurzy líčení" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "O mně" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kontakt" })).toBeInTheDocument();
  });

  it("should have correct href attributes for all links", () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    expect(screen.getByRole("link", { name: "Domů" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "href",
      "/portfolio"
    );
    expect(screen.getByRole("link", { name: "Kurzy líčení" })).toHaveAttribute(
      "href",
      "/kurzy"
    );
    expect(screen.getByRole("link", { name: "O mně" })).toHaveAttribute(
      "href",
      "/o-mne"
    );
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute(
      "href",
      "/kontakt"
    );
  });
});
