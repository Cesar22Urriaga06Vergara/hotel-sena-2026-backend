import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosController } from './usuarios.controller';
import { ClienteModule } from '../cliente/cliente.module';
import { EmpleadoModule } from '../empleado/empleado.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ClienteModule,
    EmpleadoModule,
    
    // Configurar Passport
    PassportModule,
    
    // Configurar JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UsuariosController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}