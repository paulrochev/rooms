import Fastify, { type FastifyError } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import { STATUS_CODES } from 'node:http'
import prismaPlugin from './plugins/prisma.js'
import { Type as T } from 'typebox'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { ValidationProblem, ProblemDetails, User, Health } from './types.js'
// Этот модуль собирает все настройки Fastify: плагины инфраструктуры, обработчики ошибок и маршруты API.
/**
 * Создает и настраивает экземпляр Fastify, готовый к запуску.
 */
export async function buildApp() {
  const app = Fastify({
    logger: true, // Подключаем встроенный логгер Fastify.
    trustProxy: true, // Разрешаем доверять заголовкам X-Forwarded-* от прокси/ingress.
    /**
     * Схема валидации TypeBox -> Fastify генерирует массив ошибок.
     * Мы превращаем его в ValidationProblem, чтобы вернуть клиенту единый формат Problem Details.
     */
    schemaErrorFormatter(errors, dataVar) {
      const msg = errors.map((e) => e.message).filter(Boolean).join('; ') || 'Validation failed'
      return new ValidationProblem(msg, errors, dataVar)
    }
  }).withTypeProvider<TypeBoxTypeProvider>() // Позволяет Fastify понимать типы TypeBox при описании схем.
  // === Инфраструктурные плагины ===
  // Helmet добавляет безопасные HTTP-заголовки (Content-Security-Policy, X-DNS-Prefetch-Control и др.).
  await app.register(helmet)
  // CORS ограничивает кросс-доменные запросы. Здесь полностью запрещаем их (origin: false) по умолчанию.
  await app.register(cors, {
    origin: ["https://paulrochev.github.io"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: 100, // Максимум 100 запросов
    timeWindow: '1 minute', // За одну минуту
    enableDraftSpec: true, // Добавляет стандартные RateLimit-* заголовки в ответ
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    },
    errorResponseBuilder(request, ctx) {
      const seconds = Math.ceil(ctx.ttl / 1000)
      return {
        type: 'about:blank',
        title: 'Too Many Requests',
        status: 429,
        detail: `Rate limit exceeded. Retry in ${seconds} seconds.`,
        instance: request.url
      } satisfies ProblemDetails
    }
  })
  /**
   * Документация API в формате OpenAPI 3.0.
   */
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Rooms API',
        version: '1.0.0',
        description: 'HTTP-API, совместим с RFC 9457.'
      },
      servers: [{ url: 'http://localhost:3000' }],
      tags: [
        { name: 'Users', description: 'Маршруты для управления пользователями' },
        { name: 'System', description: 'Служебные эндпоинты' }
      ]
    }
  })
  // Плагин с PrismaClient: открывает соединение с БД и добавляет app.prisma во все маршруты.
  await app.register(prismaPlugin)
  // === Глобальные обработчики ошибок ===
  /**
   * Единая точка обработки ошибок. Мы приводим их к Problem Details и отправляем клиенту JSON.
   * ValidationProblem превращается в 400, остальные ошибки хранят свой статус или получают 500.
   */
  app.setErrorHandler<FastifyError | ValidationProblem>((err, req, reply) => {
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500
    const isValidation = err instanceof ValidationProblem
    const problem = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
      detail: err.message || 'Unexpected error',
      instance: req.url,
      ...(isValidation ? { errorsText: err.message } : {})
    }
    reply.code(status).type('application/problem+json').send(problem)
  })
  // Отдельный обработчик 404: отвечает в формате Problem Details.
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).type('application/problem+json').send({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} not found`,
      instance: request.url
    } satisfies ProblemDetails)
  })

  const BookingDto = T.Object({
    id: T.String(),
    organizerName: T.String(),
    roomId: T.String(),
    startTime: T.String({ format: "date-time" }),
    endTime: T.String({ format: "date-time" }),
    room: T.Optional(
        T.Object({
          number: T.String(),
        })
    ),
  })

  const BookingCreateBody = T.Object({
    organizerName: T.String({ minLength: 1 }),
    roomId: T.String({ minLength: 1 }),
    startTime: T.String({ format: "date-time" }),
    endTime: T.String({ format: "date-time" }),
  })

  const BookingUpdateBody = T.Partial(BookingCreateBody)

  function parseDateOrNull(s: string) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }


  // === Маршруты API ===
  /**
   * GET /api/users — примеры чтения данных из базы через Prisma.
   */
  app.get(
    '/api/users',
    {
      schema: {
        operationId: 'listUsers',
        tags: ['Users'],
        summary: 'Возвращает список пользователей',
        description: 'Получаем id и email для каждого пользователя.',
        response: {
          200: {
            description: 'Список пользователей',
            content: { 'application/json': { schema: T.Array(User) } }
          },
          429: {
            description: 'Too Many Requests',
            headers: {
              'retry-after': {
                schema: T.Integer({ minimum: 0, description: 'Через сколько секунд можно повторить запрос' })
              }
            },
            content: { 'application/problem+json': { schema: ProblemDetails } }
          },
          500: {
            description: 'Internal Server Error',
            content: { 'application/problem+json': { schema: ProblemDetails } }
          }
        }
      }
    },
    async (_req, _reply) => {
      // Prisma автоматически превращает результат в Promise; Fastify вернет массив как JSON.
      return app.prisma.user.findMany({ select: { id: true, email: true } })
    }
  )
  /**
   * GET /api/health — health-check для мониторинга.
   * Пытаемся сделать минимальный запрос в БД. Если БД недоступна, возвращаем 503.
   */
  app.get(
    '/api/health',
    {
      schema: {
        operationId: 'health',
        tags: ['System'],
        summary: 'Health/Readiness',
        description: 'Проверяет, что процесс жив и база данных отвечает.',
        response: {
          200: {
            description: 'Ready',
            content: { 'application/json': { schema: Health } }
          },
          503: {
            description: 'Temporarily unavailable',
            content: { 'application/problem+json': { schema: ProblemDetails } }
          },
          429: {
            description: 'Too Many Requests',
            headers: {
              'retry-after': { schema: T.Integer({ minimum: 0 }) }
            },
            content: { 'application/problem+json': { schema: ProblemDetails } }
          },
          500: {
            description: 'Internal Server Error',
            content: { 'application/problem+json': { schema: ProblemDetails } }
          }
        }
      }
    },
    async (_req, reply) => {
      try {
        // Если SELECT 1 прошел — сервис готов.
        await app.prisma.$queryRaw`SELECT 1`
        return { ok: true } as Health
      } catch {
        // Возвращаем 503, чтобы условный балансировщик мог вывести инстанс из ротации.
        reply.code(503).type('application/problem+json').send({
          type: 'https://example.com/problems/dependency-unavailable',
          title: 'Service Unavailable',
          status: 503,
          detail: 'Database ping failed',
          instance: '/api/health'
        } satisfies ProblemDetails)
      }
    }
  )
  // Служебный маршрут: возвращает OpenAPI-спецификацию.
  app.get(
    '/openapi.json',
    {
      schema: { hide: true, tags: ['Internal'] } // Скрыт из списка, но доступен для клиентов/тестов
    },
    async (_req, reply) => {
      reply.type('application/json').send(app.swagger())
    }
  )

  app.get(
      "/api/bookings",
      {
        schema: {
          operationId: "listBookings",
          tags: ["Bookings"],
          summary: "Возвращает список бронирований",
          description: "Получаем основные данные всех бронирований.",
          querystring: T.Optional(
              T.Object({
                active: T.Optional(T.String()),
              })
          ),
          response: {
            200: {
              description: "Список бронирований",
              content: { "application/json": { schema: T.Array(BookingDto) } },
            },
            429: {
              description: "Too Many Requests",
              headers: {
                "retry-after": { schema: T.Integer({ minimum: 0 }) },
              },
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            500: {
              description: "Internal Server Error",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
          },
        },
      },
      async (req) => {
        const now = new Date()

        const bookings = await app.prisma.booking.findMany({
          orderBy: { startTime: "desc" },
          select: {
            id: true,
            organizerName: true,
            roomId: true,
            startTime: true,
            endTime: true,
            room: { select: { number: true } },
          },
        })

        return bookings.map((b) => ({
          id: b.id,
          organizerName: b.organizerName,
          roomId: b.roomId,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          ...(b.room ? { room: { number: b.room.number } } : {}),
        }))
      }
  )

  app.get(
      "/api/bookings/:id",
      {
        schema: {
          operationId: "getBookingById",
          tags: ["Bookings"],
          summary: "Возвращает бронирование по id",
          params: T.Object({
            id: T.String({ description: "ID бронирования" }),
          }),
          response: {
            200: {
              description: "Бронирование",
              content: { "application/json": { schema: BookingDto } },
            },
            404: {
              description: "Not Found",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            429: {
              description: "Too Many Requests",
              headers: { "retry-after": { schema: T.Integer({ minimum: 0 }) } },
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            500: {
              description: "Internal Server Error",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
          },
        },
      },
      async (req, reply) => {
        const { id } = req.params as { id: string }

        const booking = await app.prisma.booking.findUnique({
          where: { id },
          select: {
            id: true,
            organizerName: true,
            roomId: true,
            startTime: true,
            endTime: true,
            room: { select: { number: true } },
          },
        })

        if (!booking) {
          reply.code(404).type("application/problem+json").send({
            type: "about:blank",
            title: "Not Found",
            status: 404,
            detail: "Booking not found",
            instance: req.url,
          } satisfies ProblemDetails)
          return
        }

        return {
          id: booking.id,
          organizerName: booking.organizerName,
          roomId: booking.roomId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          ...(booking.room ? { room: { number: booking.room.number } } : {}),
        }
      }
  )

  app.post("/api/dev/seed-rooms", { schema: { hide: true } }, async () => {
    const count = await app.prisma.room.count()
    if (count > 0) return { ok: true, created: 0 }

    const rooms = [
      { number: "101", name: "Аудитория 101" },
      { number: "102", name: "Аудитория 102" },
      { number: "201", name: "Аудитория 201" },
      { number: "202", name: "Аудитория 202" },
    ]

    await app.prisma.room.createMany({ data: rooms })
    return { ok: true, created: rooms.length }
  })


  app.post(
      "/api/bookings",
      {
        schema: {
          operationId: "createBooking",
          tags: ["Bookings"],
          summary: "Создаёт бронирование",
          body: BookingCreateBody,
          response: {
            201: {
              description: "Создано",
              content: { "application/json": { schema: T.Object({ id: T.String() }) } },
            },
            400: {
              description: "Bad Request",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            429: {
              description: "Too Many Requests",
              headers: { "retry-after": { schema: T.Integer({ minimum: 0 }) } },
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            500: {
              description: "Internal Server Error",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
          },
        },
      },
      async (req, reply) => {
        const body = req.body as {
          organizerName: string
          roomId: string
          startTime: string
          endTime: string
        }

        const start = parseDateOrNull(body.startTime)
        const end = parseDateOrNull(body.endTime)

        if (!start || !end || !(start < end)) {
          reply.code(400).type("application/problem+json").send({
            type: "about:blank",
            title: "Bad Request",
            status: 400,
            detail: "startTime must be earlier than endTime",
            instance: req.url,
          } satisfies ProblemDetails)
          return
        }

        const created = await app.prisma.booking.create({
          data: {
            organizerName: body.organizerName.trim(),
            roomId: body.roomId,
            startTime: start,
            endTime: end,
          },
          select: { id: true },
        })

        reply.code(201)
        return created
      }
  )

  app.patch(
      "/api/bookings/:id",
      {
        schema: {
          operationId: "updateBooking",
          tags: ["Bookings"],
          summary: "Обновляет бронирование",
          params: T.Object({ id: T.String() }),
          body: BookingUpdateBody,
          response: {
            200: {
              description: "Обновлено",
              content: { "application/json": { schema: T.Object({ id: T.String() }) } },
            },
            404: {
              description: "Not Found",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            400: {
              description: "Bad Request",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            429: {
              description: "Too Many Requests",
              headers: { "retry-after": { schema: T.Integer({ minimum: 0 }) } },
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
            500: {
              description: "Internal Server Error",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
          },
        },
      },
      async (req, reply) => {
        const { id } = req.params as { id: string }
        const body = req.body as Partial<{
          organizerName: string
          roomId: string
          startTime: string
          endTime: string
        }>

        const existing = await app.prisma.booking.findUnique({
          where: { id },
          select: { id: true, startTime: true, endTime: true },
        })

        if (!existing) {
          reply.code(404).type("application/problem+json").send({
            type: "about:blank",
            title: "Not Found",
            status: 404,
            detail: "Booking not found",
            instance: req.url,
          } satisfies ProblemDetails)
          return
        }

        const nextStart = body.startTime ? parseDateOrNull(body.startTime) : existing.startTime
        const nextEnd = body.endTime ? parseDateOrNull(body.endTime) : existing.endTime

        if (!nextStart || !nextEnd || !(nextStart < nextEnd)) {
          reply.code(400).type("application/problem+json").send({
            type: "about:blank",
            title: "Bad Request",
            status: 400,
            detail: "startTime must be earlier than endTime",
            instance: req.url,
          } satisfies ProblemDetails)
          return
        }

        const data: Parameters<typeof app.prisma.booking.update>[0]["data"] = {}

        if (body.organizerName !== undefined) data.organizerName = body.organizerName.trim()
        if (body.roomId !== undefined) data.roomId = body.roomId
        if (body.startTime !== undefined) data.startTime = nextStart
        if (body.endTime !== undefined) data.endTime = nextEnd

        const updated = await app.prisma.booking.update({
          where: { id },
          data,
          select: { id: true },
        })

        return updated
      }
  )


  app.delete(
      "/api/bookings/:id",
      {
        schema: {
          operationId: "deleteBooking",
          tags: ["Bookings"],
          summary: "Удаляет бронирование",
          params: T.Object({ id: T.String() }),
          response: {
            204: { description: "Deleted" },
            404: {
              description: "Not Found",
              content: { "application/problem+json": { schema: ProblemDetails } },
            },
          },
        },
      },
      async (req, reply) => {
        const { id } = req.params as { id: string }

        const exists = await app.prisma.booking.findUnique({
          where: { id },
          select: { id: true },
        })

        if (!exists) {
          reply.code(404).type("application/problem+json").send({
            type: "about:blank",
            title: "Not Found",
            status: 404,
            detail: "Booking not found",
            instance: req.url,
          } satisfies ProblemDetails)
          return
        }

        await app.prisma.booking.delete({ where: { id } })
        reply.code(204).send()
      }
  )


  return app
}
