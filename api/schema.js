const typeDefs = `
    scalar Upload
    type Mutation {
      register(phone: String! , password: String!): operation!
      multimedia(image: Upload!): operation!
      category(input: categoryInput): operation!
      brand(input: brandInput): operation!
      survey(input: [surveyInput!]): operation!
    }

    input surveyInput{
    name: String!
    label: String
    category: ID!
    }
    input brandInput{
    name: String!
    label: String
    image: String!
    category: [ID!]!
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
    getAllCategories(input: inputCategory): [Category]
    getAllBrands(input: inputBrand): [Brand]
    }
    input inputBrand{
    page: Int
    limit: Int
    }
    type Brand{
    name: String!
    image: String
    category: [Category]
    label: String
    }
    input inputCategory{
    page: Int
    limit: Int
    mainCategory: Boolean
    parentCategory: Boolean
    catID: ID
    }
    type Category{
    _id: ID
    name: String
    parent: Parent
    image: Multimedia
    label: String
    }

    type Parent{
    _id: ID
    name: String
    parent: Category
    label: String
    }

    type Multimedia {
    _id: ID
    name: String
    dimWidth: String
    dimHeight: String
    format: String
    dir: String
    }

  `
module.exports = typeDefs
