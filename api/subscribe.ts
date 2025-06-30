import type { VercelRequest, VercelResponse } from '@vercel/node';

// TypeScript interfaces for MailerLite API
interface SubscribeRequestBody {
  email: string;
}

interface MailerLiteSubscriber {
  email: string;
  groups?: string[];
}

interface MailerLiteApiResponse {
  data?: {
    id: string;
    email: string;
    status: string;
  };
  message?: string;
  errors?: {
    email?: string[];
    [key: string]: string[] | undefined;
  };
}

interface FunctionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CORS headers for frontend integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    const response: FunctionResponse = {
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.',
    };
    res.status(405).json(response);
    return;
  }

  try {
    // Validate environment variables
    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
      console.error('MAILERLITE_API_KEY environment variable is not set');
      const response: FunctionResponse = {
        success: false,
        error: 'Server configuration error. Please try again later.',
      };
      res.status(500).json(response);
      return;
    }

    // Parse and validate request body
    const body = req.body as SubscribeRequestBody;
    
    if (!body || typeof body !== 'object') {
      const response: FunctionResponse = {
        success: false,
        error: 'Invalid request format. Please provide a valid email.',
      };
      res.status(400).json(response);
      return;
    }

    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      const response: FunctionResponse = {
        success: false,
        error: 'Email is required.',
      };
      res.status(400).json(response);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      const response: FunctionResponse = {
        success: false,
        error: 'Please provide a valid email address.',
      };
      res.status(400).json(response);
      return;
    }

    // Prepare MailerLite subscriber data
    const subscriberData: MailerLiteSubscriber = {
      email: trimmedEmail,
    };

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

    const responseData: MailerLiteApiResponse = await mailerLiteResponse.json();

    // Handle MailerLite API responses
    if (mailerLiteResponse.ok) {
      // Success - subscriber added or already exists
      const response: FunctionResponse = {
        success: true,
        message: "We'll be in touch!",
      };
      res.status(200).json(response);
      return;
    }

    // Handle specific MailerLite errors
    if (mailerLiteResponse.status === 422) {
      // Validation errors from MailerLite
      if (responseData.errors?.email?.includes('The email has already been taken.')) {
        const response: FunctionResponse = {
          success: true,
          message: "We'll be in touch!",
        };
        res.status(200).json(response);
        return;
      }
      
      const response: FunctionResponse = {
        success: false,
        error: 'Please provide a valid email address.',
      };
      res.status(400).json(response);
      return;
    }

    if (mailerLiteResponse.status === 401) {
      console.error('MailerLite API authentication failed');
      const response: FunctionResponse = {
        success: false,
        error: 'Server configuration error. Please try again later.',
      };
      res.status(500).json(response);
      return;
    }

    if (mailerLiteResponse.status === 429) {
      console.error('MailerLite API rate limit exceeded');
      const response: FunctionResponse = {
        success: false,
        error: 'Too many requests. Please try again in a few minutes.',
      };
      res.status(429).json(response);
      return;
    }

    // Generic MailerLite API error
    console.error('MailerLite API error:', {
      status: mailerLiteResponse.status,
      statusText: mailerLiteResponse.statusText,
      response: responseData,
    });

    const response: FunctionResponse = {
      success: false,
      error: 'Uh oh something went wrong, try again!',
    };
    res.status(500).json(response);

  } catch (error) {
    // Handle network failures and other unexpected errors
    console.error('Subscription error:', error);

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const response: FunctionResponse = {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
      res.status(503).json(response);
      return;
    }

    // Generic error fallback
    const response: FunctionResponse = {
      success: false,
      error: 'Uh oh something went wrong, try again!',
    };
    res.status(500).json(response);
  }
} 