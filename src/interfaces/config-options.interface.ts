export interface ConfigOptions {
  /**
   * Name of the environment variable used to determine the current
   * `environment`.  Defaults to `NODE_ENV`.  For example, if `NODE_ENV` has
   * a current value of `production`, the ConfigManager will look for a file
   * named `production.env`.
   *
   * Specify any valid environment variable, such as `ENVIRONMENT`, to provide
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
   * Should the ConfigManager force a process exit on any errors found
   * (e.g., missing required env vars, env vars that fail validation, other
   * configuration errors such as `.env` file not found)?
   *
   * Defaults to `true`.
   *
   * If `false`, ConfigManager will throw an exception on error.
   */
  exitOnError?: boolean;

  /**
   * If false, throws/exits on missing `.env` file
   * If true, proceeds to load from just the external environment.
   *
   */
  allowMissingEnvFile?: boolean;
}
