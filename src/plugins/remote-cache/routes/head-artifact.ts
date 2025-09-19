import type { Server } from 'http'
import { badRequest, notFound } from '@hapi/boom'
import type {
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RouteOptions,
} from 'fastify'
import {
  type Params,
  type Querystring,
  artifactsRouteSchema,
} from './schema.js'

export const headArtifact: RouteOptions<
  Server,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  {
    Querystring: Querystring
    Params: Params
  }
> = {
  method: 'HEAD',
  url: '/artifacts/:id',
  schema: artifactsRouteSchema,
  authorization: 'read',
  async handler(req, reply) {
    const artifactId = req.params.id
    const team = req.query.teamId ?? req.query.team ?? req.query.slug // turborepo client passes team as slug when --team cli option is used
    if (!team) {
      throw badRequest(`querystring should have required property 'team'`)
    }

    try {
      const signatureKey = this.config.TURBO_REMOTE_CACHE_SIGNATURE_KEY
      const metadata = await this.location.headCachedArtifact(artifactId, team)

      if (signatureKey && metadata?.['x-turborepo-signature']) {
        reply.header('x-turborepo-signature', metadata['x-turborepo-signature'])
      }

      reply.send()
    } catch (err) {
      throw notFound('Artifact not found', err)
    }
  },
}
