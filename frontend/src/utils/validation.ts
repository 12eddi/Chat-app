export const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidUsername = (value: string) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
};

export const isStrongEnoughPassword = (value: string) => {
  return value.length >= 6;
};

export const normalizeInput = (value: string) => value.trim();
