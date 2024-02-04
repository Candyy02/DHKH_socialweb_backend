/* eslint-disable camelcase */

const catchAsync = require('../utils/catchAsync');
const { Users, Followers } = require('../models/models');
const AppError = require('../utils/appError');

exports.getAllUser = catchAsync(async (req, res, next) => {
  const allUser = Users.findAll({});
  res.status(200).json({ allUser });
});
exports.getProfile = catchAsync(async (req, res, next) => {
  const userId = req.params.id || req.user.user_id;

  const user = await Users.findOne({
    where: { user_id: userId },
  });
  if (!user) return next(new AppError('User not found!', 404));

  user.password = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = undefined;
  user.passwordVersion = undefined;
  user.is_active = undefined;
  //get the number of followers
  const { count } = await Followers.findAndCountAll({
    where: { following_id: user.user_id },
  });

  let contacts = null;
  //check if the user is following the profile
  const isFollowing =
    (await Followers.findOne({
      where: {
        follower_id: req.user.user_id,
        following_id: user.user_id,
      },
    })) && true;
  //check if the user is requesting his own profile
  if (userId === req.user.user_id) {
    contacts = await Followers.findAll({
      where: { follower_id: user.user_id },
      include: [
        {
          model: Users,
          as: 'following',
          attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
        },
      ],
    });
  }
  const sanitizedUser = user.get({ plain: true }); // Convert user to plain object
  sanitizedUser.followers = count;
  sanitizedUser.isFollowing = !!isFollowing; // Convert isFollowing to boolean
  res.status(200).json({
    status: 'success',
    data: {
      user: sanitizedUser,
      contacts,
    },
  });
});
exports.followUser = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { following_id } = req.body;
  await Followers.create({
    follower_id: user_id,
    following_id,
  });
  res.status(200).json({ message: 'success' });
});
exports.unfollowUser = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { following_id } = req.body;
  await Followers.destroy({
    where: {
      follower_id: user_id,
      following_id,
    },
  });
  res.status(200).json({ message: 'success' });
});
