import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Book, BookStatus } from './types';

export const subtractDays = (days: number, d = new Date()): Date => {
    if (! Number.isInteger(days)) {
        throw new Error('days must be an integer');
    }
    if (days < 0) {
        throw new Error('Unable to subtract a negative number of days');
    }
    d.setDate(d.getDate() - days);
    return d;
}

export const populateFromBookRecord = (item: { [key: string]: AttributeValue }): Book => {
    const id = item.bookId?.S;
    const isbn = item.bookIsbn?.S;
    const status = item.bookStatus?.S;
    const checkOutDate = item.bookCheckOutDate?.S;
    const checkedOutBy = item.bookUserId?.S;
    if (typeof isbn === "undefined" || ! id || ! status) {
        throw new Error('Malformed book data');
    }
    return { id, isbn, status, checkOutDate, checkedOutBy };
}

export const populateFromUserCheckOutRecord = (item: { [key: string]: AttributeValue }): Book => {
    const id = item.checkoutBookId?.S;
    const userId = item.checkoutUserId?.S;
    const isbn = item.checkoutBookIsbn?.S;
    const checkOutDate = item.checkoutBookCheckOutDate?.S;
    if (typeof isbn === "undefined" || ! id || ! userId || ! checkOutDate) {
        throw new Error('Malformed book data');
    }
    return { id,
        isbn,
        status: BookStatus.CheckedOut,
        checkOutDate,
        checkedOutBy: userId
    };
}

export const serializeStartKey = (obj: { [key: string]: AttributeValue }): string => {
    // It's better to have an in-memory cache instead of exposing schema design
    // and allowing for client-side manipulation
    const str = JSON.stringify(obj);
    return Buffer.from(str).toString('base64url');
}

export const deserializeStartKey = (str: string): { [key: string]: AttributeValue } => {
    return JSON.parse(
        Buffer.from(str, 'base64url').toString('ascii')
    );
}