import { NO_ENV_FILE_ERROR } from '../constants';
export class MissingEnvFileError extends Error {
  public badpath;

  constructor(badpath) {
    super(NO_ENV_FILE_ERROR);

    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MissingEnvFileError.prototype);
    this.badpath = badpath;
  }
}
