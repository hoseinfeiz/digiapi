const express = require('express')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer')
const http = require('http')
const cors = require('cors')
const { createHandler } = require('graphql-http/lib/use/express')
const typeDefs = require('api/schema')
const resolvers = require('api/resolver')
const { formatError } = require('graphql')
const App = async () => {
  const app = express()
  const httpServer = http.createServer(app)
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (err) => {
      const customError = err.extensions.errors.map((item) => {
        return {
          message: item.message,
          status: item.status || 500,
          code: item.code || 'INTERNAL_SERVER_ERROR',
        }
      })

      return {
        description: customError,
        errorType: err.message,
        path: err.path,
        locations: err.locations,
      }
    },
  })

  await server.start()
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  )

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve))
  console.log(`🚀 Server ready at http://localhost:4000/graphql`)
}

module.exports = App
