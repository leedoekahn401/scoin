import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

/** Every route() call registers here; served at /docs-json for `pnpm api:generate`. */
export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});
registry.registerComponent('securitySchemes', 'cookie', {
  type: 'apiKey',
  in: 'cookie',
  name: 'refresh_token',
});
registry.registerComponent('securitySchemes', 'kiosk-device', {
  type: 'apiKey',
  in: 'header',
  name: 'X-Kiosk-Key',
});
registry.registerComponent('securitySchemes', 'kiosk-session', {
  type: 'apiKey',
  in: 'header',
  name: 'X-Kiosk-Session',
});

export type SecurityScheme = 'bearer' | 'cookie' | 'kiosk-device' | 'kiosk-session';

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'SchoolCoin API', version: '1.0' },
  });
}
