import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import axios from "axios";

// Mock axios
vi.mock("axios");

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Test: Login form displays correctly
  // Requirements: 7.1
  it("should display login form with username and password fields", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Check for heading
    expect(
      screen.getByRole("heading", { name: /přihlášení administrátora/i })
    ).toBeInTheDocument();

    // Check for username field
    const usernameInput = screen.getByLabelText(/uživatelské jméno/i);
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute("type", "text");

    // Check for password field
    const passwordInput = screen.getByLabelText(/heslo/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");

    // Check for submit button
    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });
    expect(submitButton).toBeInTheDocument();
  });

  // Test: Login form validates inputs
  // Requirements: 7.1, 7.2
  it("should validate that username is required", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });

    // Try to submit without username
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/uživatelské jméno je povinné/i)
      ).toBeInTheDocument();
    });

    // Axios should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should validate that password is required", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/uživatelské jméno/i);
    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });

    // Enter username but no password
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/heslo je povinné/i)).toBeInTheDocument();
    });

    // Axios should not be called
    expect(axios.post).not.toHaveBeenCalled();
  });

  // Test: Successful login stores token and redirects
  // Requirements: 7.2, 7.3
  it("should store token and redirect to dashboard on successful login", async () => {
    const mockToken = "mock.jwt.token";
    const mockUser = { id: 1, username: "admin", email: "admin@example.com" };

    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: mockToken,
          user: mockUser,
        },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/uživatelské jméno/i);
    const passwordInput = screen.getByLabelText(/heslo/i);
    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });

    // Fill in form
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that token was stored
      expect(localStorage.getItem("token")).toBe(mockToken);
      expect(localStorage.getItem("user")).toBe(JSON.stringify(mockUser));

      // Check that navigation occurred
      expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  // Test: Failed login displays error in Czech
  // Requirements: 7.2, 7.3
  it("should display error message in Czech on login failure with invalid credentials", async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Neplatné přihlašovací údaje",
          },
        },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/uživatelské jméno/i);
    const passwordInput = screen.getByLabelText(/heslo/i);
    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });

    // Fill in form with invalid credentials
    fireEvent.change(usernameInput, { target: { value: "wronguser" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/neplatné přihlašovací údaje/i)
      ).toBeInTheDocument();
    });

    // Token should not be stored
    expect(localStorage.getItem("token")).toBeNull();

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should display generic error message in Czech on network error", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/uživatelské jméno/i);
    const passwordInput = screen.getByLabelText(/heslo/i);
    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });

    // Fill in form
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/chyba při přihlašování. zkuste to prosím znovu./i)
      ).toBeInTheDocument();
    });
  });

  it("should show loading state during login", async () => {
    // Create a promise that we can control
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    axios.post.mockReturnValueOnce(loginPromise);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/uživatelské jméno/i);
    const passwordInput = screen.getByLabelText(/heslo/i);
    const submitButton = screen.getByRole("button", { name: /přihlásit se/i });

    // Fill in form
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText(/přihlašování\.\.\./i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise
    resolveLogin({
      data: {
        success: true,
        data: {
          token: "token",
          user: { id: 1, username: "admin" },
        },
      },
    });
  });
});
