import logging
from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_password_reset_otp_email(user, otp: str, expires_minutes: int = 10) -> tuple[bool, str | None]:
    """
    Sends a styled OTP verification email to the user via Django SMTP.
    Falls back gracefully if SMTP is unconfigured or encounters connection errors in dev.
    """
    subject = f"Your SkillForge Password Reset Code: {otp}"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@skillforge.io')
    recipient_list = [user.email]

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0d1117;
          color: #e6edf3;
          margin: 0;
          padding: 30px 15px;
        }}
        .container {{
          max-width: 520px;
          margin: 0 auto;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 32px;
        }}
        .logo {{
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 24px;
        }}
        .badge {{
          display: inline-block;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }}
        h2 {{
          color: #ffffff;
          font-size: 22px;
          margin: 0 0 12px 0;
        }}
        p {{
          color: #8b949e;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }}
        .otp-box {{
          background: #0d1117;
          border: 2px dashed #10b981;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        }}
        .otp-code {{
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #10b981;
          margin: 0;
        }}
        .footer {{
          border-top: 1px solid #21262d;
          padding-top: 20px;
          margin-top: 28px;
          font-size: 12px;
          color: #6e7681;
          line-height: 1.5;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          ⚡ SkillForge
        </div>
        <div class="badge">Security Verification</div>
        <h2>Password Reset Request</h2>
        <p>
          Hello, we received a request to reset the password for your SkillForge account (<strong>{user.email}</strong>).
        </p>
        <p>
          Please use the following 6-digit verification code to complete your password reset:
        </p>
        
        <div class="otp-box">
          <div class="otp-code">{otp}</div>
        </div>

        <p>
          This code is strictly valid for <strong>{expires_minutes} minutes</strong>. For security reasons, do not share this code with anyone.
        </p>
        
        <div class="footer">
          If you did not request this password reset, please ignore this email or reach out to support. Your account remains completely secure.
          <br><br>
          © 2026 SkillForge Inc. AI-Powered Adaptive Coding Platform.
        </div>
      </div>
    </body>
    </html>
    """

    plain_message = (
        f"SkillForge Password Reset\n\n"
        f"Hello, we received a request to reset your SkillForge password.\n\n"
        f"Your 6-digit OTP verification code is: {otp}\n\n"
        f"This code will expire in {expires_minutes} minutes.\n"
        f"If you did not request this, please safely ignore this email.\n\n"
        f"SkillForge Security Team"
    )

    try:
        # Check if SMTP user and app password are fully configured
        has_smtp_creds = bool(
            getattr(settings, 'EMAIL_HOST_USER', None) and 
            getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        )

        if not has_smtp_creds:
            logger.error("[SMTP Error] EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not configured.")
            return False, "SMTP credentials not configured."

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        return True, None
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        return False, str(e)
