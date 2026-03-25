const nodemailer = require("nodemailer");

// Singleton transporter with aggressive timeouts to prevent the 3-minute hang
let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;
    _transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Aggressive timeouts — prevent hanging forever
        connectionTimeout: 10000,  // 10s to establish TCP connection
        greetingTimeout: 10000,    // 10s to receive SMTP greeting
        socketTimeout: 10000,      // 10s of inactivity on socket
    });
    return _transporter;
}

/**
 * Send an email with a hard 15-second overall timeout
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
async function sendEmail(to, subject, html) {
    const transporter = getTransporter();

    const sendPromise = transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
    });

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout after 15 seconds")), 15000)
    );

    await Promise.race([sendPromise, timeoutPromise]);
}

module.exports = sendEmail;
