import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import * as fc from "fast-check";
import ProtectedRoute from "../../components/ProtectedRoute";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import LoginPage from "../../pages/admin/LoginPage";
import axios from "axios";

// Feature: makeup-artist-website, Property 9: Session expiration enforcement
// For any expired or logged-out session, subsequent attempts to access protected routes should require re-authentication
// Validates: Requirements 7.4

vi.mock("axios");

describe("Property 9: Session expiration enforcement", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should redirect to login for any expired token", async () => {
    // Generator for expired/invalid token scenarios
    const expiredTokenScenarios = fc.constantFrom(
      { token: "expired.jwt.token", errorCode: "TOKEN_EXPIRED" },
      { token: "invalid.jwt.token", errorCode: "INVALID_TOKEN" },
      { token: "malformed-token", errorCode: "AUTH_ERROR" },
      { token: "", errorCode: "NO_TOKEN" }
    );

    await fc.assert(
      fc.asyncProperty(expiredTokenScenarios, async (scenario) => {
        // Set up the expired/invalid token
        if (scenario.token) {
          localStorage.setItem("token", scenario.token);
        }

        // Mock axios to return error for token verification
        axios.get.mockRejectedValueOnce({
          response: {
            status: 401,
            data: {
              success: false,
              error: {
                code: scenario.errorCode,
                message: "Token verification failed",
              },
            },
          },
        });

        const { unmount } = render(
          <MemoryRouter initialEntries={["/admin/dashboard"]}>
            <Routes>
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        // Wait for redirect to login page
        await waitFor(
          () => {
            const loginHeading = screen.getByRole("heading", {
              name: /přihlášení administrátora/i,
            });
            expect(loginHeading).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Verify token was cleared from localStorage
        expect(localStorage.getItem("token")).toBeNull();

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it("should redirect to login when no token exists", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Ensure no token in localStorage
        localStorage.clear();

        const { unmount } = render(
          <MemoryRouter initialEntries={["/admin/dashboard"]}>
            <Routes>
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        // Should immediately redirect to login (no API call needed)
        await waitFor(
          () => {
            const loginHeading = screen.getByRole("heading", {
              name: /přihlášení administrátora/i,
            });
            expect(loginHeading).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it("should require re-authentication after logout", async () => {
    // Generator for valid tokens that will be logged out
    const validTokenGen = fc.string({ minLength: 20, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(validTokenGen, async (validToken) => {
        // Set up a valid token initially
        localStorage.setItem("token", validToken);
        localStorage.setItem(
          "user",
          JSON.stringify({ id: 1, username: "admin" })
        );

        // Mock successful verification initially
        axios.get.mockResolvedValueOnce({
          data: {
            success: true,
            data: { user: { id: 1, username: "admin" } },
          },
        });

        const { unmount, rerender } = render(
          <MemoryRouter initialEntries={["/admin/dashboard"]}>
            <Routes>
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        // Wait for dashboard to load
        await waitFor(
          () => {
            const dashboardHeading = screen.getByRole("heading", {
              name: /admin dashboard/i,
            });
            expect(dashboardHeading).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Simulate logout by clearing localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        unmount();

        // Now try to access protected route again
        const { unmount: unmount2 } = render(
          <MemoryRouter initialEntries={["/admin/dashboard"]}>
            <Routes>
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        // Should redirect to login
        await waitFor(
          () => {
            const loginHeading = screen.getByRole("heading", {
              name: /přihlášení administrátora/i,
            });
            expect(loginHeading).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        unmount2();
      }),
      { numRuns: 100 }
    );
  });
});
