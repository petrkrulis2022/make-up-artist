import React, { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import axios from "axios";
import "./ContactPage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [submitMessage, setSubmitMessage] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Jméno je povinné";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email je povinný";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Neplatný formát emailu";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Zpráva je povinná";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear submit status when user starts editing
    if (submitStatus) {
      setSubmitStatus(null);
      setSubmitMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/contact`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      if (response.data.success) {
        setSubmitStatus("success");
        setSubmitMessage(
          response.data.data.message || "Zpráva byla úspěšně odeslána"
        );
        // Clear form after successful submission
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      }
    } catch (error) {
      setSubmitStatus("error");
      if (error.response?.data?.error?.message) {
        setSubmitMessage(error.response.data.error.message);
      } else {
        setSubmitMessage(
          "Nepodařilo se odeslat zprávu. Zkuste to prosím později."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <h1>Kontakt</h1>
      <p className="contact-page__intro">
        Máte zájem o profesionální líčení nebo kurzy? Neváhejte mě kontaktovat!
        Ráda odpovím na všechny vaše dotazy a domluvím si s vámi termín.
      </p>

      <div className="contact-page__content">
        <div className="contact-page__info">
          <h2>Kontaktní informace</h2>
          <div className="contact-page__info-item">
            <strong>Email:</strong>{" "}
            <a href="mailto:hanka@vizazistka-teplice.cz">
              hanka@vizazistka-teplice.cz
            </a>
          </div>
          <div className="contact-page__info-item">
            <strong>Telefon:</strong>{" "}
            <a href="tel:+420739030701">+420 739 030 701</a>
          </div>
          <div className="contact-page__info-item">
            <strong>Web:</strong>{" "}
            <a
              href="https://www.vizazistka-teplice.cz"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.vizazistka-teplice.cz
            </a>
          </div>
          <div className="contact-page__info-item">
            <strong>Adresa:</strong> Teplice, Česká republika
          </div>
        </div>

        <div className="contact-page__form">
          <h2>Kontaktní formulář</h2>
          <form onSubmit={handleSubmit}>
            <Input
              label="Jméno"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="Vaše jméno"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="vas@email.cz"
            />

            <Input
              label="Zpráva"
              name="message"
              value={formData.message}
              onChange={handleChange}
              error={errors.message}
              required
              multiline
              rows={6}
              placeholder="Vaše zpráva..."
            />

            {submitStatus === "success" && (
              <div className="contact-page__message contact-page__message--success">
                {submitMessage}
              </div>
            )}

            {submitStatus === "error" && (
              <div className="contact-page__message contact-page__message--error">
                {submitMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? "Odesílání..." : "Odeslat zprávu"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
