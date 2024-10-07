const typeDefs = `
    type Mutation {
      register(phone: String! , password: String!): operation
    }

    type operation {
     status: Int
     message: String
    }
    type Query{
    hello: String
    }
  `
module.exports = typeDefs
