import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Simple test response
  res.status(200).json({
    success: true,
    message: 'Test API endpoint is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    env_check: {
      has_mailerlite_key: !!process.env.MAILERLITE_API_KEY,
      has_group_id: !!process.env.MAILERLITE_GROUP_ID,
      node_version: process.version
    }
  });
} 