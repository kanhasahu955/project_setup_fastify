
// ============================================
// 1xx Informational Responses
// ============================================
export const HTTP_CONTINUE = 100;
export const HTTP_SWITCHING_PROTOCOLS = 101;
export const HTTP_PROCESSING = 102;
export const HTTP_EARLY_HINTS = 103;

// ============================================
// 2xx Success
// ============================================
export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_ACCEPTED = 202;
export const HTTP_NON_AUTHORITATIVE_INFORMATION = 203;
export const HTTP_NO_CONTENT = 204;
export const HTTP_RESET_CONTENT = 205;
export const HTTP_PARTIAL_CONTENT = 206;
export const HTTP_MULTI_STATUS = 207;
export const HTTP_ALREADY_REPORTED = 208;
export const HTTP_IM_USED = 226;

// ============================================
// 3xx Redirection
// ============================================
export const HTTP_MULTIPLE_CHOICES = 300;
export const HTTP_MOVED_PERMANENTLY = 301;
export const HTTP_FOUND = 302;
export const HTTP_SEE_OTHER = 303;
export const HTTP_NOT_MODIFIED = 304;
export const HTTP_USE_PROXY = 305;
export const HTTP_TEMPORARY_REDIRECT = 307;
export const HTTP_PERMANENT_REDIRECT = 308;

// ============================================
// 4xx Client Errors
// ============================================
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_PAYMENT_REQUIRED = 402;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_METHOD_NOT_ALLOWED = 405;
export const HTTP_NOT_ACCEPTABLE = 406;
export const HTTP_PROXY_AUTHENTICATION_REQUIRED = 407;
export const HTTP_REQUEST_TIMEOUT = 408;
export const HTTP_CONFLICT = 409;
export const HTTP_GONE = 410;
export const HTTP_LENGTH_REQUIRED = 411;
export const HTTP_PRECONDITION_FAILED = 412;
export const HTTP_PAYLOAD_TOO_LARGE = 413;
export const HTTP_URI_TOO_LONG = 414;
export const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
export const HTTP_RANGE_NOT_SATISFIABLE = 416;
export const HTTP_EXPECTATION_FAILED = 417;
export const HTTP_IM_A_TEAPOT = 418;
export const HTTP_MISDIRECTED_REQUEST = 421;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_LOCKED = 423;
export const HTTP_FAILED_DEPENDENCY = 424;
export const HTTP_TOO_EARLY = 425;
export const HTTP_UPGRADE_REQUIRED = 426;
export const HTTP_PRECONDITION_REQUIRED = 428;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431;
export const HTTP_UNAVAILABLE_FOR_LEGAL_REASONS = 451;

// ============================================
// 5xx Server Errors
// ============================================
export const HTTP_INTERNAL_SERVER_ERROR = 500;
export const HTTP_NOT_IMPLEMENTED = 501;
export const HTTP_BAD_GATEWAY = 502;
export const HTTP_SERVICE_UNAVAILABLE = 503;
export const HTTP_GATEWAY_TIMEOUT = 504;
export const HTTP_HTTP_VERSION_NOT_SUPPORTED = 505;
export const HTTP_VARIANT_ALSO_NEGOTIATES = 506;
export const HTTP_INSUFFICIENT_STORAGE = 507;
export const HTTP_LOOP_DETECTED = 508;
export const HTTP_NOT_EXTENDED = 510;
export const HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511;

// ============================================
// Status Code Object (for lookup)
// ============================================
export const HttpStatusCode = {
  // 1xx Informational
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  EARLY_HINTS: 103,

  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  ALREADY_REPORTED: 208,
  IM_USED: 226,

  // 3xx Redirection
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
} as const;

export type HttpStatusCodeType = typeof HttpStatusCode[keyof typeof HttpStatusCode];

// ============================================
// Status Messages (for responses)
// ============================================
export const HttpStatusMessage: Record<number, string> = {
  // 1xx Informational
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',

  // 2xx Success
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',

  // 3xx Redirection
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',

  // 4xx Client Errors
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',

  // 5xx Server Errors
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the message for a status code
 */
export function getStatusMessage(code: number): string {
  return HttpStatusMessage[code] || 'Unknown Status';
}

/**
 * Check if status code is informational (1xx)
 */
export function isInformational(code: number): boolean {
  return code >= 100 && code < 200;
}

/**
 * Check if status code is success (2xx)
 */
export function isSuccess(code: number): boolean {
  return code >= 200 && code < 300;
}

/**
 * Check if status code is redirection (3xx)
 */
export function isRedirection(code: number): boolean {
  return code >= 300 && code < 400;
}

/**
 * Check if status code is client error (4xx)
 */
export function isClientError(code: number): boolean {
  return code >= 400 && code < 500;
}

/**
 * Check if status code is server error (5xx)
 */
export function isServerError(code: number): boolean {
  return code >= 500 && code < 600;
}

/**
 * Check if status code is an error (4xx or 5xx)
 */
export function isError(code: number): boolean {
  return code >= 400;
}

/**
 * Get status code category
 */
export function getStatusCategory(code: number): string {
  if (isInformational(code)) return 'Informational';
  if (isSuccess(code)) return 'Success';
  if (isRedirection(code)) return 'Redirection';
  if (isClientError(code)) return 'Client Error';
  if (isServerError(code)) return 'Server Error';
  return 'Unknown';
}
