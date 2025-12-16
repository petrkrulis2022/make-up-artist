/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AboutPage from "./AboutPage";

describe("AboutPage Component", () => {
  it("should display title correctly", () => {
    render(
      <BrowserRouter>
        <AboutPage />
      </BrowserRouter>
    );

    const title = screen.getByRole("heading", {
      name: "O mně",
    });
    expect(title).toBeInTheDocument();
  });

  it("should display biographical text", () => {
    render(
      <BrowserRouter>
        <AboutPage />
      </BrowserRouter>
    );

    // Check for key phrases from the biographical text
    const bioText = screen.getByText(
      /Jmenuji se Hanka a jsem profesionální vizážistka/i
    );
    expect(bioText).toBeInTheDocument();
  });

  it("should include information about experience", () => {
    render(
      <BrowserRouter>
        <AboutPage />
      </BrowserRouter>
    );

    // Check for experience information
    const experienceText = screen.getByText(
      /více než 8 lety zkušeností v oboru/i
    );
    expect(experienceText).toBeInTheDocument();
  });

  it("should include information about specialization", () => {
    render(
      <BrowserRouter>
        <AboutPage />
      </BrowserRouter>
    );

    // Check for specialization in wedding makeup
    const specializationText = screen.getByText(
      /Specializuji se především na svatební líčení/i
    );
    expect(specializationText).toBeInTheDocument();

    // Check for other specializations
    const otherSpecializations = screen.getByText(
      /líčení na plesy, večírky, slavnostní příležitosti/i
    );
    expect(otherSpecializations).toBeInTheDocument();
  });

  it("should include information about philosophy", () => {
    render(
      <BrowserRouter>
        <AboutPage />
      </BrowserRouter>
    );

    // Check for philosophy statement
    const philosophyText = screen.getByText(/Moje filozofie je jednoduchá/i);
    expect(philosophyText).toBeInTheDocument();

    // Check for specific philosophy details
    const philosophyDetails = screen.getByText(
      /líčení by mělo zvýraznit to nejlepší v každé ženě/i
    );
    expect(philosophyDetails).toBeInTheDocument();
  });
});
