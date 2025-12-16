import React, { useState, useEffect } from "react";
import Button from "./Button";
import { fetchCategories, uploadImage } from "../services/portfolioService";
import "./ImageUpload.css";

const ImageUpload = ({ onUploadSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Cleanup preview URL when component unmounts or file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    } catch (error) {
      setErrors({ general: "Chyba při načítání kategorií" });
    }
  };

  const validateFile = (file) => {
    const validationErrors = {};

    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      validationErrors.file =
        "Neplatný typ souboru. Povolené formáty: JPG, JPEG, PNG, WEBP";
      return validationErrors;
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      validationErrors.file =
        "Soubor je příliš velký. Maximální velikost je 5MB";
      return validationErrors;
    }

    return validationErrors;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setErrors({});

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file
    const validationErrors = validateFile(file);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSelectedFile(null);
      setPreviewUrl(null);
      e.target.value = ""; // Reset file input
      return;
    }

    // Set file and create preview
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setErrors((prev) => ({ ...prev, category: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    // Validate form
    const validationErrors = {};
    if (!selectedCategory) {
      validationErrors.category = "Vyberte kategorii";
    }
    if (!selectedFile) {
      validationErrors.file = "Vyberte obrázek";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Upload image
    setLoading(true);
    setUploadProgress(0);

    try {
      const response = await uploadImage(
        selectedFile,
        selectedCategory,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Show success message
      setSuccessMessage(response.message || "Obrázek byl úspěšně nahrán");

      // Reset form
      handleReset();

      // Call parent handler if provided
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      setErrors({ general: error.message || "Nahrávání obrázku selhalo" });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedCategory("");
    setErrors({});
    setSuccessMessage("");
    setUploadProgress(0);

    // Reset file input
    const fileInput = document.getElementById("file");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="image-upload">
      <h3 className="image-upload__title">Nahrát nový obrázek</h3>

      <form onSubmit={handleSubmit} className="image-upload__form">
        {/* Category Selection */}
        <div className="image-upload__field">
          <label htmlFor="category" className="image-upload__label">
            Kategorie <span className="image-upload__required">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className={`image-upload__select ${
              errors.category ? "image-upload__select--error" : ""
            }`}
          >
            <option value="">Vyberte kategorii</option>
            <optgroup label="Líčení">
              {categories
                .filter((c) => c.parent_section === "liceni")
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_cs}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Účesy">
              {categories
                .filter((c) => c.parent_section === "ucesy")
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_cs}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Liftingové masáže">
              {categories
                .filter((c) => c.parent_section === "liftingove-masaze")
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_cs}
                  </option>
                ))}
            </optgroup>
          </select>
          {errors.category && (
            <span className="image-upload__error" role="alert">
              {errors.category}
            </span>
          )}
        </div>

        {/* File Input */}
        <div className="image-upload__field">
          <label htmlFor="file" className="image-upload__label">
            Obrázek <span className="image-upload__required">*</span>
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className={`image-upload__file-input ${
              errors.file ? "image-upload__file-input--error" : ""
            }`}
          />
          <div className="image-upload__file-info">
            Povolené formáty: JPG, JPEG, PNG, WEBP (max. 5MB)
          </div>
          {errors.file && (
            <span className="image-upload__error" role="alert">
              {errors.file}
            </span>
          )}
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="image-upload__preview">
            <p className="image-upload__preview-label">Náhled:</p>
            <img
              src={previewUrl}
              alt="Náhled obrázku"
              className="image-upload__preview-image"
            />
            <p className="image-upload__preview-filename">
              {selectedFile?.name}
            </p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="image-upload__success" role="alert">
            {successMessage}
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div
            className="image-upload__error image-upload__error--general"
            role="alert"
          >
            {errors.general}
          </div>
        )}

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="image-upload__progress">
            <div className="image-upload__progress-bar">
              <div
                className="image-upload__progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="image-upload__progress-text">
              {uploadProgress}%
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="image-upload__actions">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Nahrávání..." : "Nahrát obrázek"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Zrušit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ImageUpload;
