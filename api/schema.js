const typeDefs = `
    scalar Upload
    type Mutation {
      register(phone: String! , password: String!): operation!
      multimedia(image: Upload!): operation!
      category(input: categoryInput): operation!
      brand(input: brandInput): operation!
      survey(input: surveyInput!): operation!
      productSpec(input: productSpecInput): operation!
      productSpecDetail(input: productSpecDetailInput): operation!
    }
      input productSpecDetailInput{
      name: String!
      specs: ID!
      label: String
      }
     input productSpecInput{
     specs: String!
     label: String
     category: ID!
     }
     input surveyInput{
     list: [surveyList]!
     } 

    input surveyList{
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
     _id: ID
    }
    type Query{
    checkAccess: String
    login(phone: String! , password:String!): operation
    getAllMultimedia(page: Int , limit:Int): [Multimedia]
    getAllCategories(input: inputCategory): [Category]
    getAllBrands(input: inputBrand): [Brand]
    getAllSurveys(categoryID: ID!): [Survey]
    getProductSpecs(categoryID: ID!): [ProductSpec]
    getProductSpecDetails(specs: ID!): [ProductSpecDetail]
    }
    type ProductSpecDetail{
    _id: ID
    name: String
    label: String
    specs: Specs
    }
    type Specs{
    _id: ID
    label: String
    specs: String
    category: Category
    }
    type ProductSpec{
    _id: ID
    specs: String
    category: Category
    label: String
    }
    type Survey{
    _id: ID
    name:String
    label: String
    category: Category
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
