"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSearchQuery = exports.parseScheduledFor = exports.validateOptionalMessageContent = exports.validateMessageContent = exports.isValidUuid = exports.SEARCH_QUERY_MAX_LENGTH = exports.MESSAGE_MAX_LENGTH = void 0;
exports.MESSAGE_MAX_LENGTH = 2000;
exports.SEARCH_QUERY_MAX_LENGTH = 100;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (value) => {
    return UUID_REGEX.test(value);
};
exports.isValidUuid = isValidUuid;
const validateMessageContent = (value) => {
    if (typeof value !== "string") {
        throw new Error("Message content is required");
    }
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        throw new Error("Message content is required");
    }
    if (trimmedValue.length > exports.MESSAGE_MAX_LENGTH) {
        throw new Error(`Message must be ${exports.MESSAGE_MAX_LENGTH} characters or less`);
    }
    return trimmedValue;
};
exports.validateMessageContent = validateMessageContent;
const validateOptionalMessageContent = (value) => {
    if (value === undefined || value === null || value === "") {
        return "";
    }
    if (typeof value !== "string") {
        throw new Error("Message content must be text");
    }
    const trimmedValue = value.trim();
    if (trimmedValue.length > exports.MESSAGE_MAX_LENGTH) {
        throw new Error(`Message must be ${exports.MESSAGE_MAX_LENGTH} characters or less`);
    }
    return trimmedValue;
};
exports.validateOptionalMessageContent = validateOptionalMessageContent;
const parseScheduledFor = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    if (typeof value !== "string") {
        throw new Error("Scheduled time must be a string");
    }
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Scheduled time is invalid");
    }
    if (parsedDate.getTime() <= Date.now()) {
        throw new Error("Scheduled time must be in the future");
    }
    return parsedDate;
};
exports.parseScheduledFor = parseScheduledFor;
const validateSearchQuery = (value) => {
    if (typeof value !== "string") {
        throw new Error("Query is required");
    }
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        throw new Error("Query is required");
    }
    if (trimmedValue.length > exports.SEARCH_QUERY_MAX_LENGTH) {
        throw new Error(`Query must be ${exports.SEARCH_QUERY_MAX_LENGTH} characters or less`);
    }
    return trimmedValue;
};
exports.validateSearchQuery = validateSearchQuery;
//# sourceMappingURL=validation.js.map