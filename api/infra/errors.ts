export interface ErrorJSON {
  name: string;
  message: string;
  action: string;
  statusCode: number;
}

export interface InternalServerErrorParams {
  cause?: unknown;
  statusCode?: number;
}

export interface ServiceErrorParams {
  cause?: unknown;
  message?: string;
}

export class InternalServerError extends Error {
  public override name: string;
  public readonly action: string;
  public readonly statusCode: number;

  constructor({ cause, statusCode }: InternalServerErrorParams = {}) {
    super("An unexpected error ocurred", {
      cause,
    });

    this.name = "InternalServerError";
    this.action = "Please contact support";
    this.statusCode = statusCode || 500;
  }

  toJSON(): ErrorJSON {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  public override name: string;
  public readonly action: string;
  public readonly statusCode: number;

  constructor({ cause, message }: ServiceErrorParams = {}) {
    super(message || "Service unavailable at the moment", {
      cause,
    });

    this.name = "InternalServerError";
    this.action = "Check the service availability";
    this.statusCode = 503;
  }

  toJSON(): ErrorJSON {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  public override name: string;
  public readonly action: string;
  public readonly statusCode: number;

  constructor() {
    super("Method not allowed");

    this.name = "MethodNotAllowedError";
    this.action = "Check the documentation to verify the allowed methods";
    this.statusCode = 405;
  }

  toJSON(): ErrorJSON {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}
