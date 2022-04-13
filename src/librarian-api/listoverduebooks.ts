import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getOverdueBooks } from "../book";
import { string, object, date } from 'yup';
import { handleException } from "../utils";

const inputSchema = object()
    .shape({
        nextToken: string(),
        overrideDate: date()
    });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const { nextToken, overrideDate } = await inputSchema.validate(event.queryStringParameters);
        const res = await getOverdueBooks(nextToken, overrideDate);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res),
        };
    } catch (e) {
        return handleException(e);
    }
};