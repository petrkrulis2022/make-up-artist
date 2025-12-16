/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import ContactPage from "./ContactPage";

// Mock axios
vi.mock("axios");

describe("ContactPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display title correctly", () => {
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const title = screen.getByRole("heading", {
      name: "Kontakt",
      level: 1,
    });
    expect(title).toBeInTheDocument();
  });

  it("should display intro text", () => {
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const introText = screen.getByText(
      /Máte zájem o profesionální líčení nebo kurzy/i
    );
    expect(introText).toBeInTheDocument();
  });

  it("should display contact information correctly", () => {
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    // Check email
    expect(screen.getByText("info@glowbyhanka.cz")).toBeInTheDocument();

    // Check phone
    expect(screen.getByText("+420 777 123 456")).toBeInTheDocument();

    // Check address
    expect(
      screen.getByText("Krásná 15, 110 00 Praha 1, Česká republika")
    ).toBeInTheDocument();
  });

  it("should have form with all required fields with Czech labels", () => {
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    // Check for Jméno field
    const nameLabel = screen.getByText(/Jméno/i);
    expect(nameLabel).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText("Vaše jméno");
    expect(nameInput).toBeInTheDocument();

    // Check for Email field
    const emailLabel = screen.getByText(/Email/i);
    expect(emailLabel).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText("vas@email.cz");
    expect(emailInput).toBeInTheDocument();

    // Check for Zpráva field
    const messageLabel = screen.getByText(/Zpráva/i);
    expect(messageLabel).toBeInTheDocument();
    const messageInput = screen.getByPlaceholderText("Vaše zpráva...");
    expect(messageInput).toBeInTheDocument();

    // Check for submit button
    const submitButton = screen.getByRole("button", {
      name: "Odeslat zprávu",
    });
    expect(submitButton).toBeInTheDocument();
  });

  it("should display validation errors in Czech when submitting empty form", async () => {
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", {
      name: "Odeslat zprávu",
    });

    await user.click(submitButton);

    // Check for Czech validation errors
    await waitFor(() => {
      expect(screen.getByText("Jméno je povinné")).toBeInTheDocument();
      expect(screen.getByText("Email je povinný")).toBeInTheDocument();
      expect(screen.getByText("Zpráva je povinná")).toBeInTheDocument();
    });
  });

  it("should display validation error for invalid email format", async () => {
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    const emailInput = screen.getByPlaceholderText("vas@email.cz");
    const submitButton = screen.getByRole("button", {
      name: "Odeslat zprávu",
    });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Neplatný formát emailu")).toBeInTheDocument();
    });
  });

  it("should submit form successfully and display success message", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          message: "Zpráva byla úspěšně odeslána",
        },
      },
    });

    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const user = userEvent.setup();

    // Fill in the form
    await user.type(screen.getByPlaceholderText("Vaše jméno"), "Jan Novák");
    await user.type(
      screen.getByPlaceholderText("vas@email.cz"),
      "jan@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("Vaše zpráva..."),
      "Chtěl bych se zeptat na kurzy líčení."
    );

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: "Odeslat zprávu",
    });
    await user.click(submitButton);

    // Check that axios was called with correct data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/contact"),
        {
          name: "Jan Novák",
          email: "jan@example.com",
          message: "Chtěl bych se zeptat na kurzy líčení.",
        }
      );
    });

    // Check for success message
    await waitFor(() => {
      expect(
        screen.getByText("Zpráva byla úspěšně odeslána")
      ).toBeInTheDocument();
    });
  });

  it("should clear form after successful submission", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          message: "Zpráva byla úspěšně odeslána",
        },
      },
    });

    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const user = userEvent.setup();

    // Fill in the form
    const nameInput = screen.getByPlaceholderText("Vaše jméno");
    const emailInput = screen.getByPlaceholderText("vas@email.cz");
    const messageInput = screen.getByPlaceholderText("Vaše zpráva...");

    await user.type(nameInput, "Jan Novák");
    await user.type(emailInput, "jan@example.com");
    await user.type(messageInput, "Test zpráva");

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: "Odeslat zprávu",
    });
    await user.click(submitButton);

    // Wait for success and check that form is cleared
    await waitFor(() => {
      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
      expect(messageInput.value).toBe("");
    });
  });

  it("should display error message when submission fails", async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: "Nepodařilo se odeslat zprávu. Zkuste to prosím později.",
          },
        },
      },
    });

    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

    const user = userEvent.setup();

    // Fill in the form
    await user.type(screen.getByPlaceholderText("Vaše jméno"), "Jan Novák");
    await user.type(
      screen.getByPlaceholderText("vas@email.cz"),
      "jan@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("Vaše zpráva..."),
      "Test zpráva"
    );

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: "Odeslat zprávu",
    });
    await user.click(submitButton);

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText(
          "Nepodařilo se odeslat zprávu. Zkuste to prosím později."
        )
      ).toBeInTheDocument();
    });
  });
});
