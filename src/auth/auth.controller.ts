import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
