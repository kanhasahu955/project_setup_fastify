export interface PasswordResetTemplateData {
	name: string;
	resetUrl: string;
	expiryMinutes?: number;
}

export function passwordResetTemplate(data: PasswordResetTemplateData): string {
	const { name, resetUrl, expiryMinutes = 30 } = data;

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Live Bhoomi</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Password Reset Request</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 22px; font-weight: 600;">Hi ${name},</h2>
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>${expiryMinutes} minutes</strong>.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 16px rgba(245, 87, 108, 0.4);">
                  Reset Password
                </a>
              </div>
              
              <p style="margin: 24px 0 16px; color: #718096; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link in your browser:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f7fafc; border-radius: 6px; word-break: break-all; font-size: 12px; color: #667eea;">
                ${resetUrl}
              </p>
              
              <div style="margin-top: 32px; padding: 16px; background-color: #fff5f5; border-radius: 8px; border-left: 4px solid #f5576c;">
                <p style="margin: 0; color: #c53030; font-size: 13px; line-height: 1.5;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                This is an automated email. Please do not reply.<br>
                &copy; ${new Date().getFullYear()} Live Bhoomi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
