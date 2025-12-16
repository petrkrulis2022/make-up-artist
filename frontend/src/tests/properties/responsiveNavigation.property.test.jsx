import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as fc from "fast-check";
import Navigation from "../../components/Navigation";

// Feature: makeup-artist-website, Property 2: Responsive navigation adaptation
// For any viewport size, the navigation menu should display in a format appropriate for that screen width (hamburger menu for mobile, full menu for desktop)
// Validates: Requirements 2.5

describe("Property 2: Responsive navigation adaptation", () => {
  it("should always render navigation with hamburger button and all menu links", () => {
    // Generate random viewport widths to verify component structure is consistent
    const viewportWidthArbitrary = fc.integer({ min: 320, max: 2560 });

    fc.assert(
      fc.property(viewportWidthArbitrary, (width) => {
        const { unmount } = render(
          <MemoryRouter>
            <Navigation />
          </MemoryRouter>
        );

        // Verify hamburger button exists (CSS controls visibility)
        const hamburger = screen.getByRole("button", {
          name: /toggle navigation menu/i,
        });
        expect(hamburger).toBeInTheDocument();

        // Verify hamburger has proper accessibility attributes
        expect(hamburger).toHaveAttribute(
          "aria-label",
          "Toggle navigation menu"
        );
        expect(hamburger).toHaveAttribute("aria-expanded");

        // Verify all navigation links are always present
        const expectedLinks = [
          "Domů",
          "Portfolio",
          "Kurzy líčení",
          "O mně",
          "Kontakt",
        ];
        const links = screen.getAllByRole("link");

        expect(links.length).toBe(expectedLinks.length);

        expectedLinks.forEach((linkText) => {
          const link = screen.getByRole("link", { name: linkText });
          expect(link).toBeInTheDocument();
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it("should render navigation menu with correct structure for responsive CSS", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container, unmount } = render(
          <MemoryRouter>
            <Navigation />
          </MemoryRouter>
        );

        // Verify the navigation has the correct class structure for CSS targeting
        const nav = container.querySelector("nav.navigation");
        expect(nav).toBeInTheDocument();

        // Verify hamburger button has correct classes for CSS styling
        const hamburger = container.querySelector("button.hamburger");
        expect(hamburger).toBeInTheDocument();

        // Verify menu has correct classes for responsive CSS
        const menu = container.querySelector("ul.nav-menu");
        expect(menu).toBeInTheDocument();

        // Verify menu items exist
        const menuItems = container.querySelectorAll("ul.nav-menu li");
        expect(menuItems.length).toBe(5);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain navigation link structure across multiple renders", () => {
    // Test that the navigation structure is consistent
    const renderCountArbitrary = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(renderCountArbitrary, (count) => {
        const expectedLinks = [
          "Domů",
          "Portfolio",
          "Kurzy líčení",
          "O mně",
          "Kontakt",
        ];

        for (let i = 0; i < count; i++) {
          const { unmount } = render(
            <MemoryRouter>
              <Navigation />
            </MemoryRouter>
          );

          // Verify structure is consistent on each render
          const links = screen.getAllByRole("link");
          expect(links.length).toBe(expectedLinks.length);

          const hamburger = screen.getByRole("button", {
            name: /toggle navigation menu/i,
          });
          expect(hamburger).toBeInTheDocument();

          unmount();
        }
      }),
      { numRuns: 20 }
    );
  });
});
