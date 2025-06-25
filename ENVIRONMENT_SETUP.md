# Environment Variables Setup

For the MailerLite email subscription functionality to work, you need to set up the following environment variables in your Vercel deployment:

## Required Environment Variables

### MAILERLITE_API_KEY
- **Required**: Yes
- **Description**: Your MailerLite API key for authentication
- **How to get**: 
  1. Go to [MailerLite Dashboard](https://dashboard.mailerlite.com/integrations/api)
  2. Navigate to Integrations → API
  3. Generate a new API key
- **Example**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...`

### MAILERLITE_GROUP_ID
- **Required**: No (optional)
- **Description**: Specific group ID to add subscribers to
- **How to get**: 
  1. Go to [MailerLite Groups](https://dashboard.mailerlite.com/subscribers/groups)
  2. Navigate to Subscribers → Groups
  3. Copy the group ID from the URL or group settings
- **Example**: `123456789`

## Setting up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the variables:
   - `MAILERLITE_API_KEY` = your actual API key
   - `MAILERLITE_GROUP_ID` = your group ID (optional)

## Local Development

For local development, create a `.env.local` file in your project root:

```env
MAILERLITE_API_KEY=your_mailerlite_api_key_here
MAILERLITE_GROUP_ID=your_group_id_here
```

Make sure to add `.env.local` to your `.gitignore` file to avoid committing sensitive data.

## Testing the API

Once deployed, you can test the subscription endpoint:

```bash
curl -X POST https://your-vercel-app.vercel.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected responses:
- Success: `{"success":true,"message":"We'll be in touch!"}`
- Error: `{"success":false,"error":"Error message here"}` 