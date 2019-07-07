export class MissingOverrideError extends Error {
  constructor() {
    super();

    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MissingOverrideError.prototype);
  }
}
