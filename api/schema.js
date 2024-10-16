const typeDefs = `
    scalar Upload
    type Mutation {
      register(phone: String! , password: String!): operation
      multimedia(image: Upload!): operation
      category(input: categoryInput): operation
    }

    input categoryInput {
    name: String!
    label: String
    parent: ID
    image: ID!
    }

    type operation {
    token: String
     status: Int
     message: String
    }
    type Query{
    checkAccess: String
    login(phone: String! , password:String!): operation
    getAllMultimedia(page: Int , limit:Int): [Multimedia]
    }

    type Multimedia {
    name: String
    dimWidth: String
    dimHeight: String
    format: String
    dir: String
    }

  `
module.exports = typeDefs
