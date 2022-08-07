import safeStringify from "fast-safe-stringify";
import { AsyncLocalStorage } from "node:async_hooks";
import winston from "winston";

export interface LogOptions {
  /**
   * Output type to use for log messages. Use 'json' in production, and 'text'
   * in development.
   */
  format: "json" | "text";
}

/**
 * Log is an interface for a simple wrapper around winston.Logger that supports
 * running async blocks of code with a base set of fields that get attached to
 * any log messages emitted from within that block of code (see
 * {@link Log.runWithLogFields}).
 *
 * This is powerful, and lets you attach useful context of a parent asynchronous
 * operation before dispatching child operation(s) (without needing to pipe that
 * context through as additional function arguments).
 *
 * A default logger is set up statically, but should be configured using
 * {@link Log.configure} once the correct options have been resolved.
 *
 * This class is static (instead of needing an instance wired through whereever
 * the ability to log things is sought) primarily for convenience. This slightly
 * complicates tracking /which/ logger is being used, since the logger can be
 * changed via calls to {@link Log.configure}, but I (@jazeved0) think this is a
 * reasonable tradeoff.
 *
 * @example
 * import Log from "../log";
 *
 * // Log a simple informational message with simple fields
 * Log.info("starting to coalesce gadget groups", { foo: "123", bar: 6.28 });
 * // Log a warning message, with no fields
 * Log.warn("could not obtain list of gadgets to coalesce; falling back to default");
 * // Log an exception (error), which will include its stack trace
 * try {
 *   throw new Error("RPC timeout");
 * } catch (err) {
 *   Log.error("an error occurred while communicating with coalesce-srv", err, {
 *     baz: "FormGadgetGroups"
 *   });
 * }
 */
export default class Log {
  // Start off execution with a default logger,
  // that will get replaced with a call to `Log.configure(...)`.
  private static logger: winston.Logger = this.makeLogger({
    format: "text",
  });

  /**
   * runWithLogFields runs the given asynchronous block of code, and any log
   * messages emitted in that block of code will have the given fields attached
   * to them.
   *
   * @param fields - fields to attach, as key-value pairs (the values should be
   * JSON-serializable).
   */
  async runWithLogFields<R>(
    fields: Readonly<Record<string, unknown>>,
    execute: () => Promise<R>
  ): Promise<R> {
    return FieldsStorage.run(fields, execute);
  }

  /**
   * Emits a log message at an "info" level.
   *
   * Use this for general progress info or diagnostic information.
   *
   * @param message - base message, should be completely static (store any
   * changing fields/state in the fields object). This makes it easy to find
   * where, in code, a given log line was emitted just by searching for its
   * message.
   * @param fields - additional context to group with the log message, as
   * key-value pairs (the values should be JSON-serializable).
   */
  static info(message: string, fields: Record<string, unknown> = {}) {
    this.logBase("info", message, fields);
  }

  /**
   * Emits a log message at a "warn" level.
   *
   * Use this for unexpected situations where there is an issue that, while not
   * critical to the functionality of the application, should likely still be
   * investigated/fixed.
   *
   * @param message - base message, should be completely static (store any
   * changing fields/state in the fields object). This makes it easy to find
   * where, in code, a given log line was emitted just by searching for its
   * message.
   * @param fields - additional context to group with the log message, as
   * key-value pairs (the values should be JSON-serializable).
   */
  static warn(message: string, fields: Record<string, unknown> = {}) {
    this.logBase("warn", message, fields);
  }

  /**
   * Emits a log message at an "error" level, optionally attaching a caught
   * exception to the log message that will include its stack trace, if
   * available.
   *
   * Use this for critical errors that significantly impact the functionality of
   * the application.
   *
   * If the application has no realistic way forwards (or if doing so would
   * corrupt data), then call {@link process.exit} immediately after the call to
   * {@link Log.error}.
   *
   * @param message - base message, should be completely static (store any
   * changing fields/state in the fields object). This makes it easy to find
   * where, in code, a given log line was emitted just by searching for its
   * message.
   * @param errorObj - the error object to include information on. Ideally, this
   * is a subclass of `Error`, but can be any JSON-serializable value. To emit
   * attaching any extra error-related fields (and instead just emit a normal
   * "error"-level message), pass in `null` for this parameter.
   * @param fields - additional context to group with the log message, as
   * key-value pairs (the values should be JSON-serializable).
   */
  static error(
    message: string,
    errorObj: unknown,
    fields: Record<string, unknown> = {}
  ) {
    let errorFields = {};
    if (errorObj !== null) {
      errorFields = Log.makeErrorFields(errorObj);
    }

    this.logBase("error", message, {
      ...errorFields,
      ...fields,
    });
  }

  /**
   * Starts a new profiler timer, to use for timing operations. Call
   * `Profiler.done` on the returned value once the operation is done.
   *
   * This function is a thin wrapper around {@link winston.Logger.startTimer}.
   */
  static startTimer(): Profiler {
    return new ProfilerWrapper(this.logger.startTimer());
  }

  /**
   * Configures the logger to use the provided options for any log messages
   * emitted after this call.
   */
  static configure(logOptions: LogOptions) {
    this.logger = this.makeLogger(logOptions);
  }

  /**
   * Responsible for constructing the winston.Logger instance from the options
   * struct. Add any customizations as needed here.
   */
  private static makeLogger(logOptions: LogOptions): winston.Logger {
    return winston.createLogger({
      transports: [new winston.transports.Console()],
      format:
        logOptions.format === "json"
          ? winston.format.json()
          : winston.format.cli(),
    });
  }

  /**
   * Handles attaching the current set of fields from the asynchronous context
   * and forwards the log message to winston.
   */
  private static logBase(
    logLevel: "info" | "warn" | "error",
    message: string,
    fields: Record<string, unknown>
  ) {
    this.logger.log({
      ...FieldsStorage.get(),
      ...fields,
      level: logLevel,
      message,
    });
  }

  /**
   * Performs a best-effort serialization of the error into structured fields
   * @param err - the raw error object or unknown
   * @returns a structured log fields record
   */
  private static makeErrorFields(
    err: unknown
  ): Readonly<Record<string, unknown>> {
    const { message, stack } = err as {
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
      // Don't use 'message', since that is the name of an existing field
      errorMessage: message,
      stack,
    };

    return fields;
  }
}

/**
 * FieldsStorage provides a thin wrapper around the {@link AsyncLocalStorage}
 * API, to be used for storing contextual log fields that are shared across any
 * log lines emitted within a single call to {@link Log.runWithLogFields} (using
 * {@link FieldsStorage.run}).
 */
class FieldsStorage {
  private static internal = new AsyncLocalStorage<
    Readonly<Record<string, unknown>>
  >();

  static get(): Readonly<Record<string, unknown>> {
    return this.internal.getStore() ?? {};
  }

  static async run<R>(
    newFields: Readonly<Record<string, unknown>>,
    execute: () => Promise<R>
  ): Promise<R> {
    const currentFields = this.get();
    return this.internal.run({ ...currentFields, ...newFields }, execute);
  }
}

/**
 * ProfilerWrapper is a thin wrapper around {@link winston.Profiler} that
 * automatically attaches the current set of fields from the asynchronous
 * context, when the log message finally gets emitted (see
 * {@link ProfilerWrapper.done}).
 */
class ProfilerWrapper {
  private internal: winston.Profiler;

  constructor(internal: winston.Profiler) {
    this.internal = internal;
  }

  done(message: string, fields: Record<string, unknown> = {}) {
    this.internal.done({ ...FieldsStorage.get(), ...fields, message });
  }
}

// Export the type of ProfilerWrapper, but not the class itself
export type Profiler = InstanceType<typeof ProfilerWrapper>;
