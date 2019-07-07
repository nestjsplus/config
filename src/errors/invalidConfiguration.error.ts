export class InvalidConfigurationError extends Error {
  private missingKeys;
  private validationErrors;

  constructor(missingKeys, validationErrors) {
    super('Invalid Configuration');

    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidConfigurationError.prototype);
    this.missingKeys = missingKeys;
    this.validationErrors = validationErrors;
  }
}
