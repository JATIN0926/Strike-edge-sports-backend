export const orderPlacedTemplate = (name, orderId) => `
  <div style="font-family:Arial;padding:20px">
    <h2>🎉 Your Order is Confirmed!</h2>
    
    <p>Hi ${name || ""},</p>

    <p>Thank you for shopping with <b>Strike Edge Sports</b>.</p>

    <p>Your order <b>#${orderId}</b> has been successfully placed.</p>

    <p>You will receive SMS / Email updates about delivery status.</p>

    <h3>Need Help?</h3>

    <p>You can always WhatsApp us 👇</p>

    <a href="https://wa.me/${process.env.WHATSAPP_NUMBER}"
      style="background:#25D366;color:white;padding:10px 16px;
      text-decoration:none;border-radius:8px;font-weight:bold">
      Chat on WhatsApp
    </a>

    <br/><br/>

    <p>Best Regards,<br/>
    Strike Edge Sports Team</p>
  </div>
`;
