const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')
const Survey = new mongoose.Schema(
  {
    name: { type: String, required: true },
    label: { type: String },
    category: { type: Schema.Types.ObjectID, require: true, ref: 'Category' },
  },
  {
    timestamps: true,
  }
)
Survey.plugin(mongoosePaginate)

module.exports = mongoose.model('Survey', Survey)
