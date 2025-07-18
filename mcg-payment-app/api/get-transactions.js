const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

app.http('get-transactions', {
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
            const tableClient = TableClient.fromConnectionString(
                process.env.AZURE_STORAGE_CONNECTION_STRING,
                'MCGTransactions'
            );

            const entities = [];
            const entitiesIter = tableClient.listEntities({
                queryOptions: { filter: "PartitionKey eq 'MCG'" }
            });

            for await (const entity of entitiesIter) {
                entities.push({
                    id: entity.rowKey,
                    transactionNumber: entity.transactionNumber,
                    date: entity.date,
                    type: entity.type,
                    amount: entity.amount,
                    paymentMethod: entity.paymentMethod,
                    names: JSON.parse(entity.names || '[]'),
                    details: JSON.parse(entity.details || '{}'),
                    status: entity.status
                });
            }

            return {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: entities.sort((a, b) => new Date(b.date) - new Date(a.date))
            };

        } catch (error) {
            context.log.error('Get transactions error:', error);
            return {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: { error: 'Failed to retrieve transactions' }
            };
        }
    }
});