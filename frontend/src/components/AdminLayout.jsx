import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLayout.css";

function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear token and user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login page
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <div className="admin-layout__header-content">
          <h1 className="admin-layout__title">Admin Panel</h1>
          <button onClick={handleLogout} className="admin-layout__logout-btn">
            Odhlásit se
          </button>
        </div>
      </header>

      <nav className="admin-layout__nav">
        <ul className="admin-layout__nav-list">
          <li className="admin-layout__nav-item">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="admin-layout__nav-link"
            >
              Dashboard
            </button>
          </li>
          <li className="admin-layout__nav-item">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="admin-layout__nav-link"
            >
              Správa obrázků
            </button>
          </li>
        </ul>
      </nav>

      <main className="admin-layout__content">{children}</main>
    </div>
  );
}

export default AdminLayout;
