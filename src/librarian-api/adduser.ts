import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { addBook } from "../book/write-ops";
import { string, object } from 'yup';
import { handleException } from "../utils";
import { addUser } from "../user";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const userId = await addUser();
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: `User #${userId} has been created successfully!`,
        };
    } catch (e) {
        return handleException(e);
    }
};