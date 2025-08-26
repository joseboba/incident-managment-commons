// NestJS imports
import { JwtService } from '@nestjs/jwt';
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  imports: [],
  providers: [JwtService],
  exports: [JwtService],
})
export class IncidentManagementSharedModule {}
