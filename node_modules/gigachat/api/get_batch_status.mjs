import { buildHeaders, buildXHeaders } from "./utils.mjs";
import { AuthenticationError, ResponseError } from "../exceptions.mjs";
function getRequestConfig({ batchId, accessToken }) {
    const headers = buildHeaders(accessToken);
    return {
        method: 'GET',
        url: `/batches`,
        params: {
            batch_id: batchId,
        },
        headers: headers,
    };
}
function buildResponse(response) {
    if (response.status === 200) {
        return buildXHeaders(response, response.data[0]);
    }
    else if (response.status === 401) {
        throw new AuthenticationError(response);
    }
    else {
        throw new ResponseError(response);
    }
}
export async function get_batch_status(client, args) {
    const config = getRequestConfig(args);
    const response = await client.request(config);
    return buildResponse(response);
}
//# sourceMappingURL=get_batch_status.mjs.map