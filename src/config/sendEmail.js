import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log('EMAIL CONFIG CHECK:', {
  user: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
  pass: process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing',
  passLength: process.env.EMAIL_PASS?.length
});

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateLimit: 5,
    connectionTimeout: 30000, 
    socketTimeout: 30000,     
    greetingTimeout: 30000,    
  });

  return transporter.sendMail({
    from: `"Strike Edge Sports" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};