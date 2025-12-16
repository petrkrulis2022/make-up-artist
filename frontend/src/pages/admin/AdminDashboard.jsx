import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ImageUpload from "../../components/ImageUpload";
import ImageManager from "../../components/ImageManager";
import { fetchCategories } from "../../services/portfolioService";
import axios from "axios";
import "./AdminDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [imageCounts, setImageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch categories
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);

      // Fetch image counts for each category
      const token = localStorage.getItem("token");
      const counts = {};

      for (const category of categoriesData) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/portfolio/images/${category.id}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

          if (response.data.success) {
            counts[category.id] = response.data.data.length;
          } else {
            counts[category.id] = 0;
          }
        } catch (err) {
          counts[category.id] = 0;
        }
      }

      setImageCounts(counts);
    } catch (err) {
      setError("Chyba při načítání dat dashboardu");
      console.error("Dashboard data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalImages = () => {
    return Object.values(imageCounts).reduce((sum, count) => sum + count, 0);
  };

  const handleUploadSuccess = (imageData) => {
    // Reload dashboard data to reflect the new image
    loadDashboardData();
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="admin-dashboard__welcome">
          <h2>Vítejte v administračním panelu</h2>
          <p>Zde můžete spravovat obrázky ve vašem portfoliu.</p>
        </div>

        {error && <div className="admin-dashboard__error">{error}</div>}

        {loading ? (
          <div className="admin-dashboard__loading">Načítání...</div>
        ) : (
          <>
            <div className="admin-dashboard__summary">
              <h3>Přehled obrázků</h3>
              <div className="admin-dashboard__stats">
                <div className="admin-dashboard__stat-card">
                  <div className="admin-dashboard__stat-value">
                    {getTotalImages()}
                  </div>
                  <div className="admin-dashboard__stat-label">
                    Celkem obrázků
                  </div>
                </div>

                {categories.map((category) => (
                  <div key={category.id} className="admin-dashboard__stat-card">
                    <div className="admin-dashboard__stat-value">
                      {imageCounts[category.id] || 0}
                    </div>
                    <div className="admin-dashboard__stat-label">
                      {category.name_cs}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-dashboard__upload-section">
              <ImageUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="admin-dashboard__management-section">
              <ImageManager />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
