const User = require('app/models/User')
const validator = require('validator')
const { GraphQLError } = require('graphql')

const throwErrors = (message, status, code) => {
  throw new GraphQLError(message, {
    extensions: {
      code: code || 'ورودی نادرست',
      status: status || '502',
    },
  })
}

const resolvers = {
  Query: {
    hello: () => 'jigare baba',
  },
  Mutation: {
    register: async (param, args) => {
      if (validator.isEmpty(args.phone)) {
        throwErrors('فیلد موبایل وارد نشده است', '401', 'ورودی نادرست')
      }

      await User.create({
        phone: args.phone,
        password: args.password,
      })
      return {
        status: 200,
        message: 'اطلاعات کاربری با موفقیت ذخیره شد',
      }
    },
  },
}

module.exports = resolvers
