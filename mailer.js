// mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

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

const sendAdminNotification = async (complaint) => {
  const message = `📋 Title: ${complaint.title}
📄 Description: ${complaint.description}
🏢 Department: ${complaint.department}
⚠️ Priority: ${complaint.priority}
📅 Submitted At: ${new Date().toLocaleString()}

Please log in to SCMS to review it.`;

  await sendMail(process.env.ADMIN_EMAIL, "📣 New Complaint from User", message);
};

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

const sendUserUpdateEmail = async (email, complaint) => {
  const message = `Hi,

Your complaint has been updated. Here are the latest details:

📋 Title: ${complaint.title}
📄 Description: ${complaint.description}
🏢 Department: ${complaint.department}
⚠️ Priority: ${complaint.priority}
📅 Submitted At: ${complaint.createdAt || new Date().toLocaleString()}

Please log in to SCMS to view more details.

Thank you,
Smart Complaint Management System`;

  await sendMail(email, "✏️ Complaint Updated", message);
};

const sendAdminUpdateNotification = async (complaint) => {
  const userEmail = complaint.user?.email || complaint.userEmail || 'Unknown user';
  
  const message = `⚠️ Complaint Updated

📋 Title: ${complaint.title}
📄 Description: ${complaint.description}
🏢 Department: ${complaint.department}
⚠️ Priority: ${complaint.priority}
📅 Submitted At: ${complaint.createdAt || new Date().toLocaleString()}
👤 User: ${userEmail}

Please log in to SCMS to review the updated complaint.`;

  await sendMail(process.env.ADMIN_EMAIL, "✏️ Complaint Updated", message);
};

const sendAssigneeNotification = async (email, complaint) => {
    const message = `Hi,

A new complaint has been assigned to you. Here are the details:

📋 Title: ${complaint.title}
📄 Description: ${complaint.description}
🏢 Department: ${complaint.department}
⚠️ Priority: ${complaint.priority}

Please log in to SCMS to review it.

Thank you,
Smart Complaint Management System`;

    await sendMail(email, "📣 New Complaint Assigned to You", message);
};

module.exports = {
  sendUserConfirmationEmail,
  sendAdminNotification,
  sendUserUpdateEmail,
  sendAdminUpdateNotification,
  sendAssigneeNotification,
};
