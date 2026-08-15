type LogFields = Record<string, unknown>;

function base(level: string, message: string, fields?: LogFields) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => base('info', message, fields),
  warn: (message: string, fields?: LogFields) => base('warn', message, fields),
  error: (message: string, fields?: LogFields) => base('error', message, fields),
};
