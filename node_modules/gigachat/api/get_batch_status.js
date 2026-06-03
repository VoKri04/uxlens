"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_batch_status = get_batch_status;
const utils_1 = require("./utils.js");
const exceptions_1 = require("../exceptions.js");
function getRequestConfig({ batchId, accessToken }) {
    const headers = (0, utils_1.buildHeaders)(accessToken);
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
        return (0, utils_1.buildXHeaders)(response, response.data[0]);
    }
    else if (response.status === 401) {
        throw new exceptions_1.AuthenticationError(response);
    }
    else {
        throw new exceptions_1.ResponseError(response);
    }
}
async function get_batch_status(client, args) {
    const config = getRequestConfig(args);
    const response = await client.request(config);
    return buildResponse(response);
}
//# sourceMappingURL=get_batch_status.js.map