import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { ClienteService } from '../../cliente/cliente.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly clienteService: ClienteService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    const cliente = await this.clienteService.findOrCreateFromGoogle({
      googleId: id,
      email: emails[0].value,
      nombre: name.givenName,
      apellido: name.familyName || '',
      photoUrl: photos?.[0]?.value,
    });

    done(null, cliente);
  }
}
