import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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
      const name = 'CloudinaryException';
      const message = exception.message;

      this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

      response.status(status).json({ status, name, message });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const name = exception.name;

      let message: string | string[] = 'An unexpected error occurred';

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        message = res.message as string | string[];
      }

      this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

      response.status(status).json({ status, name, message });
      return;
    }

    const error = exception as Error;
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const name = error.name;
    const message = error.message || 'Internal server error';

    this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

    response.status(status).json({ status, name, message });
  }
}
