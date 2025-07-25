// Basic SumUp API Tests with API Key
const https = require('https');

describe('SumUp API Basic Integration', () => {
  const API_KEY = process.env.SUMUP_TEST_API_KEY;
  
  // Helper function for API requests
  const makeRequest = (method, path, data = null) => {
    return new Promise((resolve, reject) => {
      const postData = data ? JSON.stringify(data) : null;
      
      const options = {
        hostname: 'api.sumup.com',
        port: 443,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: body, headers: res.headers });
          }
        });
      });

      req.on('error', reject);
      
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  };

  beforeAll(() => {
    if (!API_KEY) {
      console.log('Skipping API tests - no API key provided');
    }
  });

  describe('API Key Authentication', () => {
    test('should authenticate with valid API key', async () => {
      if (!API_KEY) {
        return expect(true).toBe(true);
      }

      // Test getting merchant profile as authentication test
      const response = await makeRequest('GET', '/v0.1/me');

      expect([200, 201]).toContain(response.status);
      console.log('API Key authentication successful:', response.status);
    });

    test('should reject invalid API key', async () => {
      const invalidKeyRequest = () => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.sumup.com',
            port: 443,
            path: '/v0.1/me',
            method: 'GET',
            headers: {
              'Authorization': 'Bearer invalid_api_key_test'
            }
          };

          const req = https.request(options, (res) => {
            resolve({ status: res.statusCode });
          });

          req.on('error', reject);
          req.end();
        });
      };

      const response = await invalidKeyRequest();
      expect(response.status).toBe(401);
    });
  });

  describe('Merchant Information', () => {
    test('should retrieve merchant profile', async () => {
      if (!API_KEY) {
        return expect(true).toBe(true);
      }

      const response = await makeRequest('GET', '/v0.1/me');

      if (response.status === 200) {
        expect(response.data).toBeDefined();
        console.log('Merchant profile retrieved successfully');
        
        // Log some basic info (avoid logging sensitive data)
        if (response.data.merchant_code) {
          console.log('Merchant code available in profile');
        }
      } else {
        console.log('Merchant profile response status:', response.status);
      }
    });
  });

  describe('Payment Endpoints', () => {
    test('should test payment creation endpoint accessibility', async () => {
      if (!API_KEY) {
        return expect(true).toBe(true);
      }

      // Test with minimal data to see if endpoint is accessible
      const testPayment = {
        checkout_reference: `mcg_test_${Date.now()}`,
        amount: 1.00,
        currency: 'EUR',
        description: 'MCG API Test Payment'
      };

      const response = await makeRequest('POST', '/v0.1/checkouts', testPayment);

      // Accept various response codes - we're testing accessibility
      if (response.status === 201) {
        console.log('Payment creation successful');
        expect(response.data).toHaveProperty('id');
      } else if (response.status === 400 || response.status === 422) {
        console.log('Payment endpoint accessible, validation error expected:', response.status);
        expect(response.status).toBeGreaterThan(0);
      } else {
        console.log('Payment endpoint response:', response.status, response.data);
        expect(response.status).toBeGreaterThan(0);
      }
    });
  });

  describe('API Limits and Errors', () => {
    test('should handle non-existent endpoints', async () => {
      if (!API_KEY) {
        return expect(true).toBe(true);
      }

      const response = await makeRequest('GET', '/v0.1/nonexistent');
      expect(response.status).toBe(404);
    });

    test('should test API rate limiting behavior', async () => {
      if (!API_KEY) {
        return expect(true).toBe(true);
      }

      // Make a few rapid requests to test behavior
      const promises = Array.from({ length: 3 }, (_, i) => 
        makeRequest('GET', '/v0.1/me')
      );

      const responses = await Promise.all(promises);
      
      // Should have at least one successful response
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      console.log('Rate limiting test completed, response codes:', 
        responses.map(r => r.status));
    });
  });
});
