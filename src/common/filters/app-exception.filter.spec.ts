import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';
import { AppExceptionFilter } from './app-exception.filter';

describe('AppExceptionFilter', () => {
  let filter: AppExceptionFilter;
  let mockResponse: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AppExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockHost = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/test' }),
        getResponse: () => mockResponse,
      }),
    } as any;
  });

  it('should handle CloudinaryException', () => {
    const cloudinaryError = {
      http_code: 400,
      message: 'Cloudinary failed',
      name: 'CloudinaryError',
    };

    filter.catch(cloudinaryError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      code: 'CloudinaryError',
      name: 'CloudinaryException',
      message: 'Cloudinary failed',
    });
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException(
      'Something bad',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      name: 'HttpException',
      code: ErrorCode.ERROR_MESSAGE,
      message: 'Something bad',
    });
  });

  it('should handle HttpException with object containing code', () => {
    const responseObj = { code: ErrorCode.PRODUCT_NOT_FOUND };
    const exception = new HttpException(responseObj, HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      name: 'HttpException',
      code: ErrorCode.PRODUCT_NOT_FOUND,
    });
  });

  it('should handle HttpException with object containing message only', () => {
    const responseObj = { message: 'Just a message' };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      name: 'HttpException',
      code: ErrorCode.ERROR_MESSAGE,
      message: 'Just a message',
    });
  });

  it('should handle HttpException with unknown structure', () => {
    const responseObj = { foo: 'bar' };
    const exception = new HttpException(responseObj, HttpStatus.CONFLICT);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      name: 'HttpException',
      code: ErrorCode.UNKNOWN_ERROR,
    });
  });

  it('should handle generic Error', () => {
    const error = new Error('Unexpected failure');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      name: 'Error',
      message: 'Unexpected failure',
    });
  });
});
