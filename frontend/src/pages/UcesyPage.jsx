import React, { useState, useEffect } from "react";
import { fetchCategories } from "../services/portfolioService";
import ImageGallery from "../components/ImageGallery";
import "./PortfolioPage.css";

function UcesyPage() {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoriesData = await fetchCategories("ucesy");
        if (categoriesData.length > 0) {
          setCategory(categoriesData[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCategory();
  }, []);

  if (loading) {
    return (
      <div className="portfolio-page">
        <div className="portfolio-loading">Načítání...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-page">
        <div className="portfolio-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <h1 className="portfolio-title">Účesy</h1>
      {category && (
        <div className="selected-category">
          <ImageGallery categoryId={category.id} />
        </div>
      )}
    </div>
  );
}

export default UcesyPage;
