import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorData {
  code: string;
  details?: any;
  message?: string;
}

interface CloudinaryException {
  http_code: number;
  message: string;
  name: string;
}

function isCloudinaryException(error: unknown): error is CloudinaryException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'http_code' in error &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const { method, url } = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      this.logger.error(exception);
    }

    if (isCloudinaryException(exception)) {
      const status = exception.http_code;
      const code = exception.name;
      const name = 'CloudinaryException';
      const message = exception.message;

      this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

      response.status(status).json({ code, name, message });

      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const name = exception.name;

      let errorData: ErrorData = {
        code: 'UNKNOWN_ERROR',
      };

      if (typeof res === 'string') {
        errorData = { code: 'ERROR_MESSAGE', message: res };
      } else if (typeof res === 'object' && res !== null) {
        if ('code' in res) {
          errorData = res as ErrorData;
        } else if ('message' in res && typeof res.message === 'string') {
          errorData = { code: 'ERROR_MESSAGE', message: res.message };
        }
      }

      this.logger.error(
        `${method} ${url} - ${status} - ${name}: ${JSON.stringify(errorData)}`,
      );

      response.status(status).json({ name, ...errorData });

      return;
    }

    const error = exception as Error;
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const code = 'INTERNAL_ERROR';
    const name = error.name;
    const message = error.message || 'Internal server error';

    this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

    response.status(status).json({ code, name, message });
  }
}
