// Simple JavaScript API function for MailerLite subscription
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.',
    });
    return;
  }

  try {
    // Validate environment variables
    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
      console.error('MAILERLITE_API_KEY environment variable is not set');
      res.status(500).json({
        success: false,
        error: 'Server configuration error. Please try again later.',
      });
      return;
    }

    // Parse and validate request body
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email is required.',
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
      return;
    }

    // Prepare MailerLite subscriber data
    const subscriberData = { email: trimmedEmail };

    // Add group ID if provided
    const groupId = process.env.MAILERLITE_GROUP_ID;
    if (groupId) {
      subscriberData.groups = [groupId];
    }

    // Make request to MailerLite API
    const mailerLiteResponse = await fetch(
      'https://connect.mailerlite.com/api/subscribers',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(subscriberData),
      }
    );

    const responseData = await mailerLiteResponse.json();

    // Handle MailerLite API responses
    if (mailerLiteResponse.ok) {
      // Success - subscriber added or already exists
      res.status(200).json({
        success: true,
        message: "We'll be in touch!",
      });
      return;
    }

    // Handle specific MailerLite errors
    if (mailerLiteResponse.status === 422) {
      // Check if email already exists
      if (responseData.errors?.email?.includes('The email has already been taken.')) {
        res.status(200).json({
          success: true,
          message: "We'll be in touch!",
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
      return;
    }

    if (mailerLiteResponse.status === 401) {
      console.error('MailerLite API authentication failed');
      res.status(500).json({
        success: false,
        error: 'Server configuration error. Please try again later.',
      });
      return;
    }

    if (mailerLiteResponse.status === 429) {
      console.error('MailerLite API rate limit exceeded');
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again in a few minutes.',
      });
      return;
    }

    // Generic MailerLite API error
    console.error('MailerLite API error:', {
      status: mailerLiteResponse.status,
      statusText: mailerLiteResponse.statusText,
      response: responseData,
    });

    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again!',
    });

  } catch (error) {
    console.error('Subscription error:', error);

    // Check if it's a network error
    if (error.message && error.message.includes('fetch')) {
      res.status(503).json({
        success: false,
        error: 'Network error. Please check your connection and try again.',
      });
      return;
    }

    // Generic error fallback
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again!',
    });
  }
} 