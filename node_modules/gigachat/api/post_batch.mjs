import { AuthenticationError, ResponseError } from "../exceptions.mjs";
import { buildHeaders, buildXHeaders } from "./utils.mjs";
function getBatchesRequestConfig({ batch, method, accessToken }) {
    const headers = buildHeaders(accessToken);
    const requestString = batch.map((request) => JSON.stringify(request)).join('\n');
    const blob = new Blob([requestString], { type: 'application/octet-stream' });
    headers['Content-Type'] = 'application/octet-stream';
    return {
        method: 'POST',
        url: '/batches',
        params: {
            method,
        },
        data: blob,
        headers,
    };
}
function buildResponse(response) {
    if (response.status === 200) {
        return buildXHeaders(response, response.data);
    }
    if (response.status === 401) {
        throw new AuthenticationError(response);
    }
    throw new ResponseError(response);
}
export async function post_batch(client, args) {
    const config = getBatchesRequestConfig(args);
    const response = await client.request(config);
    return buildResponse(response);
}
//# sourceMappingURL=post_batch.mjs.map