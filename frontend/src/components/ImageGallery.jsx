import React, { useState, useEffect } from "react";
import { fetchImagesByCategory } from "../services/portfolioService";
import "./ImageGallery.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BACKEND_URL = API_BASE_URL.replace("/api", "");

function ImageGallery({ categoryId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const imagesData = await fetchImagesByCategory(categoryId);
        setImages(imagesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadImages();
    }
  }, [categoryId]);

  if (loading) {
    return <div className="gallery-loading">Načítání obrázků...</div>;
  }

  if (error) {
    return <div className="gallery-error">{error}</div>;
  }

  if (images.length === 0) {
    return <div className="gallery-empty">Žádné obrázky</div>;
  }

  return (
    <div className="image-gallery">
      {images.map((image) => (
        <div key={image.id} className="gallery-item">
          <img
            src={`${BACKEND_URL}${image.file_path}`}
            alt={image.original_filename}
            className="gallery-image"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export default ImageGallery;
