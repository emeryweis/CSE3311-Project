import nodemailer from 'nodemailer';

/**
 * Email Service for sending verification codes and notifications
 */

// Create a transporter (configured via environment variables or defaults to a test account)
const createTransporter = () => {
  // For production, use environment variables for SMTP configuration
  if (process.env['SMTP_HOST'] && process.env['SMTP_PORT'] && process.env['SMTP_USER'] && process.env['SMTP_PASS']) {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: parseInt(process.env['SMTP_PORT'] || '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  // For development, use a test account (Ethereal Email - https://ethereal.email)
  // This creates a test account automatically
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env['ETHEREAL_USER'] || 'ethereal.user@ethereal.email',
      pass: process.env['ETHEREAL_PASS'] || 'ethereal.pass',
    },
  });
};

/**
 * Send email verification code to user
 */
export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  username?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env['EMAIL_FROM'] || '"OutdoorSpot" <noreply@outdoorspot.com>',
      to: email,
      subject: 'Verify Your OutdoorSpot Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2D5016; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .code-box { background: #fff; border: 2px solid #2D5016; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .verification-code { font-size: 32px; font-weight: bold; color: #2D5016; letter-spacing: 8px; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>OutdoorSpot</h1>
              </div>
              <div class="content">
                <h2>Welcome to OutdoorSpot${username ? `, ${username}` : ''}!</h2>
                <p>Thank you for registering. To complete your account setup, please verify your email address using the code below:</p>
                
                <div class="code-box">
                  <div class="verification-code">${verificationCode}</div>
                  <p style="margin-top: 10px; font-size: 14px; color: #666;">This code will expire in 24 hours</p>
                </div>

                <p>Enter this code on the verification page to activate your account.</p>
                <p>If you didn't create an account with OutdoorSpot, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} OutdoorSpot. Built for CSE3311.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to OutdoorSpot${username ? `, ${username}` : ''}!

        Thank you for registering. To complete your account setup, please verify your email address using the code below:

        Verification Code: ${verificationCode}

        This code will expire in 24 hours.

        Enter this code on the verification page to activate your account.

        If you didn't create an account with OutdoorSpot, please ignore this email.

        ---
        This is an automated email. Please do not reply to this message.
        © ${new Date().getFullYear()} OutdoorSpot. Built for CSE3311.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development with Ethereal Email, log the preview URL
    if (process.env['NODE_ENV'] === 'development' && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Email sent! Preview URL:', previewUrl);
      }
    }

    return true;
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    // In development, don't fail if email can't be sent - log the code instead
    if (process.env['NODE_ENV'] === 'development') {
      console.warn('Email sending failed, but continuing in development mode');
      console.log('===========================================================');
      console.log('VERIFICATION CODE (Development Mode):');
      console.log(`   Email: ${email}`);
      console.log(`   Code:  ${verificationCode}`);
      console.log('===========================================================');
      return true; // Return true in development to not block registration
    }
    return false;
  }
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

