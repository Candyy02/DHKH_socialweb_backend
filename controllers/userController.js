/* eslint-disable camelcase */

// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const { Users, Followers } = require('../models/models');
const AppError = require('../utils/appError');
const path = require('path');
const fs = require('fs');
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
  sanitizedUser.isFollowing = !!isFollowing;
  sanitizedUser.profile_picture =
    sanitizedUser.profile_picture ||
    `${req.protocol}://${req.get('host')}/uploads/profile_pictures/user.png`; // Convert isFollowing to boolean
  res.status(200).json({
    status: 'success',
    data: {
      user: sanitizedUser,
      contacts,
    },
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { first_name, last_name, email, nick_name, bio } = req.body;

  const ext = req.file?.mimetype.split('/')[1];
  const fileName = `${user_id}_${Date.now()}.${ext}`;
  if (req.file) {
    const rsImg = await sharp(req.file.buffer)
      .resize({ width: 500, height: 500 })
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`uploads/profile_pictures/${fileName}`);
    req.file.filename = fileName;
    console.log(rsImg);
  }

  const imageUrl = req.file
    ? `${req.protocol}://${req.get(
        'host',
      )}/uploads/profile_pictures/${fileName}`
    : null;
  // Remove old profile picture if it exists
  const directoryPath = 'uploads/profile_pictures/';
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('An error occurred:', err);
    } else {
      const fileFound = files.find((file) => file.startsWith(user_id));
      if (fileFound && fileFound != fileName) {
        fs.unlink(path.join(directoryPath, fileFound), (err) => {
          if (err) {
            console.error('There was an error:', err);
          } else {
            console.log('File deleted successfully:', fileFound);
          }
        });
      } else {
        console.log('File not found');
      }
    }
  });
  await Users.update(
    {
      first_name,
      last_name,
      email,
      bio,
      nick_name,
      profile_picture: imageUrl || undefined,
    },
    {
      where: { user_id },
    },
  );
  res.status(200).json({ message: 'success' });
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
exports.getInfoList = catchAsync(async (req, res, next) => {
  console.log(req.query.user_ids);
  const user_ids = req.query.user_ids.split(',').map((id) => parseInt(id));
  if (!user_ids) return next(new AppError('UserId list was not found!', 400));
  const infoList = await Users.findAll({
    where: { user_id: user_ids },
    attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
  });
  res.status(200).json({ message: 'success', data: infoList });
});
