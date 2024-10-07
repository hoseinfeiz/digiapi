const User = require('app/models/User')
var validator = require('validator')
const resolvers = {
  Query: {
    hello: () => 'jigare baba',
  },
  Mutation: {
    register: async (param, args) => {
      let err = []
      if (validator.isEmpty(args.phone)) {
        err.push({ message: 'فیلد موبایل خالی است' })
        return
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
