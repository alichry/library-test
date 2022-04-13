import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { checkoutBook } from "../book";
import { string, object, date } from 'yup';
import { handleException } from "../utils";

const inputSchema = object()
    .shape({
        userId: string().required(),
        bookId: string().required(),
        overrideCheckOutDate: date()
    });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const { userId, bookId, overrideCheckOutDate } = await inputSchema.validate(event.body);
        await checkoutBook(userId, bookId, overrideCheckOutDate);
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: `Book #${bookId} has been checked out`,
        };
    } catch (e) {
        return handleException(e);
    }
};