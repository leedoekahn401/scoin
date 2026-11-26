# Express helpers: rules and usage

Every route in `apps/api` is built from the same small set of helpers. This page lists the rules
(**MUST** / **MUST NOT**), then shows how to use each helper. A working mock-up that uses all of them
lives in [`apps/api/src/modules/examples`](../../apps/api/src/modules/examples) (see [Mock-up API](#mock-up-api)).

| Helper                                                                           | File                                                                              | For                                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `route()`                                                                        | [`common/http/route.ts`](../../apps/api/src/common/http/route.ts)                 | Declaring an endpoint (auth, roles, zod, OpenAPI)     |
| `badRequest` `unauthenticated` `forbidden` `notFound` `conflict` `ruleViolation` | [`common/errors/http-errors.ts`](../../apps/api/src/common/errors/http-errors.ts) | Throwing errors with the right status and code        |
| `ensureFound` `isUniqueViolation`                                                | same                                                                              | Null → 404; detecting Prisma P2002                    |
| `currentUser` `param` `idParam` `parsedQuery`                                    | [`common/http/request.ts`](../../apps/api/src/common/http/request.ts)             | Reading the request without `!` or `String()`         |
| `pageQuery` `paginate` `pageArgs`                                                | [`common/http/query.ts`](../../apps/api/src/common/http/query.ts)                 | `?page&pageSize` → `{ items, page, pageSize, total }` |
| `dateRangeQuery` `dateRange`                                                     | same                                                                              | `?from&to` Vietnam days → Prisma `{ gte, lt }`        |
| `openSse`                                                                        | [`common/http/sse.ts`](../../apps/api/src/common/http/sse.ts)                     | Server-Sent Events streams                            |

## Rules

### Routes

1. **MUST** declare every endpoint with `route()`. Never call `router.get/post(...)` directly: you would
   skip the rate limit, authentication, validation and the OpenAPI document.
2. **MUST** give `roles` from `PERMISSIONS` in `@schoolcoin/types` on every non-public route. Never
   write a role list inline.
3. **MUST** validate input with zod through `body` / `query`. Import `z` from `common/zod`, never from
   `'zod'`, so `.openapi()` exists.
4. **MUST** keep handlers to one line: read the request with the helpers below, call a service, return
   its result. `route()` sends it as JSON with the right status. No business logic in routes.
5. **MUST NOT** call `res.json()` / `res.status()` in a handler. Return the value; set `status` in the
   spec (`201` is the POST default, use `status: 200` for actions, `204` for deletes). The one
   exception is a streaming handler that uses `openSse`.
6. **MUST** set `hidden: true` on anything that is not part of the public contract (dev and example
   routes), so `pnpm api:generate` does not put it in `packages/api-client`.

### Errors

7. **MUST** throw, never return, an error. Use the factories: `throw notFound('Top-up')`. Never
   `res.status(404).json(...)`.
8. **MUST** pick the status by meaning:

   | Situation                                                  | Helper                               | Status |
   | ---------------------------------------------------------- | ------------------------------------ | ------ |
   | Input zod cannot check (cross-field, malformed path param) | `badRequest(msg, details?)`          | 400    |
   | No or invalid credentials                                  | `unauthenticated()`                  | 401    |
   | Signed in, but not allowed to touch this record            | `forbidden(msg?)`                    | 403    |
   | Record does not exist (or is not visible to the caller)    | `notFound('Entity')` / `ensureFound` | 404    |
   | Clashes with existing data (duplicate email, code…)        | `conflict(code, msg, details?)`      | 409    |
   | Valid input refused by a business rule (BR-xx, FR-xx)      | `ruleViolation(code, msg, details?)` | 422    |

9. **MUST** use an `ErrorCode` from `packages/types/src/error-codes.ts`. Front ends switch on the code,
   not the message. A new rule that needs a new code adds it there first.
10. **MUST** put the numbers the UI needs in `details` (`{ min, max }`, `{ stock, requested }`), not
    only in the message.
11. **MUST NOT** catch errors just to rethrow or log them. The global `errorHandler` turns `AppError`,
    `ZodError` and malformed JSON into `{ error: { code, message, details } }` and logs everything else.

### Request data

12. **MUST** use `currentUser(req)` instead of `req.user!`.
13. **MUST** read ids with `idParam(req)` (or `idParam(req, 'studentId')`) instead of
    `String(req.params.id)`. A malformed id becomes a 400 instead of a Prisma 500.
14. **MUST** read a validated query with `parsedQuery(req, schema)`. **MUST NOT** parse `req.query`
    again: `route()` already replaced it with the parsed value, and coerced or transformed fields
    (`z.stringbool()`, defaults) fail a second pass.
15. **MUST** remember query strings are text: use `z.coerce.number()` for numbers and `z.stringbool()`
    for booleans in `query` schemas. Bodies are JSON, so use plain `z.number()` / `z.boolean()` there.

### Lists and dates

16. **MUST** return paginated lists as `Paginated<T>` (`{ items, page, pageSize, total }`) through
    `paginate()`, and accept `?page&pageSize` with `pageQuery` (defaults 1 and 20, max 100).
17. **MUST** filter dates with `dateRangeQuery` + `dateRange()`. Days are Asia/Ho_Chi_Minh calendar
    days and `to` is inclusive. Never build day boundaries with `new Date('YYYY-MM-DD')` (that is UTC
    midnight, 07:00 in Vietnam).
18. **MUST** keep money in integer credits (`z.number().int()`); convert with `common/utils/money.ts`.

### Streams (SSE)

19. **MUST** run every check that can fail (auth, `idParam`, `ensureFound`) **before** `openSse(res)`.
    After the headers are sent an error can no longer become a JSON error response.
20. **MUST** remove every listener in `stream.onClose(...)`. A client that disconnects otherwise leaks
    the listener for the life of the process.

## How to use

### A typical module

```ts
// students.routes.ts
route(studentsRouter, {
  method: 'get',
  path: '/admin/students',
  name: 'list',
  tag,
  roles: PERMISSIONS.STUDENTS,
  query: listStudentsQuery,
  handler: (req) => studentsService.list(parsedQuery(req, listStudentsQuery)),
});

route(studentsRouter, {
  method: 'get',
  path: '/admin/students/:id',
  name: 'get',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: (req) => studentsService.get(idParam(req)),
});
```

```ts
// dto/list-students.dto.ts
export const listStudentsQuery = z.object({
  ...pageQuery.shape,
  ...dateRangeQuery.shape,
  className: z.string().optional(),
  active: z.stringbool().optional(),
});
export type ListStudentsQuery = z.infer<typeof listStudentsQuery>;
```

Compose query schemas by spreading `.shape`. Do not `.refine()` them: zod 4 refuses to extend a refined
object. Cross-field checks belong in the service (`dateRange()` already rejects `from` after `to`).

### Errors in a service

```ts
async get(id: string) {
  return ensureFound(await this.prisma.student.findUnique({ where: { id } }), 'Student');
}

async create(dto: CreateStudentDto) {
  try {
    return await this.prisma.student.create({ data: dto });
  } catch (err) {
    if (isUniqueViolation(err, 'code')) {
      throw conflict('STUDENT_CODE_TAKEN', 'Student code already exists', { code: dto.code });
    }
    throw err;
  }
}

async deactivate(id: string) {
  const wallet = ensureFound(await this.prisma.wallet.findUnique({ where: { studentId: id } }), 'Wallet');
  if (wallet.balanceCredits !== 0) {
    throw ruleViolation('STUDENT_HAS_BALANCE', 'Refund the balance first (BR-14)', {
      balanceCredits: wallet.balanceCredits,
    });
  }
  // …
}
```

`ensureFound` narrows the type, so no `!` is needed afterwards.

### Pagination with Prisma

```ts
async list(query: ListStudentsQuery): Promise<Paginated<Student>> {
  const where = {
    className: query.className,
    active: query.active,
    createdAt: dateRange(query),
  } satisfies Prisma.StudentWhereInput;

  return paginate(
    query,
    (page) => this.prisma.student.findMany({ where, orderBy: { createdAt: 'desc' }, ...page }),
    () => this.prisma.student.count({ where }),
  );
}
```

`paginate` runs the page and the count in parallel. `dateRange({})` returns `{}`, which Prisma treats as
no filter.

### Server-Sent Events

```ts
route(topupsRouter, {
  method: 'get',
  path: '/parent/topups/:id/events',
  name: 'events',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: async (req, res) => {
    const topUp = await topupsService.get(currentUser(req).id, idParam(req)); // may 403/404: before the stream

    const stream = openSse(res);
    // paymentEvents: whichever emitter fires when a payment lands
    const onPaid = (id: string) => {
      if (id !== topUp.id) return;
      stream.send('PAID', { id });
      stream.close();
    };
    paymentEvents.on('paid', onPaid);
    stream.onClose(() => paymentEvents.off('paid', onPaid));
  },
});
```

`openSse` sets the headers, sends a `: ping` comment every 15 s so proxies keep the connection open,
and calls the `onClose` callbacks whether the client leaves or you call `close()`.

## Mock-up API

`apps/api/src/modules/examples` is an in-memory "snack shelf" that uses every helper above. It needs no
database, is mounted only when `NODE_ENV` is not `production`, and is hidden from the OpenAPI document.

| Endpoint                                 | Shows                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /api/v1/examples/snacks`            | `pageQuery` + `dateRangeQuery` + `z.stringbool()`, `parsedQuery`, `paginate` |
| `GET /api/v1/examples/snacks/:id`        | `idParam` (400 on a malformed id), `ensureFound` (404)                       |
| `POST /api/v1/examples/snacks`           | `roles`, `body`, `currentUser`, `conflict` (409 on a duplicate name)         |
| `PATCH /api/v1/examples/snacks/:id`      | Partial body schema                                                          |
| `DELETE /api/v1/examples/snacks/:id`     | `status: 204`, `forbidden` (only the creator or an admin)                    |
| `POST /api/v1/examples/snacks/:id/buy`   | `ruleViolation('ITEM_UNAVAILABLE')` (422 with `details`), `throttle`         |
| `GET /api/v1/examples/snacks/:id/events` | `openSse`: checks first, one `updated` event, listener removed on close      |

The tests in `examples.routes.spec.ts` drive each one over HTTP (`pnpm --filter @schoolcoin/api test examples`).

### Try it

Sign-in is not built yet, so mint a dev token from `apps/api` (uses `JWT_ACCESS_SECRET` from `.env`):

```bash
TOKEN=$(node --env-file=.env -e "console.log(require('jsonwebtoken').sign({sub:'11111111-1111-4111-8111-111111111111',email:'manager@schoolcoin.local',role:'CAFE_MANAGER'},process.env.JWT_ACCESS_SECRET,{expiresIn:'1h'}))")
```

```bash
curl -s -X POST localhost:4000/api/v1/examples/snacks -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Bánh mì","priceCredits":15,"stock":3}'
```

```bash
curl -s "localhost:4000/api/v1/examples/snacks?page=1&pageSize=10&available=true" -H "Authorization: Bearer $TOKEN"
```

```bash
curl -s -X POST localhost:4000/api/v1/examples/snacks/<id>/buy -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"quantity":5}'
```

The last one answers `422 { "error": { "code": "ITEM_UNAVAILABLE", "message": "Only 3 left", "details": { "stock": 3, "requested": 5 } } }`.
To watch the stream, run `curl -N localhost:4000/api/v1/examples/snacks/<id>/events -H "Authorization: Bearer $TOKEN"`
in one terminal and `PATCH` the snack from another.
