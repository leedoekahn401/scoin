import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { currentUser, idParam, parsedQuery } from '../../common/http/request';
import { route } from '../../common/http/route';
import { openSse } from '../../common/http/sse';
import {
  buySnackSchema,
  createSnackSchema,
  listSnacksQuery,
  updateSnackSchema,
} from './dto/snack.dto';
import { examplesService, type Snack } from './examples.service';

/**
 * Mock-up API for docs/api/express-utils.md: every helper in use on an in-memory resource.
 * app.ts mounts it outside production only; `hidden` keeps it out of the api-client contract.
 */
export const examplesRouter = Router();
const tag = 'examples';
const hidden = true;

/** ?page&pageSize&from&to&q&available → { items, page, pageSize, total } */
route(examplesRouter, {
  method: 'get',
  path: '/examples/snacks',
  name: 'list',
  tag,
  hidden,
  query: listSnacksQuery,
  handler: (req) => examplesService.list(parsedQuery(req, listSnacksQuery)),
});

route(examplesRouter, {
  method: 'get',
  path: '/examples/snacks/:id',
  name: 'get',
  tag,
  hidden,
  handler: (req) => examplesService.get(idParam(req)),
});

route(examplesRouter, {
  method: 'post',
  path: '/examples/snacks',
  name: 'create',
  tag,
  hidden,
  roles: PERMISSIONS.MENU_AND_CASHIERS,
  body: createSnackSchema,
  handler: (req) => examplesService.create(currentUser(req).id, req.body),
});

route(examplesRouter, {
  method: 'patch',
  path: '/examples/snacks/:id',
  name: 'update',
  tag,
  hidden,
  roles: PERMISSIONS.MENU_AND_CASHIERS,
  body: updateSnackSchema,
  handler: (req) => examplesService.update(idParam(req), req.body),
});

route(examplesRouter, {
  method: 'delete',
  path: '/examples/snacks/:id',
  name: 'remove',
  tag,
  hidden,
  roles: PERMISSIONS.MENU_AND_CASHIERS,
  status: 204,
  handler: (req) => examplesService.remove(currentUser(req), idParam(req)),
});

/** {quantity} → {snackId, quantity, totalCredits, stockLeft}, or 422 ITEM_UNAVAILABLE. */
route(examplesRouter, {
  method: 'post',
  path: '/examples/snacks/:id/buy',
  name: 'buy',
  tag,
  hidden,
  body: buySnackSchema,
  status: 200,
  throttle: 30,
  handler: (req) => examplesService.buy(idParam(req), req.body),
});

/** SSE: one `updated` event with the snack, then the stream closes (the top-up PAID pattern). */
route(examplesRouter, {
  method: 'get',
  path: '/examples/snacks/:id/events',
  name: 'events',
  tag,
  hidden,
  handler: async (req, res) => {
    const id = idParam(req);
    await examplesService.get(id); // 404 now, while a JSON error can still be sent

    const stream = openSse(res);
    const onUpdated = (snack: Snack) => {
      if (snack.id !== id) return;
      stream.send('updated', snack);
      stream.close();
    };
    examplesService.events.on('updated', onUpdated);
    stream.onClose(() => examplesService.events.off('updated', onUpdated));
  },
});
