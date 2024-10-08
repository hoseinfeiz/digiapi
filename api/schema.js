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
    login(phone: String! , password:String!): operation
    }
  `
module.exports = typeDefs
