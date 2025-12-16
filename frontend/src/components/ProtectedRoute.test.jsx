import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import axios from "axios";

// Mock axios
vi.mock("axios");

// Mock components for testing
const ProtectedContent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Test: Protected routes redirect when not authenticated
  // Requirements: 7.5
  it("should redirect to login page when no token exists", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  it("should redirect to login page when token is invalid", async () => {
    localStorage.setItem("token", "invalid.token");

    axios.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid token",
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading first
    expect(screen.getByText(/ověřování přístupu/i)).toBeInTheDocument();

    // Then redirect to login page
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    // Token should be cleared
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("should redirect to login page when token is expired", async () => {
    localStorage.setItem("token", "expired.token");

    axios.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Token has expired",
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    // Token and user should be cleared
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("should render protected content when token is valid", async () => {
    localStorage.setItem("token", "valid.token");

    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { id: 1, username: "admin" },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading first
    expect(screen.getByText(/ověřování přístupu/i)).toBeInTheDocument();

    // Then show protected content
    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    });

    // Verify token verification was called
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/admin/verify"),
      expect.objectContaining({
        headers: {
          Authorization: "Bearer valid.token",
        },
      })
    );
  });

  it("should show loading state while verifying token", () => {
    localStorage.setItem("token", "some.token");

    // Don't resolve the promise immediately
    axios.get.mockReturnValueOnce(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading state
    expect(screen.getByText(/ověřování přístupu/i)).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
