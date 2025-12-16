import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LiceniPage from "./pages/LiceniPage";
import UcesyPage from "./pages/UcesyPage";
import LiftingoveMasazePage from "./pages/LiftingoveMasazePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/admin/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/liceni" element={<LiceniPage />} />
            <Route path="/ucesy" element={<UcesyPage />} />
            <Route
              path="/liftingove-masaze"
              element={<LiftingoveMasazePage />}
            />
            <Route path="/o-mne" element={<AboutPage />} />
            <Route path="/kontakt" element={<ContactPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
