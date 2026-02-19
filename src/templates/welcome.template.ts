export interface WelcomeTemplateData {
    name: string;
    email: string;
    loginUrl?: string;
  }
  
  export function welcomeTemplate(data: WelcomeTemplateData): string {
    const { name, email, loginUrl = "#" } = data;
  
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Live Bhoomi</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
            <!-- Header -->
            <tr>
              <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to Live Bhoomi!</h1>
                <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Your journey to finding the perfect property starts here</p>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px; font-weight: 600;">Hi ${name}! 👋</h2>
                <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                  Thank you for joining <strong>Live Bhoomi</strong>! We're thrilled to have you on board. Your account has been successfully created.
                </p>
                
                <!-- Account Info Box -->
                <div style="background: linear-gradient(135deg, #f6f8fb 0%, #eef1f6 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h3 style="margin: 0 0 16px; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Account Details</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #718096; font-size: 14px;">Email:</td>
                      <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #718096; font-size: 14px;">Registered:</td>
                      <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px; font-weight: 500;">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Features Section -->
                <h3 style="margin: 32px 0 16px; color: #1a1a2e; font-size: 18px; font-weight: 600;">What you can do:</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; width: 32px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #667eea; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 12px;">✓</span>
                    </td>
                    <td style="padding: 12px 0; padding-left: 12px; color: #4a5568; font-size: 15px;">Browse thousands of verified properties</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; width: 32px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #667eea; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 12px;">✓</span>
                    </td>
                    <td style="padding: 12px 0; padding-left: 12px; color: #4a5568; font-size: 15px;">Connect directly with property owners & agents</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; vertical-align: top; width: 32px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #667eea; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 12px;">✓</span>
                    </td>
                    <td style="padding: 12px 0; padding-left: 12px; color: #4a5568; font-size: 15px;">List your own properties for sale or rent</td>
                  </tr>
                </table>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 36px 0 24px;">
                  <a href="${loginUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);">
                    Explore Properties
                  </a>
                </div>
                
                <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                  Need help? Just reply to this email or contact our support team.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px; color: #718096; font-size: 13px; text-align: center;">
                  Follow us for updates and property tips
                </p>
                <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                  &copy; ${new Date().getFullYear()} Live Bhoomi. All rights reserved.<br>
                  <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> • <a href="#" style="color: #667eea; text-decoration: none;">Terms of Service</a>
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
  