import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: "SSLv3",
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateLimit: 5,
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter.sendMail({
    from: `"Strike Edge Sports" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
