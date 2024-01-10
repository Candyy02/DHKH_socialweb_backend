/* eslint-disable camelcase */
const catchAsync = require('../utils/catchAsync');
const { Users, Followers } = require('../models/models');
const AppError = require('../utils/appError');

exports.getAllUser = catchAsync(async (req, res, next) => {
  const allUser = Users.findAll({});
  res.status(200).json({ allUser });
});
exports.getProfile = catchAsync(async (req, res, next) => {
  const { user } = req;
  console.log(user);
  user.password = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = undefined;
  user.passwordVersion = undefined;
  const contacts = await Followers.findAll({
    where: { follower_id: user.user_id },
    include: [
      {
        model: Users,
        as: 'following',
        attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
      },
    ],
  });
  if (!user) return next(new AppError('User not found!', 404));
  res.status(200).json({
    status: 'success',
    data: {
      user,
      contacts,
    },
  });
});
