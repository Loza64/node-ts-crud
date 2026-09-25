# Node-TS Backend — Catálogo de Productos (Express + TypeORM + Postgres)

Backend en **Node.js + TypeScript + Express 5**, con **Arquitectura Hexagonal (Ports &
Adapters) / Clean Architecture**, persistencia real en **PostgreSQL** vía **TypeORM**, subida de
imágenes a **Cloudinary** protegida con **circuit breaker**, y un **job programado** que limpia
imágenes huérfanas. Modela un catálogo de productos con categorías y fotos.

> Este documento describe el código **tal como está implementado hoy** en `src/`, incluyendo las
> reglas de negocio exactas que aplica cada caso de uso — no es una plantilla genérica.

---

## Índice

1. [Stack técnico](#1-stack-técnico)
2. [Arquitectura](#2-arquitectura)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [API — Endpoints](#6-api--endpoints)
7. [Validación de entrada](#7-validación-de-entrada)
8. [Manejo de errores](#8-manejo-de-errores)
9. [Resiliencia: Circuit Breaker (Cloudinary)](#9-resiliencia-circuit-breaker-cloudinary)
10. [Fotos: subida, estados y limpieza automática](#10-fotos-subida-estados-y-limpieza-automática)
11. [Paginación y soft-delete](#11-paginación-y-soft-delete)
12. [Composition Root (inyección de dependencias)](#12-composition-root-inyección-de-dependencias)
13. [Arranque y apagado del servidor](#13-arranque-y-apagado-del-servidor)
14. [Configuración y variables de entorno](#14-configuración-y-variables-de-entorno)
15. [Base de datos y migraciones](#15-base-de-datos-y-migraciones)
16. [Swagger / OpenAPI](#16-swagger--openapi)
17. [Testing](#17-testing)
18. [Scripts de `package.json`](#18-scripts-de-packagejson)
19. [Cómo agregar un módulo nuevo](#19-cómo-agregar-un-módulo-nuevo)
20. [Deuda técnica conocida / próximos pasos](#20-deuda-técnica-conocida--próximos-pasos)

---

## 1. Stack técnico

| Categoría            | Tecnología                                              |
|-----------------------|-----------------------------------------------------------|
| Runtime                | Node.js                                                   |
| Lenguaje                | TypeScript 5.9                                            |
| Framework HTTP          | Express 5                                                 |
| Base de datos            | PostgreSQL, vía TypeORM 1.x (`DataSource` + repos)        |
| Almacenamiento de archivos | Cloudinary (SDK oficial), subida en memoria con Multer   |
| Resiliencia              | `opossum` (circuit breaker) sobre las llamadas a Cloudinary |
| Jobs programados        | `node-cron`                                               |
| Validación              | `class-validator` + `class-transformer`                   |
| Seguridad HTTP           | Helmet, CORS                                              |
| Logging                 | `morgan` (HTTP) + `debug` (namespaces internos)            |
| Documentación API        | `swagger-jsdoc` + `swagger-ui-express`, esquemas autogenerados desde los DTOs (`class-validator-jsonschema`) |
| Testing                 | Jest + `ts-jest` + Supertest                                |
| Lint                    | ESLint (flat config) + `typescript-eslint`                 |
| Gestor de paquetes       | pnpm                                                        |
| Dev runner               | `ts-node-dev` + `tsconfig-paths`                            |
| Build                   | `tsc` + `tsc-alias`                                          |

---

## 2. Arquitectura

Cada módulo de negocio (`category`, `product`, `photo`, `health`) se organiza en 3 capas:

```
src/modules/<modulo>/
├── domain/            # Entidades TypeORM + interfaces de repositorio (puertos). No conoce Express/TypeORM-repos concretos.
├── application/        # Casos de uso (Use Cases) y DTOs. Orquesta el dominio. No sabe de HTTP.
└── infrastructure/
    ├── http/            # Controllers + rutas Express (adaptador de entrada)
    └── persistence/      # Repositorios TypeORM concretos (adaptador de salida)
```

**Regla de dependencia**: `infrastructure` → depende de → `application` → depende de → `domain`.
Nunca al revés.

- **Puerto** = interfaz en `domain/` (ej. `PhotoRepository`, `FileStorage`).
- **Adaptador** = implementación concreta en `infrastructure/` (ej. `TypeOrmPhotoRepository`,
  `CloudinaryFileStorage`).

A diferencia de una plantilla con repositorio en memoria, acá los adaptadores de persistencia
**ya son reales**: `TypeOrmProductRepository`, `TypeOrmCategoryRepository`,
`TypeOrmPhotoRepository`, todos sobre un único `AppDataSource` (Postgres). El de almacenamiento
de archivos es `CloudinaryFileStorage`, envuelto en circuit breakers (sección 9).

Cada Use Case es una clase con un único método público `execute()`, recibe dependencias por
constructor (interfaces, no implementaciones) y no conoce `req`/`res`. Esto permite testear toda
la lógica de negocio con mocks, sin levantar Express ni Postgres (ver `*.spec.ts` en
`application/`).

### Composition Root

`src/composition-root.ts` es el único archivo que conoce simultáneamente las interfaces y sus
implementaciones concretas: instancia repositorios/adaptadores e inyecta "a mano" (constructor
injection, sin framework de DI) en use cases y controllers. Ver sección 12.

---

## 3. Estructura de carpetas

```
src/
├── @types/express/index.d.ts        # Extiende Request: `files?`, `validatedQuery?`
├── app.ts                           # createApp(): arma Express (helmet, cors, json, morgan, rutas, errorHandler)
├── app.spec.ts                      # Test de integración (supertest) contra la app real
├── composition-root.ts              # DI manual: instancia repos / use cases / controllers
├── index.ts                         # Entry point: conecta la BD, levanta el server, registra el cron, shutdown ordenado
├── swagger.ts                       # Arma el spec de swagger-jsdoc a partir de las rutas y los DTOs
├── interfaces/http/routes.ts        # Router raíz /api, monta cada módulo
├── modules/
│   ├── health/
│   │   └── infrastructure/http/health.routes.ts   # /health/hello, /health/circuit-breakers
│   ├── category/
│   │   ├── domain/category.entity.ts, category.repository.ts
│   │   ├── application/create|update|delete|restore|find-all|find-by-id + DTOs + category-rules.use-case.spec.ts
│   │   └── infrastructure/http/(controller|routes) · persistence/typeorm-category.repository.ts
│   ├── product/
│   │   ├── domain/product.entity.ts, product.repository.ts
│   │   ├── application/create|update|delete|restore|find-all|find-by-id + DTOs + product-references.ts (helpers compartidos)
│   │   └── infrastructure/http/(controller|routes) · persistence/typeorm-product.repository.ts
│   └── photo/
│       ├── domain/photo.entity.ts, photo.repository.ts
│       ├── application/upload-files, find-all, find-by-id, delete-photo, cleanup-orphan-photos + specs
│       └── infrastructure/http/(controller|routes, incluye alias legacy /files/upload) · persistence/typeorm-photo.repository.ts
└── shared/
    ├── config/env.ts, express.config.ts       # Env tipado + config de CORS/JSON/Multer
    ├── database/base.entity.ts, data-source.ts, migrations/
    ├── cloudinary/cloudinary.port.ts, cloudinary.adapter.ts, cloudinary.config.ts
    ├── resilience/circuit-breaker.factory.ts, circuit-breaker.registry.ts, circuit-breaker.errors.ts
    ├── scheduler/orphan-photos.scheduler.ts    # Cron del job de limpieza
    ├── dto/id-ref.dto.ts                        # { id: number } reutilizado en relaciones
    ├── errors/AppError.ts
    ├── logger/logger.ts                         # Namespaces de `debug`
    ├── middlewares/error-handler, upload-file, validate-dto, validate-query, validate-id-param
    ├── pagination/pagination.types.ts, pagination-query.dto.ts, paginate.util.ts, search.util.ts
    └── swagger/schemas.ts                       # Genera los `components.schemas` de swagger desde los DTOs
```

---

## 4. Modelo de datos

```
Category  1 ───── N  Product  N ───── N  Photo
  (RESTRICT)                    (product_photos, tabla intermedia)
```

- **Category** (`categories`): `id, createdAt, updatedAt, deletedAt, name, description`.
  Soft-deletable.
- **Product** (`products`): `id, createdAt, updatedAt, deletedAt, name, description, price
  (decimal 14,2), in_stock (bool), categoryId (FK, RESTRICT), photos (M:N)`. Soft-deletable.
  Índice compuesto `(category, deletedAt)`.
- **Photo** (`photos`): `id, createdAt, updatedAt, url, secureUrl, resourceType, format,
  originalFilename, width, height, bytes, tags (text[]), eager (jsonb), publicId (no
  seleccionable por default), attachedAt (nullable)`. **No** es soft-deletable — se borra en
  duro (`hardDelete`) porque va acompañada del borrado real del archivo en Cloudinary.
- Tabla intermedia `product_photos(productId, photoId)` generada por `@JoinTable` de TypeORM.

`Category.deletedAt`/`Product.deletedAt` usan `SoftDeletableEntity` con un índice parcial
`WHERE "deletedAt" IS NULL`, pensado para que las consultas del estado `active` (el caso más
común) sean rápidas.

---

## 5. Reglas de negocio

Esta es la sección central: qué permite y qué prohíbe cada caso de uso, tal como está
implementado.

### 5.1 Categorías (`Category`)

| Regla | Dónde se aplica |
|---|---|
| `name`: string, 2–120 caracteres, obligatorio en creación | `CreateCategoryDto` |
| `description`: string opcional, sin límite de longitud propio | `CreateCategoryDto` / `UpdateCategoryDto` |
| Actualizar solo toca los campos enviados (`undefined` = "no tocar") | `UpdateCategoryUseCase` |
| **No se puede eliminar una categoría que tiene productos activos** (no eliminados) — hay que borrarlos o reasignarlos de categoría primero | `DeleteCategoryUseCase` → `productRepository.existsByCategory(id)` → `409` |
| Eliminar es **soft-delete** (`deletedAt`), no destructivo | `DeleteCategoryUseCase` |
| Restaurar una categoría que no existe, o que no está eliminada, es un error | `RestoreCategoryUseCase` → `404` / `409` |
| A nivel de esquema, `Product.category` tiene `onDelete: 'RESTRICT'` — la base de datos también rechazaría un borrado físico de una categoría con productos, como segunda línea de defensa | `product.entity.ts` |

### 5.2 Productos (`Product`)

| Regla | Dónde se aplica |
|---|---|
| `name`: 2–150 caracteres, obligatorio en creación | `CreateProductDto` |
| `price`: número positivo, máximo 2 decimales, obligatorio en creación | `CreateProductDto` |
| `category`: obligatoria en creación, se referencia por `{ id }` y **debe existir** (si no, `404`) | `CreateProductUseCase` → `findCategoryOrFail` |
| `in_stock`: booleano, default `true` si no se envía | `CreateProductUseCase` |
| `photos`: opcional, array de `{ id }` sin ids repetidos (`ArrayUnique`); **todas** deben existir o falla con `404` listando los ids faltantes | `CreateProductDto` (validación) + `findPhotosOrFail` |
| Actualizar solo toca los campos enviados; `category`/`photos` solo se re-resuelven si vienen en el body | `UpdateProductUseCase` |
| **Al actualizar la lista de fotos**: las fotos que estaban antes y ya no están en la nueva lista se **borran de verdad** (Cloudinary + BD) mediante `DeletePhotoUseCase`, en paralelo (`Promise.allSettled`); si alguna falla, el producto igual queda actualizado pero la respuesta es `502` con el detalle de qué foto(s) no se pudieron soltar, para reintentar | `UpdateProductUseCase.deleteRemovedPhotos` |
| **Las fotos asociadas a un producto (por creación o actualización) quedan marcadas `attached`** (ver sección 10) — esto ocurre **después** de que el `save` del producto tiene éxito, nunca antes | `CreateProductUseCase`, `UpdateProductUseCase` |
| Eliminar es **soft-delete**; no borra las fotos asociadas (siguen `attached`, el producto se puede restaurar) | `DeleteProductUseCase` |
| **No se puede restaurar un producto cuya categoría está eliminada** — hay que restaurar la categoría primero | `RestoreProductUseCase` → `409` |
| Filtro por categoría y por texto (`name`/`description`, `ILIKE`) disponible en el listado | `product-query.dto.ts`, `TypeOrmProductRepository.findAll` |

### 5.3 Fotos (`Photo`)

| Regla | Dónde se aplica |
|---|---|
| Se suben **independientes** de cualquier producto: `POST /api/photos` acepta uno o varios archivos (`multipart/form-data`), obligatorio al menos uno | `UploadFilesUseCase`, `PhotoController.upload` → `400` si no llega ningún archivo |
| Cada archivo se sube a Cloudinary (carpeta `CLOUDINARY_FOLDER`, `resource_type: auto`, con una transformación *eager* de 400×400 recorte "fill") y se persiste el resultado completo (urls, dimensiones, bytes, tags, `publicId`) | `CloudinaryFileStorage.performUpload` |
| Toda foto nace en estado **`pending`** (`attachedAt = null`) hasta que un producto la referencia | `Photo` entity, `CreateProductUseCase`/`UpdateProductUseCase` |
| Borrar una foto es **irreversible y sincrónico con Cloudinary**: primero se destruye el asset remoto, y **solo si eso funciona** se borra la fila en BD. Si Cloudinary falla, la fila se conserva (queda "huérfana pero recuperable") y el error se propaga como `502`, para poder reintentar | `DeletePhotoUseCase` |
| Búsqueda de fotos por nombre de archivo o por tag (`ILIKE`/`unnest` sobre el array `tags`) | `TypeOrmPhotoRepository.findAll` |
| **Limpieza automática de huérfanas**: una foto `pending` con más de `ORPHAN_PHOTOS_MIN_AGE_MINUTES` desde su creación es candidata a borrado automático (ver sección 10) | `CleanupOrphanPhotosUseCase` + `orphan-photos.scheduler.ts` |

### 5.4 Resiliencia frente a Cloudinary

| Regla | Dónde se aplica |
|---|---|
| Toda llamada a Cloudinary (subir, destruir, poner tags) pasa por un **circuit breaker** independiente por operación | `CloudinaryFileStorage` |
| Un error 4xx de Cloudinary (`http_code < 500`, ej. archivo inválido) **no cuenta como falla** para el breaker — solo los 5xx/timeouts lo abren | `isClientError` + `errorFilter` |
| Con el circuito abierto, toda llamada nueva falla inmediato con `503` y un mensaje amigable, sin ni siquiera intentar la red | `CloudinaryFileStorage.fire` + `isCircuitBreakerFailure` |
| Umbrales configurables por entorno: timeout por llamada, % de error para abrir, tiempo antes de re-probar (half-open), volumen mínimo de llamadas antes de evaluar | `env.CB_*`, ver sección 14 |

### 5.5 Validación general (aplica a todos los módulos)

| Regla | Dónde se aplica |
|---|---|
| Cualquier `:id` de ruta debe ser un entero positivo (`1`–`2147483647`); si no, `400` antes de tocar el use case | `validateIdParam` |
| El body se valida contra el DTO correspondiente con `whitelist: true, forbidNonWhitelisted: true` — **cualquier campo extra no declarado en el DTO rechaza la request con 400** | `validateDTO` |
| Los query params (`page`, `pageSize`, `search`, `status`, `category`) se validan igual, vía `validateQuery` | `validate-query.middleware.ts` |
| `pageSize` tiene un techo de `100` | `PaginationQueryDto` |
| `status` de listados con soft-delete solo acepta `active | deleted | all` (default `active`) | `SoftDeleteQueryDto` |

---

## 6. API — Endpoints

Prefijo global: `/api`.

### Health

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health/hello` | Ping simple, `{ message: 'hello server' }` |
| GET | `/health/circuit-breakers` | Estado (`closed/open/halfOpen`) y estadísticas de cada circuit breaker registrado |

### Categorías (`/categories`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categories?page&pageSize&search&status` | Paginado, filtra por nombre/descripción y por estado de borrado |
| GET | `/categories/:id` | Detalle (`404` si no existe) |
| POST | `/categories` | Crea (`CreateCategoryDto`) |
| PATCH | `/categories/:id` | Actualiza parcial (`UpdateCategoryDto`) |
| PATCH | `/categories/:id/restore` | Restaura una eliminada |
| DELETE | `/categories/:id` | Soft-delete (`409` si tiene productos activos) |

### Productos (`/products`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/products?page&pageSize&search&status&category` | Paginado, incluye `category` y `photos` completos |
| GET | `/products/:id` | Detalle |
| POST | `/products` | Crea (`CreateProductDto`) — requiere `category.id`; `photos[].id` opcional |
| PATCH | `/products/:id` | Actualiza parcial (`UpdateProductDto`); reemplaza el set de fotos si se envía `photos` |
| PATCH | `/products/:id/restore` | Restaura uno eliminado (`409` si su categoría sigue eliminada) |
| DELETE | `/products/:id` | Soft-delete |

### Fotos (`/photos`, alias legacy `/files/upload`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/photos?page&pageSize&search` | Paginado, busca por nombre de archivo o tag |
| GET | `/photos/:id` | Detalle |
| POST | `/photos` (o `/files/upload`) | Sube uno o más archivos (`multipart/form-data`, campo `files`) |
| POST | `/photos/cleanup-orphans` | Dispara **manualmente** el job de limpieza de fotos `pending` vencidas (el mismo trabajo corre solo por cron) |
| DELETE | `/photos/:id` | Borra Cloudinary + BD (`502` si Cloudinary falla y no se pudo borrar) |

Todas las respuestas exitosas devuelven `{ data: ... }` (o `{ data, pagination }` en listados
paginados). Los errores devuelven `{ status, message }` (sección 8).

---

## 7. Validación de entrada

- `validateDTO(DtoClass)` — `shared/middlewares/validate-dto.middleware.ts`: convierte
  `req.body` a instancia de la clase con `plainToInstance`, corre `class-validator`
  (`whitelist + forbidNonWhitelisted`), y si hay errores responde `400` con los mensajes
  aplanados (incluye errores anidados, ej. `photos.0.id`).
- `validateQuery(DtoClass)` — mismo mecanismo, pero sobre `req.query`, dejando el resultado en
  `req.validatedQuery` (no pisa `req.query`, que Express 5 trata distinto).
- `validateIdParam` — se registra con `router.param('id', ...)`, corre antes que cualquier
  handler de la ruta.
- `IdRefDto` (`shared/dto/id-ref.dto.ts`) — `{ id: number entero positivo }`, reutilizado para
  referenciar `category`/`photos` en los DTOs de producto sin duplicar la validación.

---

## 8. Manejo de errores

- `AppError` (`shared/errors/AppError.ts`): error "operacional" con `statusCode` propio y
  `isOperational`, conserva el stack trace real.
- Cualquier use case puede lanzar `throw new AppError('mensaje', <status>)`.
- `errorHandler` (middleware final, montado al final de `app.ts`):
  - Si es `AppError` → responde con su `statusCode` y mensaje tal cual, y lo loguea como
    "operational error" (nivel `debug`, no ruido en producción salvo que `DEBUG` esté activo).
  - Si es cualquier otro error → responde `500`; el mensaje real solo se expone si
    `NODE_ENV=development`, en producción se oculta el detalle (`Internal server error`).

Formato estándar:
```json
{ "status": 404, "message": "Producto no encontrado" }
```

---

## 9. Resiliencia: Circuit Breaker (Cloudinary)

`shared/resilience/circuit-breaker.factory.ts` centraliza la config de `opossum` para **toda**
llamada a un servicio externo (hoy, solo Cloudinary vía `CloudinaryFileStorage`, que crea 3
breakers independientes: `cloudinary.upload`, `cloudinary.destroy`, `cloudinary.setTags`).

- **Estados**: `closed` (normal) → `open` (corta llamadas de inmediato) → `halfOpen` (deja pasar
  una llamada de prueba tras `resetTimeout`) → vuelve a `closed` o `open` según el resultado.
- **`errorFilter: isClientError`**: un 4xx de Cloudinary no cuenta como falla del breaker — solo
  problemas reales del servicio (5xx, timeout) lo abren. Esto evita que un usuario mandando un
  archivo inválido tumbe el circuito para todos los demás.
- Con el circuito abierto, `CloudinaryFileStorage.fire` detecta el error de `opossum`
  (`EOPENBREAKER`/`ETIMEDOUT`/`ESHUTDOWN`/`ESEMLOCKED` vía `isCircuitBreakerFailure`) y lo
  traduce a un `AppError(503, "...no está disponible en este momento...")` amigable para el
  cliente, en vez de dejar pasar el error crudo de `opossum`.
- `circuit-breaker.registry.ts` mantiene un registro global de todos los breakers creados, con
  sus estadísticas (fires, successes, failures, rejects, timeouts, latencia media) — expuesto en
  `GET /api/health/circuit-breakers` para monitoreo.

---

## 10. Fotos: subida, estados y limpieza automática

Este es el diseño que resuelve el problema de **imágenes huérfanas**: el usuario sube fotos
antes de guardar el formulario del producto; si el guardado falla o el formulario se cierra sin
guardar, esas fotos quedan subidas a Cloudinary y persistidas en BD sin dueño.

### Ciclo de vida de una `Photo`

```
[POST /photos]                [POST/PATCH product con photos: [{id}]]
      │                                      │
      ▼                                      ▼
  attachedAt = null   ───────────────►  attachedAt = now()
     "pending"          (solo si el save          "attached"
                          del producto
                          tuvo éxito)
      │
      │  (si sigue "pending" más de ORPHAN_PHOTOS_MIN_AGE_MINUTES)
      ▼
  CleanupOrphanPhotosUseCase la encuentra (findOrphans) y la borra
  (Cloudinary + BD) vía DeletePhotoUseCase — igual que un borrado manual.
```

- **`markAttached(ids)`** se llama **después** de que `productRepository.save()` tuvo éxito, en
  `CreateProductUseCase` y `UpdateProductUseCase`. Si el guardado del producto falla (error de
  validación de negocio, de BD, lo que sea), esa llamada nunca ocurre y las fotos simplemente
  siguen `pending` — el job de limpieza las recoge solo, sin que el frontend tenga que hacer
  nada especial.
- **`findOrphans(olderThan)`** trae las fotos con `attachedAt IS NULL AND createdAt < olderThan`,
  usando el índice parcial `IDX_photos_pending` (`WHERE attached_at IS NULL`) para que la
  consulta sea barata incluso con muchas fotos.
- El período de gracia (`ORPHAN_PHOTOS_MIN_AGE_MINUTES`, default 60) existe para no borrar una
  foto que el usuario acaba de subir y todavía está llenando el formulario.

### El job (`shared/scheduler/orphan-photos.scheduler.ts`)

- Usa `node-cron`, con la expresión de `ORPHAN_PHOTOS_CRON` (default `0 * * * *`, cada hora).
- Guard `running` para que dos corridas no se pisen si una limpieza tarda más que el intervalo.
- Se registra en `index.ts` al arrancar el servidor, y se detiene (`task.stop()`) en el shutdown
  ordenado (`SIGINT`/`SIGTERM`).
- `CleanupOrphanPhotosUseCase.execute()` también es invocable a mano vía
  `POST /api/photos/cleanup-orphans` — mismo código, útil para operar o probar sin esperar al
  cron. Devuelve `{ scanned, deleted, failed: [{ photoId, reason }] }`.
- Los fallos individuales (ej. Cloudinary no responde para una foto puntual) no abortan el resto
  del lote — se recolectan con `Promise.allSettled` y se loguean, la foto simplemente se
  reintenta en la próxima corrida.

---

## 11. Paginación y soft-delete

- `PaginationQueryDto` (`page` ≥ 1, `pageSize` 1–100) y `SearchQueryDto` (+ `search`, máx. 100
  caracteres) son la base de todos los listados.
- `SoftDeleteQueryDto` (+ `status: active | deleted | all`, default `active`) la usan
  `category` y `product`. `photo` no la usa porque no es soft-deletable.
- `paginateRepository` (`shared/pagination/paginate.util.ts`) envuelve `nestjs-typeorm-paginate`
  y normaliza la metadata a `{ page, pageSize, pageCount, total }`.
- `search.util.ts`:
  - `iLikeContains(search)` — arma un `ILIKE '%term%'` escapando `\ % _` para que el texto del
    usuario no rompa el patrón.
  - `deletedAtCondition(status)` — traduce `status` a la condición `where` correspondiente
    (`active` no agrega nada porque TypeORM ya filtra soft-deleted por default; `deleted` exige
    `deletedAt IS NOT NULL`; `all` se combina con `withDeleted: true` en la query).

---

## 12. Composition Root (inyección de dependencias)

`src/composition-root.ts` → `buildContainer()`:

1. Instancia los 3 repositorios TypeORM (`category`, `photo`, `product`), todos sobre el mismo
   `AppDataSource`.
2. Instancia `CloudinaryFileStorage` y todos los use cases de `photo`, incluido
   `CleanupOrphanPhotosUseCase` (recibe el repo, `DeletePhotoUseCase` y
   `env.ORPHAN_PHOTOS_MIN_AGE_MINUTES`).
3. Instancia los use cases de `category`, inyectando `productRepository` donde hace falta
   validar reglas cruzadas (`DeleteCategoryUseCase`).
4. Instancia los use cases de `product`, inyectando `categoryRepository`/`photoRepository`
   donde hace falta resolver relaciones (`findCategoryOrFail`/`findPhotosOrFail` en
   `product-references.ts`) y `deletePhotoUseCase` para soltar fotos removidas al actualizar.
5. Arma los 3 controllers y los devuelve junto con `cleanupOrphanPhotosUseCase` (este último se
   usa en `index.ts` para registrar el cron, fuera del ciclo request/response de Express).

`app.ts` llama `buildContainer()` una vez al crear la app y monta las rutas de cada módulo bajo
`/api` (`interfaces/http/routes.ts`).

---

## 13. Arranque y apagado del servidor

`src/index.ts`:

1. `AppDataSource.initialize()` — conecta a Postgres. Si falla, se loguea (`errorLog`, visible
   solo con `DEBUG=nodets:*`) y el proceso sale con `process.exit(1)`.
2. `app.listen(env.PORT, ...)`.
3. Se construye **un segundo container** (`buildContainer()`) solo para extraer
   `cleanupOrphanPhotosUseCase` y registrar el cron — así el scheduler no depende de tocar
   `app.ts`, que sigue siendo reusable tal cual en `app.spec.ts` sin efectos secundarios de cron.
4. **Shutdown ordenado** en `SIGINT`/`SIGTERM`: para el cron (`orphanPhotosJob.stop()`), cierra
   el servidor HTTP (`server.close()`), destruye la conexión a la base (`AppDataSource.destroy()`)
   y recién ahí sale del proceso.

---

## 14. Configuración y variables de entorno

Todo tipado y centralizado en `shared/config/env.ts` (usa `dotenv`).

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4000` | Puerto HTTP |
| `ORIGIN` | *(vacío → `*`)* | Origen(es) permitidos por CORS, separados por coma; si está seteado, habilita `credentials: true` |
| `NODE_ENV` | `development` | Controla `isDev` (sincronización automática de esquema, logging SQL, detalle de errores 500) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `5432` / `postgres` / `postgres` / `app_db` | Conexión a Postgres |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | *(vacío)* | Credenciales de Cloudinary — **obligatorias** para que la subida de fotos funcione |
| `CLOUDINARY_FOLDER` | `uploads` | Carpeta destino en Cloudinary |
| `CB_TIMEOUT_MS` | `8000` | Timeout por llamada antes de que el breaker la cuente como falla |
| `CB_ERROR_THRESHOLD_PERCENTAGE` | `50` | % de fallas en la ventana que abre el circuito |
| `CB_RESET_TIMEOUT_MS` | `15000` | Tiempo en `open` antes de pasar a `halfOpen` y probar de nuevo |
| `CB_VOLUME_THRESHOLD` | `5` | Mínimo de llamadas en la ventana antes de evaluar el % de error |
| `ORPHAN_PHOTOS_CRON` | `0 * * * *` | Expresión cron del job de limpieza (cada hora) |
| `ORPHAN_PHOTOS_MIN_AGE_MINUTES` | `60` | Minutos de gracia antes de considerar `pending` a una foto como huérfana |

Nota: `DEBUG=nodets:*` no es una variable de `env.ts`, sino la que activa la salida de la
librería `debug` — ya viene seteada en el script `dev` de `package.json`.

---

## 15. Base de datos y migraciones

- `AppDataSource` (`shared/database/data-source.ts`): Postgres, `synchronize: env.isDev`
  (en dev el esquema se sincroniza solo desde las entidades; en producción **no**, hay que
  correr migraciones), `logging: env.isDev` (loguea cada SQL ejecutado en dev).
- Migraciones en `src/shared/database/migrations/`, compiladas a `build/.../migrations/*.js`
  (así apunta `AppDataSource.migrations`):
  - `AddSearchIndexes` — extensión `pg_trgm` + índices GIN para búsqueda por similitud en
    `name`/`description` de productos y categorías, `original_filename` de fotos, y el array
    `tags`.
  - `AddAttachedAtToPhotos` — agrega `photos.attached_at`, marca como "attached" las fotos que
    ya existían antes del cambio (para no romper el dato retroactivamente), y crea el índice
    parcial `IDX_photos_pending` que usa el job de limpieza.
- `BaseEntity` (`id`, `createdAt`, `updatedAt`) y `SoftDeletableEntity` (+ `deletedAt`, con
  índice parcial `WHERE "deletedAt" IS NULL`) son las clases base de todas las entidades.

---

## 16. Swagger / OpenAPI

- `swagger.ts` arma el spec con `swagger-jsdoc`, leyendo los bloques `@swagger` de cada
  `*.routes.ts` (`src/modules/**/infrastructure/http/*.routes.ts` en dev, `build/...js` en
  producción).
- `shared/swagger/schemas.ts` genera automáticamente los `components.schemas` a partir de los
  decoradores de `class-validator` en los DTOs (`validationMetadatasToSchemas`), importando
  explícitamente cada DTO para que sus metadatos queden registrados antes de generar el spec.
- Montado en `app.ts` bajo `/api-docs` (`swagger-ui-express`).
- El `info.title`/`description` del spec (`swagger.ts`) todavía dice **"LexBridge API"** —
  quedó de una plantilla anterior y no describe este proyecto; ver sección 20.

---

## 17. Testing

Jest + `ts-jest`, un `*.spec.ts` junto a cada archivo que prueba. Los que ya existen:

| Archivo | Qué cubre |
|---|---|
| `app.spec.ts` | Integración end-to-end con `supertest` contra la app real (validaciones de DTO, códigos de estado) |
| `category-rules.use-case.spec.ts` | Reglas de negocio de categoría (borrar con productos activos, restaurar, etc.) |
| `create-product.dto.spec.ts` | Validación del DTO de creación de producto |
| `create-product.use-case.spec.ts` | Lógica de creación de producto (categoría/fotos inexistentes, defaults) |
| `restore-product.use-case.spec.ts` | Regla "no restaurar si la categoría sigue eliminada" |
| `delete-photo.use-case.spec.ts` | Borrado de foto: Cloudinary ok/falla, `AppError` propagado tal cual (ej. 503 del breaker) |
| `cleanup-orphan-photos.use-case.spec.ts` | Job de limpieza: sin huérfanas, período de gracia respetado, borrado en lote, fallos parciales reportados sin abortar |
| `cloudinary.adapter.spec.ts` | Adaptador de Cloudinary envuelto en circuit breaker |
| `circuit-breaker.factory.spec.ts` | Config y comportamiento del breaker en sí |

```bash
pnpm test          # correr todos los tests
pnpm run test:watch
```

---

## 18. Scripts de `package.json`

| Script | Comando | Uso |
|---|---|---|
| `pnpm run dev` | `cross-env DEBUG=nodets:* ts-node-dev -r tsconfig-paths/register src/index.ts` | Desarrollo con recarga en caliente y logs de `debug` visibles |
| `pnpm run build` | `tsc && tsc-alias -p tsconfig.json` | Compila a `build/`, resolviendo los imports absolutos |
| `pnpm start` | `node build/index.js` | Corre el build de producción |
| `pnpm test` | `jest` | Corre todos los tests |
| `pnpm run test:watch` | `jest --watch` | Tests en modo watch |
| `pnpm run lint` | `eslint "src/**/*.ts"` | Lint sobre todo `src/` |
| `pnpm run swagger` | `ts-node-dev src/swagger.ts` | Genera/valida el spec de swagger de forma aislada |

---

## 19. Cómo agregar un módulo nuevo

1. `domain/<modulo>.entity.ts` (entidad TypeORM, extiende `BaseEntity` o
   `SoftDeletableEntity` según corresponda) + `domain/<modulo>.repository.ts` (interfaz/puerto).
2. `application/create-<modulo>.dto.ts`, `update-<modulo>.dto.ts` + los use cases
   (`create/update/delete/restore/find-all/find-by-id`, según aplique).
3. `infrastructure/persistence/typeorm-<modulo>.repository.ts` implementando el puerto sobre
   `AppDataSource.getRepository(<Entidad>)`.
4. `infrastructure/http/<modulo>.controller.ts` + `<modulo>.routes.ts` (con los bloques
   `@swagger` correspondientes).
5. Registrar todo en `composition-root.ts` (instanciar e inyectar) y montar el router en
   `interfaces/http/routes.ts`.
6. Si el módulo tiene DTOs, importarlos en `shared/swagger/schemas.ts` para que aparezcan en
   `/api-docs`.

---

## 20. Deuda técnica conocida / próximos pasos

- **Sin autenticación**: no hay ninguna capa de auth/autorización todavía; todos los endpoints,
  incluido `POST /photos/cleanup-orphans`, están abiertos. Si se agrega, ese endpoint en
  particular debería quedar restringido a rol admin/interno.
- **Fotos huérfanas por hard-delete futuro de producto**: hoy `Product` solo tiene soft-delete,
  así que una foto `attached` de un producto eliminado nunca queda huérfana (el producto se
  puede restaurar). Si en el futuro se agrega un borrado físico de productos, haría falta
  liberar (volver a `pending`, o borrar directamente) las fotos que quedaban asociadas
  únicamente a ese producto.
- **`swagger.ts` tiene título/descripción de otro proyecto** ("LexBridge API") — cosmético, pero
  vale la pena actualizarlo para que `/api-docs` describa este backend.
- **Múltiples instancias**: si el backend llega a correr detrás de un load balancer con más de
  una réplica, cada instancia registra su propio cron de limpieza de fotos y podrían pisarse
  entre sí (nada grave — el `DeletePhotoUseCase` es idempotente frente a un `404`, pero es
  trabajo duplicado). En ese escenario conviene mover el cron a un proceso/worker separado o a
  un scheduler externo que le pegue al endpoint manual.