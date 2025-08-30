// NestJS imports
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

// Third-party imports
import { Observable } from 'rxjs';

// Custom file imports
import { IS_PUBLIC_KEY, JWT_OPTIONS_KEY } from '../decorators';
import { BaseJwtPayload } from '../common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private _reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) throw err || new UnauthorizedException();

    const required = this._reflector.getAllAndOverride<string[]>(
      JWT_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return user;

    const payload = user as unknown as BaseJwtPayload;
    const have = new Set(payload.authorities ?? []);
    const ok = required.every((opt) => have.has(opt));

    if (!ok) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return user;
  }
}
