import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email',
        html: `
            <h1>Welcome to Telega3</h1>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>If you did not sign up, ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};