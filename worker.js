// MCG SumUp Payment Worker for Cloudflare
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Parse the URL
    const url = new URL(request.url);
    
    // Handle create-checkout endpoint
    if (url.pathname === '/api/create-checkout' && request.method === 'POST') {
      try {
        // Get request body
        const body = await request.json();
        const { amount, reference, description } = body;

        // Validate input
        if (!amount || !reference || !description) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: amount, reference, description'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        // SumUp API configuration
        const sumupApiUrl = 'https://api.sumup.com/v0.1/checkouts';
        
        // Get SumUp credentials from environment variables
        const clientId = env.SUMUP_CLIENT_ID;
        const clientSecret = env.SUMUP_CLIENT_SECRET;
        const merchantCode = env.SUMUP_MERCHANT_CODE;
        
        if (!clientId || !clientSecret || !merchantCode) {
          // For testing - return a mock response
          console.log('SumUp credentials not configured, returning mock response');
          return new Response(JSON.stringify({
            checkout_id: `MOCK_${Date.now()}`,
            status: 'created',
            amount: amount,
            currency: 'GBP',
            merchant_code: 'mock_merchant',
            description: description,
            return_url: `${url.origin}/payment-return`,
            date: new Date().toISOString()
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        // First, get an access token
        const tokenResponse = await fetch('https://api.sumup.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get SumUp access token');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Create checkout
        const checkoutData = {
          checkout_reference: reference,
          amount: amount,
          currency: 'GBP',
          pay_to_email: env.SUMUP_PAY_TO_EMAIL,
          description: description,
          return_url: `${url.origin}/payment-return?checkout_id={checkout_id}&status={status}`,
          merchant_code: merchantCode,
        };

        const checkoutResponse = await fetch(sumupApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkoutData),
        });

        if (!checkoutResponse.ok) {
          const errorText = await checkoutResponse.text();
          throw new Error(`SumUp API error: ${checkoutResponse.status} - ${errorText}`);
        }

        const checkoutResult = await checkoutResponse.json();

        return new Response(JSON.stringify(checkoutResult), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });

      } catch (error) {
        console.error('SumUp checkout error:', error);
        
        return new Response(JSON.stringify({
          error: error.message,
          details: 'Failed to create SumUp checkout'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Handle health check
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'MCG SumUp Payment API',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Default response for unknown endpoints
    return new Response(JSON.stringify({
      error: 'Endpoint not found',
      available_endpoints: [
        'POST /api/create-checkout',
        'GET /api/health'
      ]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
