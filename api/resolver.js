const User = require('app/models/User')
const validator = require('validator')
const { GraphQLError } = require('graphql')
const bcrypt = require('bcrypt')
const saltRounds = 10
const throwErrors = (errorArray) => {
  throw new GraphQLError('Validation Error', {
    extensions: {
      code: 'VALIDATION_ERROR',
      errors: errorArray,
    },
  })
}

const resolvers = {
  Query: {
    hello: () => 'jigare baba',

    login: async (param, args) => {
      let loginErrors = []
      const isUser = await User.findOne({ phone: args.phone })

      if (!isUser) {
        loginErrors.push({
          message: 'چنین کاربری وجود ندارد',
          status: '401',
          code: 'لاگین نادرست',
        })
      }

      const { password } = await User.findOne({ phone: args.phone })

      const passCheck = bcrypt.compareSync(args.password, password)

      if (!passCheck) {
        loginErrors.push({
          message: 'پسوورد اشتباه است',
          status: '401',
          code: 'لاگین نادرست',
        })
      }

      if (loginErrors.length > 0) {
        throwErrors(loginErrors)
      }

      return {
        status: '200',
        message: 'لاگین بدرستی انجام شد',
      }
    },
  },
  Mutation: {
    register: async (param, args) => {
      let errorArr = []
      if (validator.isEmpty(args.phone)) {
        errorArr.push({
          message: 'فیلد موبایل وارد نشده است',
          status: '401',
          code: 'ورودی نادرست',
        })
      }

      if (!validator.isLength(args.phone, { min: 10, max: 12 })) {
        errorArr.push({
          message: 'طول شماره موبایل باید بین 10 تا 12 عدد باشد',
          status: '401',
          code: 'ورودی نادرست',
        })
      }
      if (validator.isEmpty(args.password)) {
        errorArr.push({
          message: 'فیلد پسوورد وارد نشده است',
          status: '401',
          code: 'ورودی نادرست',
        })
      }

      if (errorArr.length > 0) {
        throwErrors(errorArr)
      }
      const hash = bcrypt.hashSync(args.password, saltRounds)
      await User.create({
        phone: args.phone,
        password: hash,
      })
      return {
        status: 200,
        message: 'اطلاعات کاربری با موفقیت ذخیره شد',
      }
    },
  },
}

module.exports = resolvers
