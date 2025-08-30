import { SetMetadata } from '@nestjs/common';

export const JWT_OPTIONS_KEY = 'jwt:options';
export const JwtOptions = (...options: string[]) =>
  SetMetadata(JWT_OPTIONS_KEY, options);
