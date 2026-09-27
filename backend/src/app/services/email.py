import resend 

from app.config.config import settings 

resend.api_key = settings.resend_api_key

async def send_mail(user_email: str, code: str):
    params: resend.Emails.SendParams = {
        "from": "FitnessDashboard <onboarding@resend.dev>",
        "to": [user_email],
        "subject": "FitnessDashboard Password Reset Code",
        "html": 
        f"""
            <h1>Password reset</h1>
            <strong>{code}</strong>
            <p>This code will expire in 10 minutes.</p>
        """,
    }
    email = await resend.Emails.send_async(params)
    return email