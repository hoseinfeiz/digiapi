const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema
const Brand = new mongoose.Schema(
  {
    name: { type: String, required: true },
    label: { type: String },
    category: [
      { type: Schema.Types.ObjectID, required: true, ref: 'Category' },
    ],
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

Brand.plugin(mongoosePaginate)

module.exports = mongoose.model('Brand', Brand)
