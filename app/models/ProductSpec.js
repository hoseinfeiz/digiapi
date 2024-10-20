const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')
const ProductSpec = new mongoose.Schema(
  {
    specs: { type: String, required: true },
    label: { type: String },
    category: { type: Schema.Types.ObjectID, require: true, ref: 'Category' },
  },
  {
    timestamps: true,
  }
)
ProductSpec.plugin(mongoosePaginate)

module.exports = mongoose.model('ProductSpec', ProductSpec)
