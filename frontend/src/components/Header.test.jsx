import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";

describe("Header Component", () => {
  it("should display logo", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const logo = screen.getByText("Glow by Hanka MAKEUP ARTIST");
    expect(logo).toBeInTheDocument();
  });

  it("should display navigation menu", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    // Check that navigation exists
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("should have logo that links to homepage", () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const logoLink = screen.getByRole("link", {
      name: "Glow by Hanka MAKEUP ARTIST",
    });
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
