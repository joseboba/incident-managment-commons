// NestJS imports
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

// Third-party imports
import { AxiosError, AxiosResponse } from 'axios';

// Custom file imports
import { BusinessError } from '../common';

@Injectable()
export class AdapterErrorValidation {
  private readonly _loggerService = new Logger(AdapterErrorValidation.name);
  constructor() {}

  public execute(error: AxiosError<any>) {
    this._loggerService.error(
      `[AdapterErrorValidation] - Handling error: ${error.message}`,
    );

    try {
      if (error.response) {
        return this.handleHttpResponseError(error);
      }

      const message = error.message ?? 'UNKNOWN_MESSAGE';
      const code = (error as any).code ?? 'UNKNOWN_CODE';
      const errResponse = error.response as AxiosResponse<any> | undefined;

      const errorDetails = {
        message,
        code,
        data: errResponse?.data,
        status: errResponse?.status,
      };

      this._loggerService.error(
        `[AdapterErrorValidation] - Error communicating with service: ${JSON.stringify(errorDetails)}`,
      );

      throw new ServiceUnavailableException(
        'Communication with the service failed',
      );
    } catch (unknownError: any) {
      this._loggerService.error(
        `[AdapterErrorValidation] - Unknown error occurred: ${unknownError?.message}`,
        unknownError?.stack,
      );
      throw unknownError;
    }
  }

  private handleHttpResponseError(error: AxiosError<any>) {
    const response = error.response as AxiosResponse<any> | undefined;

    if (!response) {
      throw new InternalServerErrorException();
    }

    const data = (response.data ?? {}) as {
      error?: { type: string; message: string };
    };

    if (response.status === 404) {
      throw new NotFoundException();
    }

    if (!data.error) {
      throw new InternalServerErrorException();
    }

    const { type, message } = data.error;

    if (this.isBusinessError(type)) {
      this._loggerService.error(
        `[AdapterErrorValidation] - Is a business error: ${JSON.stringify({ type, message })}`,
      );
      throw new BusinessError(type, message);
    }

    this._loggerService.error(
      `[AdapterErrorValidation] - Http error: ${JSON.stringify({
        message,
        status: response.status,
      })}`,
    );

    throw new HttpException(message, response.status);
  }

  private isBusinessError(type: string): boolean {
    return type.split('.').length === 2;
  }
}
