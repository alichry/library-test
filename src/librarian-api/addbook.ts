import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { addBook } from "../book/write-ops";
import { string, object, ValidationError } from 'yup';
import { handleException } from "../utils";

const inputSchema = object()
    .shape({
        isbn: string().required() // assume ISBN has no format
    });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const { isbn } = await inputSchema.validate(event.pathParameters);
        const bookId = await addBook(isbn);
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: `Book #${bookId} has been created successfully!`,
        };
    } catch (e) {
        return handleException(e);
    }
};