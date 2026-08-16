const nodemailer = require('nodemailer');

// Reuse ethereal account if possible, or create a new one on the fly.
// Normally you'd store these in .env
let transporter = null;

async function initTransporter() {
  if (transporter) return transporter;
  
  // Use Ethereal for testing
  let testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  return transporter;
}

exports.sendOTPEmail = async (toEmail, otpCode) => {
  try {
    const tp = await initTransporter();

    let info = await tp.sendMail({
      from: '"DictaFlow Auth" <no-reply@dictaflow.com>',
      to: toEmail,
      subject: "Mã xác nhận tài khoản DictaFlow",
      text: `Mã OTP của bạn là: ${otpCode}. Mã này có hiệu lực trong 5 phút.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #525fe1; text-align: center;">Xác minh tài khoản</h2>
          <p>Chào bạn,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>DictaFlow</strong>.</p>
          <p>Dưới đây là mã xác nhận (OTP) của bạn để hoàn tất quá trình đăng ký:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
          <br/>
          <p>Trân trọng,<br/>Đội ngũ DictaFlow</p>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is important for testing!
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return nodemailer.getTestMessageUrl(info);
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error('Lỗi khi gửi email xác nhận');
  }
};
