"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BATCH_METHOD = exports.BATCH_FILE_STATUS = void 0;
/** Имена методов, в которые пойдет запрос на выполнение */
var BATCH_METHOD;
(function (BATCH_METHOD) {
    BATCH_METHOD["chatCompletions"] = "chat_completions";
    BATCH_METHOD["embedder"] = "embedder";
})(BATCH_METHOD || (exports.BATCH_METHOD = BATCH_METHOD = {}));
/** Статусы обработки файла */
var BATCH_FILE_STATUS;
(function (BATCH_FILE_STATUS) {
    BATCH_FILE_STATUS["created"] = "created";
    BATCH_FILE_STATUS["inProgress"] = "in_progress";
    BATCH_FILE_STATUS["completed"] = "completed";
})(BATCH_FILE_STATUS || (exports.BATCH_FILE_STATUS = BATCH_FILE_STATUS = {}));
//# sourceMappingURL=batch_status.js.map