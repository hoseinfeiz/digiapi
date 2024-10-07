const express = require("express")
const { createHandler } = require("graphql-http/lib/use/express")
const { buildSchema } = require("graphql")

const App = () => {
    const schema = buildSchema(`
        type Query {
          hello: String
        }
      `)
       
      
      const resolvers = {
        hello() {
          return "Hello world!"
        },
      }
       
      const app = express()
       
      app.all(
        "/graphql",
        createHandler({
          schema: schema,
          rootValue: resolvers,
        })
      )
      
      app.listen(4000)
      console.log("Running a GraphQL API server at http://localhost:4000/graphql")
}
 
module.exports = App