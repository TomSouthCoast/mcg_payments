const { app } = require('@azure/functions');

app.http('create-checkout', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
        }

        try {
            const { amount, reference, description } = await request.json();
            
            context.log('Creating SumUp checkout:', { amount, reference, description });
            
            // Validate inputs
            if (!amount || !reference || !description) {
                return {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    jsonBody: { error: 'Missing required fields: amount, reference, description' }
                };
            }

            // Call SumUp API
            const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    checkout_reference: reference,
                    amount: parseFloat(amount),
                    currency: 'GBP',
                    description: description,
                    pay_to_email: process.env.SUMUP_MERCHANT_EMAIL
                })
            });

            const sumupData = await sumupResponse.json();
            
            if (!sumupResponse.ok) {
                context.log.error('SumUp API error:', sumupData);
                return {
                    status: sumupResponse.status,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    jsonBody: { error: sumupData.message || 'SumUp checkout creation failed' }
                };
            }

            return {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: {
                    checkout_id: sumupData.id,
                    status: 'created',
                    amount: sumupData.amount,
                    currency: sumupData.currency,
                    reference: sumupData.checkout_reference
                }
            };

        } catch (error) {
            context.log.error('Function error:', error);
            return {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: { error: 'Internal server error' }
            };
        }
    }
});