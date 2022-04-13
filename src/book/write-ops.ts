import {
    ConditionalCheckFailedException,
    DeleteItemCommand,
    PutItemCommand,
    TransactionCanceledException,
    TransactWriteItemsCommand
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dynamoClient from '../dynamoclient';
import { tableName, bookCheckOutLimit } from '../config';
import { CheckOutError, ClientError, EntityNotFoundError, ReturnError } from '../errors';
import { getBook } from './read-ops';
import { userHasOverdueBooks } from './assertions';
import { BookStatus } from './types';

export const addBook = async (isbn: string): Promise<string> => {
    const bookId = uuidv4();
    await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            pk: { 'S': `book#${bookId}` },
            sk: { 'S': 'B' },
            bookId: { 'S': bookId },
            bookIsbn: { 'S': isbn },
            bookStatus: { 'S': BookStatus.Available }
        },
        ConditionExpression: 'attribute_not_exists(pk)'
    }));
    return bookId;
}

/**
 * @param userId 
 * @param bookId 
 * @param now An Optional date object to override the checkout date. This date will
 * not be used when checking for overdue books.
 */
export const checkoutBook = async (
    userId: string,
    bookId: string,
    now = new Date()
): Promise<void> => {
    const checkOutTime = now.toISOString(); // important: save and use the same check out time.
    const { isbn: bookIsbn } = await getBook(bookId);
    if ((await userHasOverdueBooks(userId))) {
        throw new CheckOutError(
            'You have one or more overdue items. ' +
            'Please return them prior checking out a new one.'
        );
    }
    try {
        await dynamoClient.send(new TransactWriteItemsCommand({
            TransactItems: [
                {
                    Update: {
                        TableName: tableName,
                        Key: {
                            pk: { 'S': `user#${userId}` },
                            sk: { 'S': `U` }
                        },
                        UpdateExpression: 'SET #userCheckOutCount = #userCheckOutCount + :one',
                        ConditionExpression: '#userCheckOutCount < :limit',
                        ExpressionAttributeNames: {
                            '#userCheckOutCount': 'userCheckOutCount'
                        },
                        ExpressionAttributeValues: {
                            ':limit': { 'N': bookCheckOutLimit.toString() },
                            ':one': { 'N': '1' }
                        }
                    }
                },
                {
                    Put: {
                        TableName: tableName,
                        Item: {
                            pk: { 'S': `usercheckout#${userId}` },
                            sk: { 'S': checkOutTime },
                            checkoutUserId: { 'S': userId },
                            checkoutBookId: { 'S': bookId },
                            checkoutBookIsbn: { 'S': bookIsbn },
                            checkoutBookCheckOutDate: { 'S': checkOutTime }
                        },
                        ConditionExpression: 'attribute_not_exists(pk)'
                    }
                },
                {
                    Update: {
                        TableName: tableName,
                        Key: {
                            pk: { 'S': `book#${bookId}` },
                            sk: { 'S': 'B' }
                        },
                        UpdateExpression: 'SET #bookCheckOutDate = :date, #bookUserId = :userId, #bookStatus = :checkedout',
                        ConditionExpression: 'attribute_exists(pk) AND attribute_not_exists(#bookCheckOutDate) AND attribute_not_exists(#bookUserId) AND #bookStatus = :available',
                        ExpressionAttributeNames: {
                            '#bookCheckOutDate': 'bookCheckOutDate',
                            '#bookUserId': 'bookUserId',
                            '#bookStatus': 'bookStatus'
                        },
                        ExpressionAttributeValues: {
                            ':date': { 'S': checkOutTime },
                            ':checkedout': { 'S': BookStatus.CheckedOut },
                            ':userId': { 'S': userId },
                            ':available': { 'S': BookStatus.Available }
                        }
                    }
                }
            ]
        }));
    } catch (e) {
        if (e instanceof TransactionCanceledException) {
            const reasons = e.CancellationReasons || [];
            if (reasons[0]?.Code === 'ConditionalCheckFailed') {
                throw new CheckOutError(
                    'Invalid user id or too many checked out books'
                );
            }
            if (reasons[2]?.Code === 'ConditionalCheckFailed') {
                throw new CheckOutError(
                    `Book #${bookId} is not available`
                );
            }
        }
        throw e;
    }
}

export const returnBook = async (
    userId: string,
    bookId: string,
    checkOutDate: string
): Promise<void> => {
    const { isbn: bookIsbn,
        checkOutDate: existingCheckOutDate,
        checkedOutBy,
        status
    } = await getBook(bookId);
    if (
        status !== BookStatus.CheckedOut ||
        ! existingCheckOutDate ||
        existingCheckOutDate !== checkOutDate ||
        checkedOutBy !== userId
    ) {
        throw new ReturnError('You are not allowed to return this book.');
    }
    await dynamoClient.send(new TransactWriteItemsCommand({
        TransactItems: [
            {
                Put: {
                    TableName: tableName,
                    Item: {
                        pk: { 'S': `userreturn#${userId}` },
                        sk: { 'S': (new Date()).toISOString() },
                        returnUserId: { 'S': userId },
                        returnBookId: { 'S': bookId },
                        returnBookIsbn: { 'S': bookIsbn },
                        returnBookCheckOutDate: { 'S': checkOutDate }
                    }
                }
            },
            {
                Delete: {
                    TableName: tableName,
                    Key: {
                        pk: { 'S': `usercheckout#${userId}` },
                        sk: { 'S': checkOutDate }
                    },
                    ConditionExpression: 'attribute_exists(pk)'
                }
            },
            {
                Update: {
                    TableName: tableName,
                    Key: {
                        pk: { 'S': `book#${bookId}` },
                        sk: { 'S': 'B' }
                    },
                    UpdateExpression: 'REMOVE #bookCheckOutDate, #bookUserId SET #bookStatus = :available',
                    ConditionExpression: '#bookUserId = :userId AND #bookCheckOutDate = :date AND #bookStatus = :checkedout',
                    ExpressionAttributeNames: {
                        '#bookCheckOutDate': 'bookCheckOutDate',
                        '#bookUserId': 'bookUserId',
                        '#bookStatus': 'bookStatus'
                    },
                    ExpressionAttributeValues: {
                        ':available': { 'S': BookStatus.Available },
                        ':userId': { 'S': userId },
                        ':date': { 'S': checkOutDate },
                        ':checkedout': { 'S': BookStatus.CheckedOut },
                    }
                }
            },
            {
                Update: {
                    TableName: tableName,
                    Key: {
                        pk: { 'S': `user#${userId}` },
                        sk: { 'S': 'U' }
                    },
                    UpdateExpression: 'SET #userCheckOutCount = #userCheckOutCount - :one',
                    ConditionExpression: '#userCheckOutCount >= :one',
                    ExpressionAttributeNames: {
                        '#userCheckOutCount': 'userCheckOutCount'
                    },
                    ExpressionAttributeValues: {
                        ':one': { 'N': '1' }
                    }
                }
            }
        ]
    }));
}

export const deleteBook = async (bookId: string): Promise<void> => {
    try {
        await dynamoClient.send(new DeleteItemCommand({
            TableName: tableName,
            Key: {
                pk: { 'S': `book#${bookId}` },
                sk: { 'S': 'B' },
            },
            ConditionExpression: 'attribute_exists(pk)'
        }));
    } catch (e) {
        if (e instanceof ConditionalCheckFailedException) {
            throw new EntityNotFoundError('Invalid book id');
        }
        throw e;
    }
}