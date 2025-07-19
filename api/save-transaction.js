const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

app.http('save-transaction', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
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
            const transaction = await request.json();
            
            // Create table client
            const tableClient = TableClient.fromConnectionString(
                process.env.AZURE_STORAGE_CONNECTION_STRING,
                'MCGTransactions'
            );

            // Ensure table exists
            await tableClient.createTable();

            // Prepare entity for table storage
            const entity = {
                partitionKey: 'MCG',
                rowKey: transaction.id.toString(),
                transactionNumber: transaction.transactionNumber,
                date: transaction.date,
                type: transaction.type,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
                names: JSON.stringify(transaction.names),
                details: JSON.stringify(transaction.details),
                status: transaction.status
            };

            // Save to table storage
            await tableClient.createEntity(entity);

            return {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: { success: true, id: transaction.id }
            };

        } catch (error) {
            context.log.error('Save transaction error:', error);
            return {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: { error: 'Failed to save transaction' }
            };
        }
    }
});
