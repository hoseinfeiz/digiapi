const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')
const Category = new mongoose.Schema(
  {
    name: { type: String, required: true },
    label: { type: String },
    image: { type: Schema.Types.ObjectID, require: true, ref: 'Multimedia' },
    parent: { type: Schema.Types.ObjectID, ref: 'Category' },
  },
  {
    timestamps: true,
  }
)
Category.plugin(mongoosePaginate)

module.exports = mongoose.model('Category', Category)
