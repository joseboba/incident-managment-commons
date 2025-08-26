// NestJS imports
import { isObject } from '@nestjs/common/utils/shared.utils';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

// Third-party imports
import { Request, Response } from 'express';

// Custom file imports
import { BusinessError } from '../common';

export interface ErrorDetail {
  type: string;
  message: string | object;
  timestamp: string;
  path: string;
  method: string;
  data?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

interface ErrorWithData {
  data?: Record<string, unknown>;
}

@Catch(BusinessError, HttpException, Error)
export class CustomExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(CustomExceptionFilter.name);
  constructor() {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const errorHandler = ErrorHandlerFactory.create(
      this._logger,
      exception,
      request,
      response,
    );
    return errorHandler.handle();
  }
}

abstract class GenericErrorHandler<T extends Error> {
  constructor(
    protected readonly _logger: Logger,
    protected readonly exception: T,
    protected readonly request,
    protected readonly response,
  ) {}

  abstract httpStatus: number;
  abstract errorType: string;
  abstract errorMessage: string | Record<string, any>;

  public handle() {
    this.logError();
    const errorResponse: ErrorResponse = { error: this.getErrorDetail() };
    return this.response.status(this.httpStatus).json(errorResponse);
  }

  abstract logError();

  public getErrorDetail(): ErrorDetail {
    const baseDetail = {
      type: this.errorType,
      message: this.errorMessage,
      timestamp: new Date().toISOString(),
      path: this.request.url,
      method: this.request.method,
    };

    // Type guard check
    if (this.hasData(this.exception)) {
      return { ...baseDetail, data: this.exception.data };
    }

    return baseDetail;
  }

  private hasData(error: Error): error is Error & ErrorWithData {
    return (
      'data' in error &&
      (error as ErrorWithData).data !== undefined &&
      typeof (error as ErrorWithData).data === 'object'
    );
  }
}

class UnknownErrorHandler extends GenericErrorHandler<Error> {
  override httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
  override errorType = 'InternalServerError';
  override errorMessage = 'Internal server error';

  override logError() {
    this._logger.error(
      this.exception.message,
      this.exception.stack,
      `${this.request.method} ${this.request.url}`,
    );
  }
}

class HttpErrorHandler extends GenericErrorHandler<HttpException> {
  override httpStatus: number = this.exception.getStatus();
  override errorType: string = this.exception.name;
  override errorMessage: string | object = this.getErrorMessage();

  override logError() {
    this._logger.error(
      `${JSON.stringify(this.getErrorDetail())}`,
      '',
      `${this.request.method} ${this.request.url}`,
    );
  }

  private getErrorMessage(): string | object {
    if (this.isValidationPipe(this.exception.getResponse())) {
      return this.exception.getResponse()['message'];
    }

    if (isObject(this.exception.getResponse())) {
      return this.exception.getResponse();
    }

    return this.exception.message;
  }

  private isValidationPipe(responseInException: any) {
    return (
      isObject(responseInException) &&
      responseInException['message'] != undefined
    );
  }
}

class BusinessErrorHandler extends GenericErrorHandler<BusinessError> {
  override httpStatus: number = HttpStatus.BAD_REQUEST;
  override errorType: string = this.exception.type;
  override errorMessage: string = this.exception.message;

  override logError() {
    this._logger.error(
      `${JSON.stringify(this.getErrorDetail())}`,
      '',
      `${this.request.method} ${this.request.url}`,
    );
  }
}

class ErrorHandlerFactory {
  public static create(_logger: Logger, exception: Error, request, response) {
    if (exception instanceof HttpException)
      return new HttpErrorHandler(_logger, exception, request, response);
    else if (exception instanceof BusinessError)
      return new BusinessErrorHandler(_logger, exception, request, response);
    else return new UnknownErrorHandler(_logger, exception, request, response);
  }
}
