import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const verifyToken = async () => {
      // If no token exists, don't bother verifying
      if (!token) {
        setIsValidating(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Verify token with backend by making an authenticated request
        const response = await axios.get(`${API_BASE_URL}/admin/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Token verification failed (expired, invalid, etc.)
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Ověřování přístupu...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
