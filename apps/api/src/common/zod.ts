import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Import z from here, not from 'zod', so `.openapi()` exists whatever loads first.
extendZodWithOpenApi(z);

export { z };
