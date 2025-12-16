import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Fetch all categories from the backend
 * @param {string} parentSection - Optional parent section to filter by
 * @returns {Promise<Array>} Array of category objects
 * @throws {Error} If the API call fails
 */
export const fetchCategories = async (parentSection = null) => {
  try {
    let url = `${API_BASE_URL}/portfolio/categories`;
    if (parentSection) {
      url += `?parent_section=${parentSection}`;
    }
    const response = await axios.get(url);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.error?.message || "Chyba při načítání kategorií"
      );
    }
  } catch (error) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error("Chyba při načítání kategorií");
  }
};

/**
 * Fetch images for a specific category from the backend
 * @param {number} categoryId - The ID of the category
 * @returns {Promise<Array>} Array of image objects
 * @throws {Error} If the API call fails
 */
export const fetchImagesByCategory = async (categoryId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/portfolio/images/${categoryId}`
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.error?.message || "Chyba při načítání obrázků"
      );
    }
  } catch (error) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error("Chyba při načítání obrázků");
  }
};

/**
 * Upload an image to a specific category
 * @param {File} file - The image file to upload
 * @param {number} categoryId - The ID of the category
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<Object>} The created image object
 * @throws {Error} If the API call fails
 */
export const uploadImage = async (file, categoryId, onProgress) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Nejste přihlášeni");
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("categoryId", categoryId);

    const response = await axios.post(
      `${API_BASE_URL}/admin/images`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(
        response.data.error?.message || "Chyba při nahrávání obrázku"
      );
    }
  } catch (error) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error("Chyba při nahrávání obrázku");
  }
};

/**
 * Fetch all images (admin only)
 * @returns {Promise<Array>} Array of all image objects
 * @throws {Error} If the API call fails
 */
export const fetchAllImages = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Nejste přihlášeni");
    }

    const response = await axios.get(`${API_BASE_URL}/admin/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.error?.message || "Chyba při načítání obrázků"
      );
    }
  } catch (error) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error("Chyba při načítání obrázků");
  }
};

/**
 * Delete an image (admin only)
 * @param {number} imageId - The ID of the image to delete
 * @returns {Promise<Object>} Success response
 * @throws {Error} If the API call fails
 */
export const deleteImage = async (imageId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Nejste přihlášeni");
    }

    const response = await axios.delete(
      `${API_BASE_URL}/admin/images/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(
        response.data.error?.message || "Chyba při mazání obrázku"
      );
    }
  } catch (error) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error("Chyba při mazání obrázku");
  }
};
