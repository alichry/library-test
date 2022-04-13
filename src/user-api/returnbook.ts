import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { returnBook } from "../book";
import { string, object } from 'yup';
import { handleException } from "../utils";

const inputSchema = object()
    .shape({
        userId: string().required(),
        bookId: string().required(),
        checkOutDate: string().required()
    });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const { userId, bookId, checkOutDate } = await inputSchema.validate(event.body);
        await returnBook(userId, bookId, checkOutDate);
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: `Book #${bookId} has been returned`,
        };
    } catch (e) {
        return handleException(e);
    }
};