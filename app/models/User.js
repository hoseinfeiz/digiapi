const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    password: { type: String, required: true },
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
    const verif = await jwt.verify(token, secretkey)
    console.log('verify is: ', verif)
    return verif
  } else {
    return null
  }
}

module.exports = mongoose.model('User', User)
