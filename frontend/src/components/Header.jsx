import React from "react";
import { Link } from "react-router-dom";
import Navigation from "./Navigation";
import "./Header.css";

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <div className="logo">Glow by Hanka MAKEUP ARTIST</div>
        </Link>
        <Navigation />
      </div>
    </header>
  );
}

export default Header;
