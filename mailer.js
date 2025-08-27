// mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config(); // Ensure env variables are loaded

// Setup transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generic mail sending function
const sendMail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_MAIL,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

// Send email to admin
const sendAdminNotification = async (complaint) => {
  const message = `📋 Title: ${complaint.title}
📄 Description: ${complaint.description}
🏢 Department: ${complaint.department}
⚠️ Priority: ${complaint.priority}
📅 Submitted At: ${new Date().toLocaleString()}

Please log in to SCMS to review it.`;

  await sendMail(process.env.ADMIN_EMAIL, "📣 New Complaint from User", message);
};

// Send confirmation email to user
const sendUserConfirmationEmail = async (email, complaint) => {
  const message = `Hi,

Your complaint has been submitted successfully. Here are the details:

📋 Title: ${complaint.title}
📄 Description: ${complaint.description}
🏢 Department: ${complaint.department}
⚠️ Priority: ${complaint.priority}
📅 Submitted At: ${new Date().toLocaleString()}

We will get back to you shortly.

Thank you,
Smart Complaint Management System`;

  await sendMail(email, "✅ Complaint Submitted Successfully", message);
};

module.exports = {
  sendUserConfirmationEmail,
  sendAdminNotification,
};
