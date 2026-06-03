"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.post_batch = post_batch;
const exceptions_1 = require("../exceptions.js");
const utils_1 = require("./utils.js");
function getBatchesRequestConfig({ batch, method, accessToken }) {
    const headers = (0, utils_1.buildHeaders)(accessToken);
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
        return (0, utils_1.buildXHeaders)(response, response.data);
    }
    if (response.status === 401) {
        throw new exceptions_1.AuthenticationError(response);
    }
    throw new exceptions_1.ResponseError(response);
}
async function post_batch(client, args) {
    const config = getBatchesRequestConfig(args);
    const response = await client.request(config);
    return buildResponse(response);
}
//# sourceMappingURL=post_batch.js.map