const { app } = require('@azure/functions');

app.http('create-checkout', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        context.log('🚀 MCG Payment: Creating SumUp checkout...');

        try {
            const { amount, reference, description } = await request.json();

            if (!amount || amount <= 0) {
                return {
                    status: 400,
                    headers: corsHeaders,
                    jsonBody: { success: false, error: 'Invalid amount' }
                };
            }

            const API_KEY = process.env.SUMUP_TEST_API_KEY;
            if (!API_KEY) {
                return {
                    status: 500,
                    headers: corsHeaders,
                    jsonBody: { success: false, error: 'Payment service not configured' }
                };
            }

            const checkoutData = {
                checkout_reference: reference,
                amount: parseFloat(amount),
                currency: 'GBP',
                description: description || 'MCG Payment',
                redirect_url: `${process.env.WEBSITE_URL}/payment-success?checkout_id={checkout_id}&status=success`,
                return_url: `${process.env.WEBSITE_URL}/payment-cancelled?checkout_id={checkout_id}&status=cancelled`
            };

            context.log('📝 Creating checkout:', checkoutData);

            const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'MCG-Payment-System/1.0'
                },
                body: JSON.stringify(checkoutData)
            });

            const responseData = await response.json();
            context.log(`🔍 SumUp response: ${response.status}`, responseData);

            if (response.status === 201) {
                context.log('✅ Checkout created successfully');
                context.log(`💳 Checkout ID: ${responseData.id}`);
                context.log(`🔗 Payment URL: ${responseData.checkout_url}`);

                return {
                    status: 200,
                    headers: corsHeaders,
                    jsonBody: {
                        success: true,
                        checkout_id: responseData.id,
                        checkout_url: responseData.checkout_url,
                        amount: responseData.amount,
                        currency: responseData.currency,
                        description: responseData.description,
                        status: responseData.status,
                        reference: responseData.checkout_reference
                    }
                };
            } else {
                context.log('❌ Checkout creation failed:', responseData);
                return {
                    status: response.status,
                    headers: corsHeaders,
                    jsonBody: {
                        success: false,
                        error: 'Failed to create checkout',
                        details: responseData
                    }
                };
            }

        } catch (error) {
            context.log('❌ Error:', error);
            return {
                status: 500,
                headers: corsHeaders,
                jsonBody: {
                    success: false,
                    error: 'Internal server error',
                    details: error.message
                }
            };
        }
    }
});

module.exports = { app };
