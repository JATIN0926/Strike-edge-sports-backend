import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,            
    secure: true,         
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },

    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateLimit: 5,
    connectionTimeout: 20000, 
    socketTimeout: 20000,
  });

  return transporter.sendMail({
    from: `"Strike Edge Sports" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
