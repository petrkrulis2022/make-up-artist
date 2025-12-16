import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  const handlePortfolioClick = () => {
    navigate("/portfolio");
  };

  return (
    <div className="home-page">
      <div className="home-page__hero">
        <div className="home-page__image-container">
          <img
            src="/main-artist.jpeg"
            alt="Hanka - Makeup Artist"
            className="home-page__artist-image"
          />
        </div>
        <div className="home-page__content">
          <h1 className="home-page__headline">
            Rozzařte svou krásu s Glow by Hanka
          </h1>
          <p className="home-page__intro">
            Vítejte v mém světě krásy a elegance. Jsem profesionální vizážistka
            s vášní pro zdůraznění přirozené krásy každé ženy. Specializuji se
            na svatební líčení, slavnostní příležitosti a líčení pro focení. Mým
            cílem je, abyste se cítily sebevědomě a zářily ve svůj velký den.
          </p>
          <Button
            variant="primary"
            onClick={handlePortfolioClick}
            className="home-page__cta"
          >
            Prohlédnout Portfolio
          </Button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
