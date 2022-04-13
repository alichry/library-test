import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { deleteBook } from "../book";
import { string, object, ValidationError } from 'yup';
import { handleException } from "../utils";

const inputSchema = object()
    .shape({
        bookId: string().required()
    });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const { bookId } = await inputSchema.validate(event.pathParameters);
        await deleteBook(bookId);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Book #${bookId} has been deleted.` })
        }
    } catch (e) {
        return handleException(e);
    }
};