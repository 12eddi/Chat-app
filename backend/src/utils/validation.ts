export const MESSAGE_MAX_LENGTH = 2000;
export const SEARCH_QUERY_MAX_LENGTH = 100;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (value: string) => {
  return UUID_REGEX.test(value);
};

export const validateMessageContent = (value: unknown) => {
  if (typeof value !== "string") {
    throw new Error("Message content is required");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Message content is required");
  }

  if (trimmedValue.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`);
  }

  return trimmedValue;
};

export const validateOptionalMessageContent = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error("Message content must be text");
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`);
  }

  return trimmedValue;
};

export const parseScheduledFor = (value: unknown) => {
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

export const validateSearchQuery = (value: unknown) => {
  if (typeof value !== "string") {
    throw new Error("Query is required");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Query is required");
  }

  if (trimmedValue.length > SEARCH_QUERY_MAX_LENGTH) {
    throw new Error(
      `Query must be ${SEARCH_QUERY_MAX_LENGTH} characters or less`
    );
  }

  return trimmedValue;
};
