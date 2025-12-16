import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>&copy; {currentYear} Glow by Hanka. Všechna práva vyhrazena.</p>
      <Link to="/admin/login" className="footer__admin-link">
        Admin
      </Link>
    </footer>
  );
}

export default Footer;
