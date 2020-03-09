const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     // naming convention | user-UserId-timeStamp eg. user-767676abc-33262733891918.jpeg
//     const ext = file.mimetype.split('/')[1] // mimetype is derived from req.file to get the file extension
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })
const multerStorage = multer.memoryStorage() // allows image to be stored to memory (buffer) other than disk

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Please upload only images.', 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)

  next()
})

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  })
  return newObj
}

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data and
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /update-my-password'), 400);
  }

  // 2) Filter out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email')
  if (req.file) filteredBody.photo = req.file.filename

  // 3) Upder user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody,
    {
      new: true,
      runValidators: true
    })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.createUser = (req, res) => {
  // res.status(200).json({
  //   status: 'success',
  //   users: { users }
  // });
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.'
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.getUser = factory.getOne(User)
exports.getAllUsers = factory.getAll(User)
exports.deleteUser = factory.deleteOne(User)
// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User);
