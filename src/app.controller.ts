import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('default')
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Returns health status information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-09T09:26:03.000Z' },
        version: { type: 'string', example: '1.0.0' },
        env: { type: 'string', example: 'development' },
      },
    },
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      env: process.env.NODE_ENV || 'development',
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Returns pong response',
    schema: {
      type: 'object',
      properties: {
        pong: { type: 'boolean', example: true },
        timestamp: { type: 'string', example: '2025-01-09T09:26:03.000Z' },
      },
    },
  })
  ping() {
    return {
      pong: true,
      timestamp: new Date().toISOString(),
    };
  }
}
