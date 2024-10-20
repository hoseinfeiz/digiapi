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
const Survey = require('../app/models/Survey')
const ProductSpec = require('../app/models/ProductSpec')
const ProductSpecDetails = require('../app/models/ProductSpecDetails')
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
    getAllBrands: async (param, args, { check, isAdmin }) => {
      if (check && isAdmin) {
        let brandErr = []
        let page = args.input.page || 1
        let limit = args.input.limit || 10
        try {
          const brands = await Brand.paginate(
            {},
            { page, limit, populate: { path: 'category' } }
          )

          return brands.docs
        } catch (error) {
          console.log(error)
          throw new GraphQLError('database save data error', {
            extensions: {
              code: 'database_ERROR',
              errors: [
                {
                  message: 'در خواندن اطلاعات برند از دیتابیس خطا وجود دارد',
                  status: '401',
                },
              ],
            },
          })
        }
      } else {
        throw new GraphQLError('Access Error', {
          extensions: {
            code: 'Access_ERROR',
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
    getAllSurveys: async (param, args, { check, isAdmin }) => {
      if (check && isAdmin) {
        let surveyErr = []
        try {
          let cats = await Category.findById(args.categoryID)
            .populate('parent')
            .exec()

          if (cats.parent == null) {
            surveyErr.push({
              messsage:
                'این دسته اصلی است و برای آن معیار اندازه گیری وجود ندارد',
            })
          } else if (cats.parent.parent == null) {
            const list = await Survey.find({ category: args.categoryID })
              .populate('category')
              .exec()
            if (list.length == 0) {
              surveyErr.push({
                messsage: 'برای این دسته بندی معیاراندازه گیری ثبت نشده است',
              })
            }
            return list
          } else {
            const list = await Survey.find({ category: cats.parent })
              .populate('category')
              .exec()
            if (list.length == 0) {
              surveyErr.push({
                messsage: 'برای این دسته بندی معیاراندازه گیری ثبت نشده است',
              })
            }
            return list
          }

          if (surveyErr.length > 0) {
            throw error
          }
          const surveys = await Survey.find({ category: args.categoryID })
            .populate('category')
            .exec()
          return surveys
        } catch (error) {
          console.log(error)
          throw new GraphQLError('database save data error', {
            extensions: {
              code: 'database_ERROR',
              errors:
                surveyErr.length > 0
                  ? surveyErr
                  : [
                      {
                        message:
                          'در خواندن اطلاعات برند از دیتابیس خطا وجود دارد',
                        status: '401',
                      },
                    ],
            },
          })
        }
      } else {
        throw new GraphQLError('Access Error', {
          extensions: {
            code: 'Access_ERROR',
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
    getProductSpecs: async (param, args, { check, isAdmin }) => {
      if (check && isAdmin) {
        let productSpecErr = []
        try {
          let cats = await Category.findById(args.categoryID)
            .populate('parent')
            .exec()

          if (cats.parent == null) {
            productSpecErr.push({
              messsage: 'این دسته اصلی است و برای آن مشخصات محصول وجود ندارد',
            })
          } else if (cats.parent.parent == null) {
            const list = await ProductSpec.find({ category: args.categoryID })
              .populate('category')
              .exec()
            if (list.length == 0) {
              productSpecErr.push({
                messsage: 'برای این دسته بندی مشخصات محصول ثبت نشده است',
              })
            }
            return list
          } else {
            const list = await ProductSpec.find({ category: cats.parent })
              .populate('category')
              .exec()
            if (list.length == 0) {
              productSpecErr.push({
                messsage: 'برای این دسته بندی مشخصات محصول ثبت نشده است',
              })
            }
            return list
          }

          if (productSpecErr.length > 0) {
            throw error
          }
          const productspecs = await ProductSpec.find({
            category: args.categoryID,
          })
            .populate('category')
            .exec()
          return productspecs
        } catch (error) {
          console.log(error)
          throw new GraphQLError('database save data error', {
            extensions: {
              code: 'database_ERROR',
              errors:
                productSpecErr.length > 0
                  ? productSpecErr
                  : [
                      {
                        message:
                          'در خواندن اطلاعات مشخصات محصول از دیتابیس خطا وجود دارد',
                        status: '401',
                      },
                    ],
            },
          })
        }
      } else {
        throw new GraphQLError('Access Error', {
          extensions: {
            code: 'Access_ERROR',
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
    getProductSpecDetails: async (param, args, { check, isAdmin }) => {
      if (check && isAdmin) {
        let productSpecErr = []
        try {
          let spec = await ProductSpec.findById(args.specs)

          if (spec != null) {
            if (spec.length == 0) {
              productSpecErr.push({
                message: 'ریزمشخصاتی برای ویژگی مورد نظر ثبت نشده',
              })
              throw error
            } else {
              return await ProductSpecDetails.find({ specs: args.specs })
                .populate({ path: 'specs', populate: { path: 'category' } })
                .exec()
            }
          } else {
            productSpecErr.push({
              message:
                'مشخصات مورد نظر وجود ندارد که بتوان  زیرمشخصات آنرا نمایش داد',
            })
          }

          if (productSpecErr.length > 0) {
            throw error
          }
        } catch (error) {
          console.log(error)
          throw new GraphQLError('database save data error', {
            extensions: {
              code: 'database_ERROR',
              errors:
                productSpecErr.length > 0
                  ? productSpecErr
                  : [
                      {
                        message:
                          'در خواندن اطلاعات ریزمشخصات محصول از دیتابیس خطا وجود دارد',
                        status: '401',
                      },
                    ],
            },
          })
        }
      } else {
        throw new GraphQLError('Access Error', {
          extensions: {
            code: 'Access_ERROR',
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
    survey: async (param, args, { check, isAdmin }) => {
      let errorSurvey = []
      if (check && isAdmin) {
        try {
          for (let index = 0; index < args.input.list.length; index++) {
            const element = args.input.list[index]
            if (validator.isEmpty(element.name)) {
              errorSurvey.push({
                message: 'فیلد نام برند خالی است',
              })
            }

            if (!(await Category.findOne({ _id: element.category }))) {
              errorSurvey.push({
                message: 'دسته بندی مورد نظر وجود ندارد',
              })
            }

            if (
              await Survey.findOne({
                category: element.category,
                name: element.name,
              })
            ) {
              errorSurvey.push({
                message: 'معیار ارزیابی تکراری است',
              })
            }
            if (errorSurvey.length > 0) {
              throw error
            }
            await Survey.create({
              name: element.name,
              label: element.label,
              category: element.category,
            })
          }
          return {
            status: 200,
            message: 'معیارهای امتیازدهی بدرستی ذخیره شد',
          }
        } catch (err) {
          console.log(err)
          throw new GraphQLError('Database error', {
            extensions: {
              code: 'DATABASE_SAVE_SURVEY_ERROR',
              errors:
                errorSurvey.length > 0
                  ? errorSurvey
                  : [
                      {
                        message:
                          'خطا در ذخیره سازی معیار امتیازدهی جدید رخ داده است',
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
    productSpec: async (param, args, { check, isAdmin }) => {
      let errorproductSpec = []
      if (check && isAdmin) {
        try {
          if (validator.isEmpty(args.input.specs)) {
            errorproductSpec.push({
              message: 'فیلد نام مشخصات خالی است',
            })
          }

          if (!(await Category.findOne({ _id: args.input.category }))) {
            errorproductSpec.push({
              message: 'دسته بندی مورد نظر وجود ندارد',
            })
          }

          if (
            await ProductSpec.findOne({
              category: args.input.category,
              specs: args.input.specs,
            })
          ) {
            errorproductSpec.push({
              message: 'مشخصات محصول تکراری است',
            })
          }
          if (errorproductSpec.length > 0) {
            throw error
          }
          const specId = await ProductSpec.create({
            name: args.input.specs,
            label: args.input.label,
            category: args.input.category,
          })

          return {
            _id: specId.id,
            status: 200,
            message: 'مشخصات محصول بدرستی ذخیره شد',
          }
        } catch (err) {
          console.log(err)
          throw new GraphQLError('Database error', {
            extensions: {
              code: 'DATABASE_SAVE_productSpec_ERROR',
              errors:
                errorproductSpec.length > 0
                  ? errorproductSpec
                  : [
                      {
                        message:
                          'خطا در ذخیره سازی مشخصات محصول جدید رخ داده است',
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
    productSpecDetail: async (param, args, { check, isAdmin }) => {
      let errorproductSpec = []
      if (check && isAdmin) {
        try {
          if (validator.isEmpty(args.input.name)) {
            errorproductSpec.push({
              message: 'فیلد نام ریزمشخصات خالی است',
            })
          }

          if (!(await ProductSpec.findOne({ _id: args.input.specs }))) {
            errorproductSpec.push({
              message: ' مشخصات مورد نظر وجود ندارد',
            })
          }

          if (
            await ProductSpecDetails.findOne({
              specs: args.input.specs,
              name: args.input.name,
            })
          ) {
            errorproductSpec.push({
              message: 'ریزمشخصات محصول تکراری است',
            })
          }
          if (errorproductSpec.length > 0) {
            throw error
          }
          const specDetailId = await ProductSpecDetails.create({
            name: args.input.name,
            label: args.input.label,
            specs: args.input.specs,
          })

          return {
            _id: specDetailId.id,
            status: 200,
            message: 'ریزمشخصات محصول بدرستی ذخیره شد',
          }
        } catch (err) {
          console.log(err)
          throw new GraphQLError('Database error', {
            extensions: {
              code: 'DATABASE_SAVE_productSpec_ERROR',
              errors:
                errorproductSpec.length > 0
                  ? errorproductSpec
                  : [
                      {
                        message:
                          'خطا در ذخیره سازی ریزمشخصات محصول جدید رخ داده است',
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
