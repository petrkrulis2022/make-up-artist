import React, { useState, useEffect } from "react";
import { fetchCategories } from "../services/portfolioService";
import Button from "../components/Button";
import ImageGallery from "../components/ImageGallery";
import "./PortfolioPage.css";

function LiceniPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoriesData = await fetchCategories("liceni");
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

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
      <h1 className="portfolio-title">Líčení</h1>
      <div className="category-filters">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={
              selectedCategory?.id === category.id ? "primary" : "secondary"
            }
            onClick={() => handleCategorySelect(category)}
            className="category-button"
          >
            {category.name_cs}
          </Button>
        ))}
      </div>
      {selectedCategory && (
        <div className="selected-category">
          <h2 className="category-name">{selectedCategory.name_cs}</h2>
          <ImageGallery categoryId={selectedCategory.id} />
        </div>
      )}
    </div>
  );
}

export default LiceniPage;
