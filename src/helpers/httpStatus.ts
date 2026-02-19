import { FastifyReply, FastifyRequest } from 'fastify';
import { 
  HttpStatusCode, 
  getStatusMessage,
  isSuccess 
} from '@/utils/httpStatusCodes.util';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

export interface ValidationErrorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  errors: ValidationError[];
  requestId?: string;
}

export class FastifyResponseHelper {
  static ok<T>(reply: FastifyReply, data: T, message = 'Success', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: true, message, data, statusCode: HttpStatusCode.OK }, request);
  }

  static created<T>(reply: FastifyReply, data: T, message = 'Created successfully', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: true, message, data, statusCode: HttpStatusCode.CREATED }, request);
  }

  static accepted<T>(reply: FastifyReply, data: T, message = 'Accepted', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: true, message, data, statusCode: HttpStatusCode.ACCEPTED }, request);
  }

  static noContent(reply: FastifyReply): void {
    reply.code(HttpStatusCode.NO_CONTENT).send();
  }

  // 4xx Client Errors
  static badRequest(reply: FastifyReply, message = 'Bad Request', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.BAD_REQUEST }, request);
  }

  static validationError(reply: FastifyReply, errors: ValidationError[], message = 'Validation failed', request?: FastifyRequest): void {
    const response: ValidationErrorResponse = {
      success: false,
      message,
      statusCode: HttpStatusCode.BAD_REQUEST,
      errors,
      ...(request && (request as any).requestId && { requestId: (request as any).requestId }),
    };
    reply.code(HttpStatusCode.BAD_REQUEST).send(response);
  }

  static unauthorized(reply: FastifyReply, message = 'Unauthorized', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.UNAUTHORIZED }, request);
  }

  static forbidden(reply: FastifyReply, message = 'Forbidden', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.FORBIDDEN }, request);
  }

  static notFound(reply: FastifyReply, message = 'Not Found', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.NOT_FOUND }, request);
  }

  static conflict(reply: FastifyReply, message = 'Conflict', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.CONFLICT }, request);
  }

  static unprocessableEntity(reply: FastifyReply, message = 'Unprocessable Entity', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY }, request);
  }

  static tooManyRequests(reply: FastifyReply, message = 'Too Many Requests', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.TOO_MANY_REQUESTS }, request);
  }

  // 5xx Server Errors
  static internalServerError(reply: FastifyReply, message = 'Internal Server Error', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }, request);
  }

  static serviceUnavailable(reply: FastifyReply, message = 'Service Unavailable', request?: FastifyRequest): void {
    this.sendResponse(reply, { success: false, message, statusCode: HttpStatusCode.SERVICE_UNAVAILABLE }, request);
  }

  // Generic response with any status code
  static send<T>(reply: FastifyReply, statusCode: number, data?: T, message?: string, request?: FastifyRequest): void {
    const success = isSuccess(statusCode);
    const msg = message || getStatusMessage(statusCode);
    this.sendResponse(reply, { success, message: msg, data, statusCode }, request);
  }

  static body<T>(request: FastifyRequest): T {
    return request.body as T;
  }

  static params<T>(request: FastifyRequest): T {
    return request.params as T;
  }

  static query<T>(request: FastifyRequest): T {
    return request.query as T;
  }

  static requestId(request: FastifyRequest): string | undefined {
    // Fastify does not have requestId by default, but you can add it via hooks/middleware
    // @ts-ignore
    return request.requestId;
  }

  private static sendResponse<T>(reply: FastifyReply, options: ApiResponse<T>, request?: FastifyRequest): void {
    const response: ApiResponse<T> = {
      success: options.success,
      message: options.message,
      data: options.data,
      statusCode: options.statusCode,
      ...(request && (request as any).requestId && { requestId: (request as any).requestId }),
    };
    reply.code(options.statusCode).send(response);
  }
}
