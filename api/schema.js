const typeDefs = `
    type Mutation {
      register(phone: String! , password: String!): operation
    }

    type operation {
    token: String
     status: Int
     message: String
    }
    type Query{
    checkAccess: String
    login(phone: String! , password:String!): operation
    }

  `
module.exports = typeDefs
