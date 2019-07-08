export interface ConfigOptions {
  /**
   * Name of the environment variable used to determine the current
   * `environment`.  Defaults to `NODE_ENV`.  For example, if `NODE_ENV` has
   * a current value of `production`, and you're using the `useEnv` method,
   * the ConfigManager will look for a file named `production.env`.
   *
   * The useFunction method passes the value of `environment` so that it may
   * be used in constructing a custom `.env` file name.
   *
   * Specify any valid environment variable, such as `MYENVIRONMENT`, to provide
   * an alternative source for deriving the current `environment` value.
   */
  envKey?: string;

  /**
   * Name a file to use explicitly for the `.env` file.  If specified,
   * the `useEnv` option is ignored
   */
  useFile?: string;

  /**
   * Use an environment variable to locate the `.env` file.
   */
  useEnv?: {
    /**
     * Name of the folder, relative to the project root directory, containing
     * the `.env` file.
     *
     * Defaults to the project root directory.
     */
    folder?: string;
  };

  /**
   * Provide a function that builds a full path to the `.env` file.
   *
   * @param rootFolder root folder
   * @param environment environment
   * @returns full path to `.env` file
   */
  useFunction?: (rootFolder: string, environment: string) => string;

  /**
   * Should the ConfigManager allow extra variables in the `.env` file?
   * Defaults to false.
   */
  allowExtras?: boolean;

  /**
   * How should the ConfigManager handle errors found during validation
   * (e.g., missing required env vars, env vars that fail validation, other
   * configuration errors such as `.env` file not found)?
   *
   * Options:
   * - 'exit' - application/process exits (default)
   * - 'throw' - throw `invalidConfigurationError` with
   *   properties `missingKeys` and `validatinError` identifying the validation
   *   failures.  Useful for running tests, as it's easier to trap than exit.
   * - 'continue' - application bootstrapping continues; configuration is invalid,
   *   so any application state that depends on a valid configuration may fail
   */
  onError?: string;

  /**
   * If false, throws/exits on missing `.env` file
   * If true, proceeds to load from just the external environment.
   *
   */
  allowMissingEnvFile?: boolean;
}
