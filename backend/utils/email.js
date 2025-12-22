import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'evg2000p@gmail.com',
        pass: 'jyal lsts ozil isop',
    },
});

export const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

    const mailOptions = {
        from: 'evg2000p@gmail.com',
        to: email,
        subject: 'Verify your email for Telega3',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Telega3!</h2>
                <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
                <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verify Email</a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't sign up for Telega3, please ignore this email.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};