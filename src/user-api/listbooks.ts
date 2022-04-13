import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getCheckedOutBooksByUserId } from "../book";
import { string, object } from 'yup';
import { handleException } from "../utils";

const inputSchema = object()
    .shape({
        userId: string().required(),
        nextToken: string()
    });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const { userId, nextToken } = await inputSchema.validate(event.queryStringParameters);
        const res = await getCheckedOutBooksByUserId(userId, nextToken);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res),
        };
    } catch (e) {
        return handleException(e);
    }
    
};