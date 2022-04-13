import { number, string } from 'yup';

export const tableName = string()
    .label('tableName')
    .required()
    .validateSync(process.env.tableName);

export const bookCheckOutLimit = number()
    .integer()
    .min(1)
    .label('bookCheckoutLimit')
    .required()
    .validateSync(process.env.bookCheckoutLimit || '3');

export const checkOutDuration = number()
    .integer()
    .min(1)
    .label('checkOutDuration (days)')
    .required()
    .validateSync(process.env.checkOutDuration || '14');

export const checkedOutBooksIndex = string()
    .required()
    .label('checkedOutBooksIndex')
    .validateSync(process.env.checkedOutBooksIndex);