import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username.trim()) {
      setError("Uživatelské jméno je povinné");
      return false;
    }
    if (!password) {
      setError("Heslo je povinné");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: username.trim(),
        password,
      });

      if (response.data.success) {
        // Store JWT token in localStorage
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));

        // Redirect to admin dashboard
        navigate("/admin/dashboard");
      } else {
        setError(response.data.error?.message || "Přihlášení se nezdařilo");
      }
    } catch (err) {
      // Display error message in Czech
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (err.response?.status === 401) {
        setError("Neplatné přihlašovací údaje");
      } else {
        setError("Chyba při přihlašování. Zkuste to prosím znovu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <h1>Přihlášení administrátora</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Uživatelské jméno</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Heslo</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? "Přihlašování..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
