import { HttpStatus } from '@nestjs/common';

export const GLOBAL_ERRORS = {
  INVALID_REQUEST: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'INVALID_REQUEST',
    message: 'Invalid request',
  },
  ROUTE_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'ROUTE_NOT_FOUND',
    message: 'Route not found',
  },
  TOO_MANY_REQUESTS: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorCode: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please try again later.',
  },
  RESOURCE_CONFLICT: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'RESOURCE_CONFLICT',
    message: 'Resource already exists',
  },
  RESOURCE_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
  },
  DATABASE_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 'DATABASE_ERROR',
    message: 'Database error',
  },
  UNKNOWN_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 'UNKNOWN_ERROR',
    message: 'Unknown error',
  },
} as const;
