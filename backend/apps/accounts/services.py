import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.conf import settings

logger = logging.getLogger(__name__)


def get_smtp_config() -> dict:
    """
    Dynamically extracts SMTP credentials and settings from Django settings
    and environment variables with extensive alias handling and sanitization.
    """
    user = (
        getattr(settings, 'EMAIL_HOST_USER', '') or
        os.getenv('EMAIL_HOST_USER', '') or
        os.getenv('EMAIL_USER', '') or
        os.getenv('email_user', '') or
        os.getenv('GMAIL_USER', '')
    ).strip().strip('"\'')

    password = (
        getattr(settings, 'EMAIL_HOST_PASSWORD', '') or
        os.getenv('EMAIL_HOST_PASSWORD', '') or
        os.getenv('EMAIL_PASSWORD', '') or
        os.getenv('email_password', '') or
        os.getenv('GMAIL_APP_PASSWORD', '') or
        os.getenv('GMAIL_PASSWORD', '')
    ).replace(' ', '').strip().strip('"\'')

    host = (
        getattr(settings, 'EMAIL_HOST', '') or
        os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    ).strip().strip('"\'') or 'smtp.gmail.com'

    raw_port = getattr(settings, 'EMAIL_PORT', 587) or os.getenv('EMAIL_PORT', 587)
    try:
        port = int(str(raw_port).strip().strip('"\''))
    except (ValueError, TypeError):
        port = 587

    use_tls = getattr(settings, 'EMAIL_USE_TLS', True)
    use_ssl = getattr(settings, 'EMAIL_USE_SSL', False)
    timeout = getattr(settings, 'EMAIL_TIMEOUT', 15) or 15

    from_email = (
        getattr(settings, 'DEFAULT_FROM_EMAIL', '') or
        os.getenv('DEFAULT_FROM_EMAIL', '') or
        (f"SkillForge Team <{user}>" if user else "SkillForge Team <noreply@skillforge.io>")
    ).strip().strip('"\'')

    return {
        'user': user,
        'password': password,
        'host': host,
        'port': port,
        'use_tls': use_tls,
        'use_ssl': use_ssl,
        'timeout': timeout,
        'from_email': from_email,
    }


def send_password_reset_otp_email(user, otp: str, expires_minutes: int = 10) -> tuple[bool, str | None]:
    """
    Sends a styled OTP verification email to the user via SMTP.
    Returns (True, None) on success, or (False, error_details) on failure.
    """
    config = get_smtp_config()
    user_email = user.email

    if not config['user'] or not config['password']:
        err_msg = (
            "SMTP Configuration Error: EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is not set. "
            "Please configure EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your environment variables."
        )
        logger.error(f"[SMTP Error] {err_msg}")
        return False, err_msg

    subject = f"Your SkillForge Password Reset Code: {otp}"
    recipient_list = [user_email]

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
          Hello, we received a request to reset the password for your SkillForge account (<strong>{user_email}</strong>).
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
        # Build MIME message with alternative parts
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = config['from_email']
        msg['To'] = user_email
        msg.attach(MIMEText(plain_message, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_message, 'html', 'utf-8'))

        # Establish connection with configured timeout
        if config['use_ssl'] or config['port'] == 465:
            server = smtplib.SMTP_SSL(config['host'], config['port'], timeout=config['timeout'])
        else:
            server = smtplib.SMTP(config['host'], config['port'], timeout=config['timeout'])
            if config['use_tls']:
                server.starttls()

        server.login(config['user'], config['password'])
        server.sendmail(config['user'], recipient_list, msg.as_string())
        server.quit()

        logger.info(f"Successfully sent password reset OTP email to {user_email}")
        return True, None

    except smtplib.SMTPAuthenticationError as e:
        err_msg = (
            "Gmail SMTP Authentication Failed: Username or App Password rejected by Gmail. "
            "Please ensure you are using a 16-character Google App Password (generated at myaccount.google.com/apppasswords) "
            "and that EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are set correctly in your environment variables."
        )
        logger.error(f"[SMTP Auth Error] {e}")
        return False, err_msg

    except (smtplib.SMTPConnectError, TimeoutError, OSError) as e:
        err_msg = f"SMTP Connection Failed: Unable to connect to {config['host']}:{config['port']}. Details: {e}"
        logger.error(f"[SMTP Connect Error] {err_msg}")
        return False, err_msg

    except Exception as e:
        err_msg = f"Failed to send email via SMTP: {str(e)}"
        logger.error(f"[SMTP General Error] {err_msg}")
        return False, err_msg
