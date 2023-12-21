const catchAsync = require('../utils/catchAsync');
const { Posts } = require('../models/models');
const AppError = require('../utils/appError');

const { Comments, Likes } = require('../models/models');

exports.getPosts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1;
  const page = req.query.page * 1 || 1;
  const offset = (page - 1) * limit;
  console.log(page, offset);
  const newsfeed = await Posts.findAll({
    offset: offset,
    limit: limit,
  });
  if (!newsfeed) return next(new AppError('Error while getting newsfeed', 404));
  console.log(newsfeed);
  res.status(200).json({ status: 'success', data: newsfeed });
});
exports.getPostInfo = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Posts.findOne({
    where: { post_id: postId },
    include: [
      { model: Comments, as: 'Comments' },
      { model: Likes, as: 'Likes' },
    ],
  });
  if (!post) {
    return next(new AppError("Couldn't found post!", 404));
  }
  res.status(200).json({ status: 'success', data: post });
});
