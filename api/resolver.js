const User = require('app/models/User')
const validator = require('validator')
const multimedia = require('app/models/Multimedia')
const Category = require('app/models/Category')
const sizeOf = require('image-size')
const fType = require('file-type')
const { GraphQLError } = require('graphql')
const { GraphQLUpload } = require('graphql-upload-minimal')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')
const { mkdirp } = require('mkdirp')
const Multimedia = require('../app/models/Multimedia')
const Brand = require('../app/models/Brand')
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
  Upload: GraphQLUpload,
  Query: {
    checkAccess: (param, args, { check }) => {
      let tokenErrors = []
      if (check) {
        return 'Access is OK'
      } else {
        tokenErrors.push({
          message: 'کاربر دسترسی ندارد',
          status: '401',
          code: 'عدم دسترسی',
        })
        throwErrors(tokenErrors)
      }
    },

    login: async (param, args, { check }) => {
      let loginErrors = []
      const user = await User.findOne({ phone: args.phone })

      if (!user) {
        loginErrors.push({
          message: 'چنین کاربری وجود ندارد',
          status: '401',
          code: 'لاگین نادرست',
        })
      }

      const passCheck = bcrypt.compareSync(args.password, user.password)

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
        token: await User.CreateToken(user.id, process.env.SECRET_KEY, '1d'),
        status: '200',
        message: 'لاگین بدرستی انجام شد',
      }
    },

    getAllMultimedia: async (param, args, { check, isAdmin }) => {
      if (check && isAdmin) {
        const page = args.page || 1
        const limit = args.limit || 10
        try {
          const allMultimedia = await multimedia.paginate({}, { page, limit })
          const media = allMultimedia.docs
          for (let index = 0; index < media.length; index++) {
            sizeOf(
              path.join(__dirname, `/public/${media[index].dir}`),
              async (err, dim) => {
                media[index].dimWidth = await dim.width
                media[index].dimHeight = await dim.height
              }
            )
            const fileType = await fType.fromFile(
              path.join(__dirname, `/public/${media[index].dir}`)
            )
            media[index].format = fileType.ext
          }
          return allMultimedia.docs
        } catch (error) {
          throw new GraphQLError('Multimedia Error', {
            extensions: {
              code: 'Multimedia_ERROR',
              errors: [
                {
                  message: 'خطایی در گرفتن تصاویر از دیتابیس رخ داده است',
                  status: '500',
                  code: 'Internal server error',
                  error,
                },
              ],
            },
          })
        }
      }
    },
    getAllCategories: async (param, args) => {
      const page = args.input.page || 1
      const limit = args.input.limit || 10
      let cats = []
      if (args.input.mainCategory && !args.input.parentCategory) {
        cats = await Category.paginate(
          { parent: null },
          { page, limit, populate: { path: 'image' } }
        )
        return cats.docs
      } else if (!args.input.mainCategory && args.input.parentCategory) {
        cats = await Category.paginate(
          { parent: args.input.catID },
          { page, limit, populate: [{ path: 'image' }, { path: 'parent' }] }
        )
        return cats.docs
      } else if (!args.input.mainCategory && !args.input.parentCategory) {
        cats = await Category.paginate({}, { page, limit })
        return cats.docs
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
    multimedia: async (param, args, { check, isAdmin }) => {
      if (check && isAdmin) {
        try {
          const { filename, createReadStream } = await args.image
          const stream = createReadStream()
          const { filepath } = await saveImage(filename, stream)
          await multimedia.create({
            name: filename,
            dir: filepath,
          })
          return {
            status: 200,
            message: 'تصویر بدرستی ذخیره شد',
          }
        } catch (error) {
          throw new GraphQLError('Upload Error', {
            extensions: {
              code: 'Upload_ERROR',
              errors: [
                {
                  error: error,
                  message: 'در آپلود خطایی رخ داده است',
                  status: '400',
                },
              ],
            },
          })
        }
      }
    },
    category: async (param, args, { check, isAdmin }) => {
      let errorCategory = []
      console.log(args)
      if (check && isAdmin) {
        try {
          if (validator.isEmpty(args.input.name)) {
            errorCategory.push({
              message: 'فیلد نام دسته بندی خالی است',
            })
          }

          if (validator.isEmpty(args.input.image)) {
            errorCategory.push({
              message: 'فیلد تصویر دسته بندی خالی است',
            })
          }

          if (await Category.findOne({ name: args.input.name })) {
            errorCategory.push({
              message: 'نام دسته بندی تکراری است',
            })
          }

          if (errorCategory.length > 0) {
            throw error
          }

          await Category.create({
            name: args.input.name,
            label: args.input.label,
            parent: args.input.parent,
            image: args.input.image,
          })

          return {
            status: 200,
            message: 'دسته بندی بدرستی ایجاد شد',
          }
        } catch {
          throw new GraphQLError('Database Error', {
            extensions: {
              code: 'Database Error',
              errors:
                errorCategory.length > 0
                  ? errorCategory
                  : [
                      {
                        message: 'امکان ذخیره سازی در دیتابیس وجود ندارد',
                        status: '500',
                      },
                    ],
            },
          })
        }
      } else {
        throw new GraphQLError('Access Error', {
          extensions: {
            code: 'ACCESS_ERROR',
            errors: [
              {
                message: 'کاربر دسترسی لازم را ندارد',
                status: '401',
              },
            ],
          },
        })
      }
    },
    brand: async (param, args, { check, isAdmin }) => {
      let errorBrand = []
      if (check && isAdmin) {
        try {
          if (validator.isEmpty(args.input.name)) {
            errorBrand.push({
              message: 'فیلد نام برند خالی است',
            })
          }

          if (validator.isEmpty(args.input.image)) {
            errorBrand.push({
              message: 'فیلد تصویر برند خالی است',
            })
          }

          if (errorBrand.length > 0) {
            throw error
          }

          await Brand.create({
            name: args.input.name,
            label: args.input.label,
            image: args.input.image,
            category: args.input.category,
          })

          return {
            status: 200,
            message: 'برند جدید بدرستی ذخیره شد',
          }
        } catch (err) {
          console.log(err)
          throw new GraphQLError('Database error', {
            extensions: {
              code: 'DATABASE_SAVE_BRAND_ERROR',
              errors:
                errorBrand.length > 0
                  ? errorBrand
                  : [
                      {
                        message: 'خطا در ذخیره سازی برند جدید رخ داده است',
                        status: '500',
                        error: err,
                      },
                    ],
            },
          })
        }
      } else {
        throw new GraphQLError('Access Error', {
          extensions: {
            code: 'ACCESS_ERROR',
            errors: [
              {
                message: 'کاربر دسترسی لازم را ندارد',
                status: '401',
              },
            ],
          },
        })
      }
    },
  },
  // Category: {
  //   parent: async (param, args) =>
  //     await Category.findOne({ _id: param.parent }),
  //   image: async (param, args) =>
  //     await Multimedia.findOne({ _id: param.image }),
  // },
}

const saveImage = (filename, stream) => {
  const date = new Date()
  const dir = `uploads/${date.getFullYear()}/${date.getMonth() + 1}`
  mkdirp.sync(path.join(__dirname, `/public/${dir}`))
  let filepath = `${dir}/${filename}`

  if (fs.existsSync(path.join(__dirname, `/public/${filepath}`))) {
    filepath = `${dir}/${Date.now()}-${filename}`
  }
  return new Promise((resolve, reject) => {
    stream
      .pipe(fs.createWriteStream(path.join(__dirname, `/public/${filepath}`)))
      .on('error', (err) => reject(err))
      .on('finish', () => resolve({ filepath }))
  })
}

module.exports = resolvers
