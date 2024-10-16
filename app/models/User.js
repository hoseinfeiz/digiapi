const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    password: { type: String, required: true },
    level: { type: String, default: false },
  },
  {
    timestamps: true,
  }
)

User.statics.CreateToken = async (id, secretkey, exp) => {
  return await jwt.sign({ id }, secretkey, { expiresIn: exp })
}

User.statics.CheckToken = async (req, secretkey) => {
  const token = req.headers.token
  if (token) {
    try {
      const verif = await jwt.verify(token, secretkey)
      return verif
    } catch (err) {
      console.error('Token verification error:', err)
      // You can return null or throw an error here based on your need
      return null
    }
  } else {
    return null
  }
}

module.exports = mongoose.model('User', User)
