export class BusinessError extends Error {
  constructor(
    public type: string,
    message: string,
    public data?: Record<string, any>,
  ) {
    super(message);
    this.type = type;
    this.data = data;
  }
}