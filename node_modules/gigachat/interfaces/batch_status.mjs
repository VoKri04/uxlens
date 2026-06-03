/** Имена методов, в которые пойдет запрос на выполнение */
var BATCH_METHOD;
(function (BATCH_METHOD) {
    BATCH_METHOD["chatCompletions"] = "chat_completions";
    BATCH_METHOD["embedder"] = "embedder";
})(BATCH_METHOD || (BATCH_METHOD = {}));
/** Статусы обработки файла */
var BATCH_FILE_STATUS;
(function (BATCH_FILE_STATUS) {
    BATCH_FILE_STATUS["created"] = "created";
    BATCH_FILE_STATUS["inProgress"] = "in_progress";
    BATCH_FILE_STATUS["completed"] = "completed";
})(BATCH_FILE_STATUS || (BATCH_FILE_STATUS = {}));
export { BATCH_FILE_STATUS, BATCH_METHOD };
//# sourceMappingURL=batch_status.mjs.map