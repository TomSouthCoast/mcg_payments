const { app } = require('@azure/functions');

app.http('verify-payment', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
        }

        try {
            const url = new URL(request.url);
            const checkoutId = url.searchParams.get('checkout_id');
            
            if (!checkoutId) {
                return {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    jsonBody: { error: 'Missing checkout_id parameter' }
                };
            }

            // Verify payment with SumUp
            const sumupResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`
                }
            });

            if (!sumupResponse.ok) {
                return {
                    status: sumupResponse.status,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    jsonBody: { error: 'Payment verification failed' }
                };
            }

            const paymentData = await sumupResponse.json();
            
            return {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: {
                    status: paymentData.status,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    reference: paymentData.checkout_reference,
                    transaction_id: paymentData.transaction_id,
                    timestamp: paymentData.date
                }
            };

        } catch (error) {
            context.log.error('Verification error:', error);
            return {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: { error: 'Internal server error' }
            };
        }
    }
});