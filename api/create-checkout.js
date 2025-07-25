const { app } = require('@azure/functions');

app.http('create-checkout', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // CORS headers for your frontend
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        // Handle preflight request
        if (request.method === 'OPTIONS') {
            return { status: 200, headers: corsHeaders };
        }

        context.log('🚀 MCG Payment: Creating SumUp checkout...');

        try {
            // Get payment data from your frontend
            const { amount, reference, description } = await request.json();
            
            context.log('📝 Request data:', { amount, reference, description });

            // Validate required fields
            if (!amount || amount <= 0) {
                context.log('❌ Invalid amount:', amount);
                return {
                    status: 400,
                    headers: corsHeaders,
                    jsonBody: { 
                        success: false,
                        error: 'Invalid amount - must be greater than 0' 
                    }
                };
            }

            // Get API key from environment
            const API_KEY = process.env.SUMUP_TEST_API_KEY;
            
            if (!API_KEY) {
                context.log('❌ No SumUp API key configured');
                return {
                    status: 500,
                    headers: corsHeaders,
                    jsonBody: { 
                        success: false,
                        error: 'Payment service not configured - missing API key' 
                    }
                };
            }

            // Create checkout data for SumUp API
            const checkoutData = {
                checkout_reference: reference || `MCG_${Date.now()}`,
                amount: parseFloat(amount),
                currency: 'GBP',
                description: description || 'MCG Payment'
            };

            context.log('📝 Checkout data:', checkoutData);

            // Call SumUp API
            const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'MCG-Payment-System/1.0'
                },
                body: JSON.stringify(checkoutData)
            });

            const responseData = await sumupResponse.json();
            
            context.log(`🔍 SumUp API response: ${sumupResponse.status}`);
            context.log('📋 Response data:', responseData);

            if (sumupResponse.status === 201) {
                // SUCCESS - Checkout created
                context.log('✅ Checkout created successfully');
                context.log(`💳 Checkout ID: ${responseData.id}`);
                
                return {
                    status: 200,
                    headers: corsHeaders,
                    jsonBody: {
                        success: true,
                        checkout_id: responseData.id,
                        checkout_url: responseData.checkout_url || null,
                        amount: responseData.amount,
                        currency: responseData.currency,
                        description: responseData.description,
                        status: responseData.status,
                        reference: responseData.checkout_reference
                    }
                };
                
            } else {
                // API Error from SumUp
                context.log('❌ SumUp API error:', responseData);
                return {
                    status: sumupResponse.status,
                    headers: corsHeaders,
                    jsonBody: {
                        success: false,
                        error: 'SumUp API error',
                        details: responseData.message || `HTTP ${sumupResponse.status}`,
                        sumup_response: responseData
                    }
                };
            }

        } catch (error) {
            context.log('❌ Unexpected error:', error);
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
