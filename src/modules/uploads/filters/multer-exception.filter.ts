import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import { MulterError } from 'multer';

import { ErrorCode } from 'src/common/enums/error-code.enum';

@Catch(PayloadTooLargeException)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    throw new PayloadTooLargeException({
      code: ErrorCode.PAYLOAD_TOO_LARGE,
      message: exception.message,
    });
  }
}
