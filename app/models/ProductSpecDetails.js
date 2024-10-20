const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProductSpecDetails = new mongoose.Schema(
  {
    name: { type: String, required: true },
    label: { type: String },
    specs: { type: Schema.Types.ObjectID, require: true, ref: 'ProductSpec' },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('ProductSpecDetails', ProductSpecDetails)
