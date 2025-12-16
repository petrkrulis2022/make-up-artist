import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navigation.css";

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMenu();
    }
  };

  return (
    <nav className="navigation">
      <button
        className="hamburger"
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      <ul className={`nav-menu ${isMenuOpen ? "nav-menu-open" : ""}`}>
        <li>
          <Link to="/" onClick={closeMenu}>
            Domů
          </Link>
        </li>
        <li>
          <Link to="/portfolio" onClick={closeMenu}>
            Portfolio
          </Link>
        </li>
        <li>
          <Link to="/kurzy" onClick={closeMenu}>
            Kurzy líčení
          </Link>
        </li>
        <li>
          <Link to="/o-mne" onClick={closeMenu}>
            O mně
          </Link>
        </li>
        <li>
          <Link to="/kontakt" onClick={closeMenu}>
            Kontakt
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
