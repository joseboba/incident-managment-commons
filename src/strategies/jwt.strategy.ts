// NestJS imports
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

// Third-party imports
import { ExtractJwt, Strategy } from 'passport-jwt';

// Custom file imports
import { BaseJwtPayload } from '../common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  validate(payload: BaseJwtPayload) {
    return payload;
  }
}
