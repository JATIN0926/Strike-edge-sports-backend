import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

// Set API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log('📧 SENDGRID CONFIG CHECK:', {
  apiKey: process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing',
  keyLength: process.env.SENDGRID_API_KEY?.length,
  from: process.env.SENDGRID_FROM_EMAIL ? '✅ Set' : '❌ Missing',
});

export const sendEmail = async ({ to, subject, html }) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // Verified email
    subject,
    html,
  };

  return sgMail.send(msg);
};