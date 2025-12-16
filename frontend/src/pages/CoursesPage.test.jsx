/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CoursesPage from "./CoursesPage";

describe("CoursesPage Component", () => {
  it("should display title correctly", () => {
    render(
      <BrowserRouter>
        <CoursesPage />
      </BrowserRouter>
    );

    const title = screen.getByRole("heading", {
      name: "Kurzy líčení",
    });
    expect(title).toBeInTheDocument();
  });

  it("should display course description text", () => {
    render(
      <BrowserRouter>
        <CoursesPage />
      </BrowserRouter>
    );

    // Check for key phrases from the course description
    const descriptionText = screen.getByText(
      /Nabízím profesionální kurzy líčení/i
    );
    expect(descriptionText).toBeInTheDocument();
  });

  it("should include information about individual and group courses", () => {
    render(
      <BrowserRouter>
        <CoursesPage />
      </BrowserRouter>
    );

    // Check for individual courses mention
    const individualGroupText = screen.getByText(
      /Kurzy jsou dostupné jak pro jednotlivce, tak pro skupiny/i
    );
    expect(individualGroupText).toBeInTheDocument();
  });

  it("should include information about techniques taught", () => {
    render(
      <BrowserRouter>
        <CoursesPage />
      </BrowserRouter>
    );

    // Check for techniques information
    const techniquesText = screen.getByText(
      /základní i pokročilé techniky líčení/i
    );
    expect(techniquesText).toBeInTheDocument();

    // Check for specific techniques mentioned
    const specificTechniques = screen.getByText(
      /přípravy pleti, aplikace make-upu, konturování/i
    );
    expect(specificTechniques).toBeInTheDocument();
  });

  it("should include contact instructions", () => {
    render(
      <BrowserRouter>
        <CoursesPage />
      </BrowserRouter>
    );

    // Check for contact instructions
    const contactText = screen.getByText(
      /Pro více informací o kurzech, termínech a cenách/i
    );
    expect(contactText).toBeInTheDocument();

    // Check for email link
    const emailLink = screen.getByRole("link", {
      name: "info@glowbyhanka.cz",
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:info@glowbyhanka.cz");
  });
});
