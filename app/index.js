const express = require('express')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { graphqlUploadExpress } = require('graphql-upload-minimal')
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer')
const http = require('http')
const cors = require('cors')
const { createHandler } = require('graphql-http/lib/use/express')
const typeDefs = require('api/schema')
const resolvers = require('api/resolver')
const { formatError } = require('graphql')
const User = require('app/models/User')
const App = async () => {
  const app = express()
  const httpServer = http.createServer(app)
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }))
  const server = new ApolloServer({
    introspection: true,
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (err) => {
      if (!err.originalError) {
        return err
      }
      console.log('error is', err)
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
      context: async ({ req }) => {
        try {
          let isAdmin = false
          const check = await User.CheckToken(req, process.env.SECRET_KEY)
          if (check) {
            const user = await User.findById(check.id)
            isAdmin = user.level
          }
          return {
            check,
            isAdmin,
          }
        } catch (error) {
          console.error('Error in token verification:', error)
          return { check: null }
        }
      },
    })
  )

  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve))
  console.log(`🚀 Server ready at http://localhost:4000/graphql`)
}

module.exports = App
