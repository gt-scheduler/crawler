import process from "process";
import safeStringify from "fast-safe-stringify";

export type LogFormat = "json" | "text";

let logFormat: LogFormat = "text";

/**
 * Custom type guard for determining if a string is a valid log format
 */
export function isLogFormat(rawLogFormat: string): rawLogFormat is LogFormat {
  switch (rawLogFormat) {
    case "json":
    case "text":
      return true;
    default:
      return false;
  }
}

/**
 * Sets the global log format used for any future calls to `log`,
 * its derivatives, or any Span functions
 */
export function setLogFormat(newLogFormat: LogFormat): void {
  logFormat = newLogFormat;
}

/**
 * Gets the current global log format
 */
export function getLogFormat(): LogFormat {
  return logFormat;
}

/**
 * Base logging function that logs at level="info"
 * @param message - static message, used for grepping logs
 * @param fields - structured fields (should be string-serializable)
 */
export function log(
  message: string,
  fields: Record<string, unknown> = {}
): void {
  if (logFormat === "json") {
    // eslint-disable-next-line no-console
    console.log(
      safeStringify({
        ts: new Date().toISOString(),
        message,
        level: "info",
        ...fields,
      })
    );
  } else {
    const fieldsAsStrings: Record<string, string> = {
      level: "info",
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === "object") {
        fieldsAsStrings[key] = safeStringify(value);
      } else {
        fieldsAsStrings[key] = String(value);
      }
    });

    // eslint-disable-next-line no-console
    console.log(
      [
        `[${new Date().toISOString()}]`,
        message,
        ...Object.entries(fieldsAsStrings).map(
          ([key, value]) => `${key}='${value}'`
        ),
      ].join(" ")
    );
  }
}

/**
 * Base logging function that logs at level="info"
 * @param message - static message, used for grepping logs
 * @param fields - structured fields (should be string-serializable)
 */
export function info(
  message: string,
  fields: Record<string, unknown> = {}
): void {
  log(message, fields);
}

/**
 * Base logging function that logs at level="warn"
 * @param message - static message, used for grepping logs
 * @param fields - structured fields (should be string-serializable)
 */
export function warn(
  message: string,
  fields: Record<string, unknown> = {}
): void {
  log(message, { level: "warn", ...fields });
}

/**
 * Performs a best-effort serialization of the error into structured fields
 * @param err - the raw error object or unknown
 * @param includeStack - whether to include the stacktrace in "stack"
 * @returns a structured log fields record
 */
export function errorFields(
  err: unknown,
  includeStack = false
): Record<string, unknown> {
  const { message: errorMessage, stack } = err as {
    message?: string;
    stack?: string;
  };

  // Perform a best-effort serialization of the error
  let errorAsString = String(err);
  if (errorAsString === "[object Object]") {
    errorAsString = safeStringify(err);
  }

  const fields: Record<string, unknown> = {
    error: errorAsString,
    errorMessage,
  };

  if (includeStack) {
    fields.stack = stack;
  }

  return fields;
}

/**
 * Base logging function that logs at level="error",
 * including explicit error-related fields.
 * @param message - static message, used for grepping logs
 * @param err - error object or null/undefined
 * @param fields - structured fields (should be string-serializable)
 */
export function error(
  message: string,
  err: unknown,
  fields: Record<string, unknown> = {}
): void {
  log(message, {
    level: "error",
    ...errorFields(err, true),
    ...fields,
  });
}

/**
 * Creates a new span with the given base message, starting it immediately
 * @param baseMessage - static message, used for grepping logs
 * @param fields - structured fields (should be string-serializable)
 * @returns a new `Span` instance
 */
export function startSpan(
  baseMessage: string,
  fields: Record<string, unknown> = {}
): Span {
  const currentSpan = new Span(baseMessage, fields);
  currentSpan.start();
  return currentSpan;
}

/**
 * Runs an entire operation in a span
 * @param baseMessage - static message, used for grepping logs
 * @param fields - structured fields (should be string-serializable)
 * @param execute - async callback. Optional function `setCompletionFields`
 * passed in as parameter allows callback to set additional fields
 * for the span finish event.
 * @returns
 */
export async function span<R>(
  baseMessage: string,
  fields: Record<string, unknown>,
  execute: (
    setCompletionFields: (additionalFields: Record<string, unknown>) => void
  ) => Promise<R> | R
): Promise<R> {
  // Allow the callback to register additional fields upon completion
  let completionFields: Record<string, unknown> = {};
  const setCompletionFields = (additionalFields: Record<string, unknown>) => {
    completionFields = { ...completionFields, ...additionalFields };
  };

  // Run the operation in a new span
  const currentSpan = new Span(baseMessage, fields);
  currentSpan.start();
  try {
    const resultOrPromise = execute(setCompletionFields);
    let result: R;
    if (resultOrPromise instanceof Promise) {
      result = await resultOrPromise;
    } else {
      result = resultOrPromise;
    }

    currentSpan.finish(completionFields);

    return result;
  } catch (err) {
    currentSpan.error(err, completionFields);
    throw err;
  }
}

/**
 * Represents a span operation that includes timing information
 * and structured logging
 */
export class Span {
  baseMessage: string;

  fields: Record<string, unknown>;

  startTime: [number, number] | null;

  /**
   * Creates a new span without starting it
   * @param baseMessage - static message, used for grepping logs
   * @param fields - structured fields (should be string-serializable)
   */
  constructor(baseMessage: string, fields: Record<string, unknown> = {}) {
    this.baseMessage = baseMessage;
    this.fields = fields;
    this.startTime = null;
  }

  /**
   * Emits a span event as a log line
   * @param event - the type of the span event
   * @param additionalFields - additional structured fields
   * (should be string-serializable)
   */
  spanEvent(
    event: "start" | "finish" | "error",
    additionalFields: Record<string, unknown> = {}
  ): void {
    if (logFormat === "json") {
      log(this.baseMessage, {
        spanEvent: event,
        ...this.fields,
        ...additionalFields,
      });
    } else {
      const eventPrefix = `${event}ed`;
      // 8 is the length of the longest possible event prefix, "finished"
      log(`${eventPrefix.padStart(8)} ${this.baseMessage}`, {
        ...this.fields,
        ...additionalFields,
      });
    }
  }

  /**
   * Starts a previously-constructed span, emitting a span start event
   * and noting the start time in the `Span` object
   */
  start(): void {
    this.spanEvent("start");
    this.startTime = process.hrtime();
  }

  getElapsedMs(): number {
    if (this.startTime === null) {
      throw new Error(
        `Span has not yet started: baseMessage="${this.baseMessage}"`
      );
    }

    // Gives [seconds, nanoseconds]
    const end = process.hrtime(this.startTime);
    return end[0] * 1_000 + end[1] / 1_000_000;
  }

  /**
   * Finishes a previously-started span, emitting a span finish event
   * that includes the elapsed time since the call to `start`
   * @param additionalFields - additional structured fields
   * (should be string-serializable)
   */
  finish(additionalFields: Record<string, unknown> = {}): void {
    this.spanEvent("finish", {
      elapsedMs: this.getElapsedMs(),
      ...additionalFields,
    });
  }

  /**
   * Finishes a previously-started span, emitting a span error event
   * that includes the elapsed time since the call to `start`
   * @param additionalFields - additional structured fields
   * (should be string-serializable)
   */
  error(err: unknown, additionalFields: Record<string, unknown> = {}): void {
    this.spanEvent("error", {
      level: "error",
      elapsedMs: this.getElapsedMs(),
      ...errorFields(err, false),
      ...additionalFields,
    });
  }
}
