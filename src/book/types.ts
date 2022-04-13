export interface Book {
    id: string;
    isbn: string;
    status: string;
    checkOutDate?: string;
    checkedOutBy?: string;
}

export enum BookStatus {
    Available = 'Available',
    CheckedOut = 'CheckedOut'
}

export enum CheckoutStatus {
    InvalidBookId,
    
}