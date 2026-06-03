import { buildHeaders, buildXHeaders } from "./utils.mjs";
import { AuthenticationError, ResponseError } from "../exceptions.mjs";
function getRequestConfig({ fileId, accessToken }) {
    const headers = buildHeaders(accessToken);
    headers['Accept'] = 'text';
    return {
        method: 'GET',
        url: `/files/${fileId}/content`,
        headers,
        responseType: 'text',
    };
}
function buildResponse(response) {
    if (response.status === 200) {
        const result = buildXHeaders(response, { content: response.data });
        result.content = result.content
            .split('\n')
            .filter((el) => el != '')
            .map((el) => JSON.parse(el));
        return result;
    }
    else if (response.status === 401) {
        throw new AuthenticationError(response);
    }
    else {
        throw new ResponseError(response);
    }
}
export async function get_batch(client, args) {
    const config = getRequestConfig(args);
    const response = await client.request(config);
    return buildResponse(response);
}
//# sourceMappingURL=get_batch.mjs.map