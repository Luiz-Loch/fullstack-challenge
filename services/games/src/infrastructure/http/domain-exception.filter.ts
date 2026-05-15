import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RoundNotFoundError } from '@/domain/errors/round-not-found.error';
import { RoundNotCrashedError } from '@/domain/errors/round-not-crashed.error';

@Catch(RoundNotFoundError, RoundNotCrashedError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: RoundNotFoundError | RoundNotCrashedError, host: ArgumentsHost): void {
    const status = exception instanceof RoundNotFoundError
      ? HttpStatus.NOT_FOUND
      : HttpStatus.UNPROCESSABLE_ENTITY;

    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
