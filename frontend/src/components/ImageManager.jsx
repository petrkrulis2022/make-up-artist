import React, { useState, useEffect } from "react";
import Button from "./Button";
import {
  fetchAllImages,
  fetchCategories,
  deleteImage,
} from "../services/portfolioService";
import "./ImageManager.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ImageManager = () => {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch categories and images in parallel
      const [categoriesData, imagesData] = await Promise.all([
        fetchCategories(),
        fetchAllImages(),
      ]);

      setCategories(categoriesData);
      setImages(imagesData);
    } catch (err) {
      setError(err.message || "Chyba při načítání dat");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name_cs : "Neznámá kategorie";
  };

  const getImageUrl = (image) => {
    // Construct the full URL for the image
    return `${API_BASE_URL.replace("/api", "")}/${image.file_path}`;
  };

  const handleDeleteClick = (image) => {
    setDeleteConfirm(image);
    setSuccessMessage("");
    setError("");
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      await deleteImage(deleteConfirm.id);

      // Remove image from UI immediately
      setImages((prevImages) =>
        prevImages.filter((img) => img.id !== deleteConfirm.id)
      );

      setSuccessMessage("Obrázek byl úspěšně smazán");
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "Mazání obrázku selhalo");
      console.error("Error deleting image:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Group images by category
  const imagesByCategory = categories.map((category) => ({
    category,
    images: images.filter((img) => img.category_id === category.id),
  }));

  if (loading) {
    return (
      <div className="image-manager">
        <div className="image-manager__loading">Načítání obrázků...</div>
      </div>
    );
  }

  return (
    <div className="image-manager">
      <h3 className="image-manager__title">Správa obrázků</h3>

      {error && (
        <div className="image-manager__error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="image-manager__success" role="alert">
          {successMessage}
        </div>
      )}

      {images.length === 0 ? (
        <div className="image-manager__empty">Žádné obrázky k zobrazení</div>
      ) : (
        <div className="image-manager__categories">
          {imagesByCategory.map(({ category, images: categoryImages }) => (
            <div key={category.id} className="image-manager__category">
              <h4 className="image-manager__category-title">
                {category.name_cs} ({categoryImages.length})
              </h4>

              {categoryImages.length === 0 ? (
                <p className="image-manager__category-empty">
                  Žádné obrázky v této kategorii
                </p>
              ) : (
                <div className="image-manager__grid">
                  {categoryImages.map((image) => (
                    <div key={image.id} className="image-manager__item">
                      <div className="image-manager__thumbnail">
                        <img
                          src={getImageUrl(image)}
                          alt={image.original_filename}
                          className="image-manager__image"
                        />
                      </div>
                      <div className="image-manager__info">
                        <p
                          className="image-manager__filename"
                          title={image.original_filename}
                        >
                          {image.original_filename}
                        </p>
                        <p className="image-manager__category-name">
                          {getCategoryName(image.category_id)}
                        </p>
                      </div>
                      <div className="image-manager__actions">
                        <Button
                          variant="secondary"
                          onClick={() => handleDeleteClick(image)}
                          disabled={deleting}
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="image-manager__modal-overlay">
          <div className="image-manager__modal">
            <h4 className="image-manager__modal-title">Potvrdit smazání</h4>
            <p className="image-manager__modal-text">
              Opravdu chcete smazat obrázek "{deleteConfirm.original_filename}"?
            </p>
            <div className="image-manager__modal-actions">
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Mazání..." : "Ano, smazat"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Zrušit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManager;
