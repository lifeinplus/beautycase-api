import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface CloudinaryError {
  http_code: number;
  message: string;
  name: string;
}

function isCloudinaryError(error: unknown): error is CloudinaryError {
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

    if (isCloudinaryError(exception)) {
      const name = 'CloudinaryError';
      const message = exception.message;
      const status = exception.http_code;

      this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

      response.status(status).json({
        name,
        message,
        success: false,
      });

      return;
    }

    if (exception instanceof HttpException) {
      const name = exception.name;
      const message = exception.message;
      const status = exception.getStatus();

      this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

      response.status(status).json({
        message: message,
        stack: isProduction ? undefined : exception.stack,
        success: false,
      });

      return;
    }

    const error = exception as Error;
    const name = error.name;
    const message = error.message || 'Internal server error';
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`${method} ${url} - ${status} - ${name}: ${message}`);

    response.status(status).json({
      message: message,
      stack: isProduction ? undefined : error.stack,
      success: false,
    });
  }
}
