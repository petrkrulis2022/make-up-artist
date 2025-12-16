import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>&copy; {currentYear} Glow by Hanka. Všechna práva vyhrazena.</p>
    </footer>
  );
}

export default Footer;
