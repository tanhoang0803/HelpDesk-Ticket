import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code       = 'INTERNAL_ERROR';
    let message    = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        code    = (res['code'] as string)    ?? exception.constructor.name.replace('Exception', '').toUpperCase();
        message = (res['message'] as string) ?? exception.message;
      } else {
        message = exceptionResponse as string;
        code    = exception.constructor.name.replace('Exception', '').toUpperCase();
      }
    }

    response.status(statusCode).json({
      success: false,
      error: { code, message, statusCode },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
