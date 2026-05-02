const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false // Chấp nhận các chứng chỉ TLS tự ký
      }
    });

    // Kiểm tra kết nối trước khi gửi
    await transporter.verify();
    
    console.log(`Sending email to ${email} with subject: ${subject}`);
    
    const mailOptions = {
      from: `"2NADH" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: subject,
      text: message,
      html: message // Sử dụng trực tiếp HTML từ tham số message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

module.exports = sendEmail;
