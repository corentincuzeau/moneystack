import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, GoogleUser } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  googleLogin() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as GoogleUser;
    const validatedUser = await this.authService.validateGoogleUser(user);
    const tokens = await this.authService.generateTokens(
      validatedUser.id,
      validatedUser.email,
      validatedUser.name,
    );

    // Redirect to frontend with tokens
    const webUrl = this.configService.get<string>('app.webUrl', 'http://localhost:5173');
    const redirectUrl = `${webUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&expiresIn=${tokens.expiresIn}`;

    return res.redirect(redirectUrl);
  }

  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google ID token for app tokens (mobile)' })
  @ApiResponse({ status: 200, description: 'Tokens generated successfully' })
  async googleTokenExchange(@Body() body: { idToken: string; user: GoogleUser }) {
    // For mobile apps, validate the ID token with Google and create/get user
    const validatedUser = await this.authService.validateGoogleUser(body.user);
    const tokens = await this.authService.generateTokens(
      validatedUser.id,
      validatedUser.email,
      validatedUser.name,
    );

    return {
      user: {
        id: validatedUser.id,
        email: validatedUser.email,
        name: validatedUser.name,
        avatarUrl: validatedUser.avatarUrl,
      },
      tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout/all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: JwtPayload) {
    await this.authService.revokeAllUserTokens(user.sub);
    return { message: 'Logged out from all devices' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      name: user.name,
    };
  }
}
