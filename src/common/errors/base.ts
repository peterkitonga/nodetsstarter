export default class BaseError extends Error {
  public constructor(
    public name: string,
    public statusCode: number,
    public isOperational: boolean,
    public description: string,
  ) {
    super(description);

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
