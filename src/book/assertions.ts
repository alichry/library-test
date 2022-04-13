import { QueryCommand } from '@aws-sdk/client-dynamodb';
import dynamoClient from '../dynamoclient';
import { tableName, checkOutDuration } from '../config';
import { subtractDays } from './utils';

export const userHasOverdueBooks = async (userId: string): Promise<boolean> => {
    const res = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'pk = :usercheckout AND sk <= :date',
        ExpressionAttributeValues: {
            ':usercheckout': { 'S': `usercheckout#${userId}` },
            ':date': { 'S': (subtractDays(checkOutDuration)).toISOString() }
        },
        Limit: 1
    }));
    if (! res.Count) {
        return false;
    }
    return res.Count > 0;
}