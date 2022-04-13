import { DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { ValidationError } from "yup";
import { ClientError } from "./errors";

export const handleException = (e: unknown) => {
    if (
        e instanceof ValidationError ||
        e instanceof ClientError
    ) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: e.message })
        }
    }
    console.error('An exception has occurred:');
    console.error(e);
    return {
        statusCode: 503,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            error: 'An internal server error has occurred. Please try again later.'
        })
    }
}