import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


export const sendEmail = async ({ to, subject, html }) => {
  const msg = {
    to,
    from: `Strike Edge Sports <${process.env.SENDGRID_FROM_EMAIL}>`,
    replyTo: process.env.SENDGRID_REPLY_EMAIL,
    subject,
    html,
  };

  return sgMail.send(msg);
};