export default class BaseError extends Error {
  public constructor(
    public name: string,
    public statusCode: number,
    public description: string,
    public data?: unknown,
  ) {
    super(description);

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
