export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.MAILERLITE_API_KEY;
    const groupId = process.env.MAILERLITE_GROUP_ID;

    // Debug response
    res.status(200).json({
      success: true,
      debug: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
        hasGroupId: !!groupId,
        groupId: groupId || 'none',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        hasEnvVars: !!process.env,
        errorType: error.constructor.name
      }
    });
  }
} 