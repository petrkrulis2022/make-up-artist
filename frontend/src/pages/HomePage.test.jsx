/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("HomePage Component", () => {
  it("should display headline correctly", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const headline = screen.getByRole("heading", {
      name: "Rozzařte svou krásu s Glow by Hanka",
    });
    expect(headline).toBeInTheDocument();
  });

  it("should display intro text", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const introText = screen.getByText(/Vítejte v mém světě krásy a elegance/i);
    expect(introText).toBeInTheDocument();
  });

  it("should display CTA button with correct label", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const ctaButton = screen.getByRole("button", {
      name: "Prohlédnout Portfolio",
    });
    expect(ctaButton).toBeInTheDocument();
  });

  it("should navigate to Portfolio page when CTA button is clicked", async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const user = userEvent.setup();

    const ctaButton = screen.getByRole("button", {
      name: "Prohlédnout Portfolio",
    });

    await user.click(ctaButton);

    expect(mockNavigate).toHaveBeenCalledWith("/portfolio");
  });
});
