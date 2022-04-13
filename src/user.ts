import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dynamoClient from './dynamoclient';
import { tableName } from './config';

export const addUser = async (): Promise<string> => {
    const userId = uuidv4();
    await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            pk: { 'S': `user#${userId}` },
            sk: { 'S': 'U' },
            userId: { 'S': userId },
            userCheckOutCount: { 'N': '0' }
        },
        ConditionExpression: 'attribute_not_exists(pk)'
    }));
    return userId;
}