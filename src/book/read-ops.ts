import { GetItemCommand,
    QueryCommand,
    QueryInput,
    ScanCommand
} from '@aws-sdk/client-dynamodb';
import dynamoClient from '../dynamoclient';
import { tableName, checkOutDuration, checkedOutBooksIndex } from '../config';
import { EntityNotFoundError } from '../errors';
import type { Book } from './types';
import { subtractDays,
    populateFromBookRecord,
    populateFromUserCheckOutRecord,
    deserializeStartKey,
    serializeStartKey
} from './utils';

export const getBook = async (bookId: string): Promise<Book> => {
    const res = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: {
            pk: { 'S': `book#${bookId}` },
            sk: { 'S': 'B' }
        }
    }));
    if (! res.Item) {
        throw new EntityNotFoundError('Invalid book id');
    }
    return populateFromBookRecord(res.Item);
}

export const getOverdueBooks = async (nextToken?: string, now = new Date()) => {
    const res = await dynamoClient.send(new ScanCommand({
        // This is a sparse index. It will only contain checked out books. This is efficient.
        IndexName: checkedOutBooksIndex,
        FilterExpression: '#sk <= :date',
        TableName: tableName,
        Limit: 20,
        ExpressionAttributeNames: {
            '#sk': 'bookCheckOutDate'
        },
        ExpressionAttributeValues: {
            ':date': { 'S': subtractDays(checkOutDuration, now).toISOString() }
        },
        ExclusiveStartKey: nextToken ? deserializeStartKey(nextToken) : undefined
    }));
    if (! res.Items) {
        return [];
    }
    const books = res.Items.map(obj => populateFromBookRecord(obj));
    return {
        books,
        nextToken: res.LastEvaluatedKey ? serializeStartKey(res.LastEvaluatedKey) : undefined
    };
}

export const getCheckedOutBooksByUserId = async (userId: string, nextToken?: string) => {
    const res = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'pk = :usercheckout',
        ExpressionAttributeValues: {
            ':usercheckout': { 'S': `usercheckout#${userId}` }
        },
        Limit: 20,
        ExclusiveStartKey: nextToken ? deserializeStartKey(nextToken) : undefined
    }));
    if (! res.Items) {
        return [];
    }
    const books = res.Items.map(obj => populateFromUserCheckOutRecord(obj));
    return {
        books,
        nextToken: res.LastEvaluatedKey ? serializeStartKey(res.LastEvaluatedKey) : undefined
    };
}
