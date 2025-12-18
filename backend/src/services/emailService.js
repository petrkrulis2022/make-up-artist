import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Create and configure nodemailer transporter
 */
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || "465");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

/**
 * Send contact form email
 * @param {string} name - Sender's name
 * @param {string} email - Sender's email address
 * @param {string} message - Message content
 * @returns {Promise<void>}
 * @throws {Error} If email sending fails
 */
export const sendContactEmail = async (name, email, message) => {
  try {
    const transporter = createTransporter();

    // Format email content
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_FROM, // Send to configured contact email
      replyTo: email, // Allow replying directly to the sender
      subject: `Nová zpráva z kontaktního formuláře od ${name}`,
      text: `
Jméno: ${name}
Email: ${email}

Zpráva:
${message}
      `.trim(),
      html: `
        <h2>Nová zpráva z kontaktního formuláře</h2>
        <p><strong>Jméno:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3>Zpráva:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw error; // Throw the original error for better debugging
  }
};

/**
 * Verify SMTP connection (useful for testing configuration)
 * @returns {Promise<boolean>}
 */
export const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection verification failed:", error.message);
    return false;
  }
};
