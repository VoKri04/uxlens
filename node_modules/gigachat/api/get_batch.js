"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_batch = get_batch;
const utils_1 = require("./utils.js");
const exceptions_1 = require("../exceptions.js");
function getRequestConfig({ fileId, accessToken }) {
    const headers = (0, utils_1.buildHeaders)(accessToken);
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
        const result = (0, utils_1.buildXHeaders)(response, { content: response.data });
        result.content = result.content
            .split('\n')
            .filter((el) => el != '')
            .map((el) => JSON.parse(el));
        return result;
    }
    else if (response.status === 401) {
        throw new exceptions_1.AuthenticationError(response);
    }
    else {
        throw new exceptions_1.ResponseError(response);
    }
}
async function get_batch(client, args) {
    const config = getRequestConfig(args);
    const response = await client.request(config);
    return buildResponse(response);
}
//# sourceMappingURL=get_batch.js.map