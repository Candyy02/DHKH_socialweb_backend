/* eslint-disable camelcase */
const catchAsync = require('../utils/catchAsync');
const { Posts } = require('../models/models');
const AppError = require('../utils/appError');

const { Comments, Likes, Users } = require('../models/models');

exports.getPosts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10;
  const page = req.query.page * 1 || 1;
  const offset = (page - 1) * limit;

  const newsfeed = await Posts.findAll({
    offset: offset,
    limit: limit,
    include: [
      { model: Comments, as: 'Comments' },
      { model: Likes, as: 'Likes' },
      {
        model: Users,
        as: 'user',
        attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
      },
    ],
  });
  console.log(newsfeed);
  if (!newsfeed) return next(new AppError('Error while getting newsfeed', 404));

  const postsWithCounts = newsfeed.map((post) => {
    const commentCount = post.Comments.length;
    const likeCount = post.Likes.length;

    return {
      ...post.toJSON(),
      commentCount,
      likeCount,

      Comments: undefined,
      Likes: undefined,
      User: undefined,
    };
  });

  res.status(200).json({ status: 'success', data: postsWithCounts });
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
exports.createPost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { title, content, code, created_at } = req.body;
  const post = await Posts.create({
    user_id,
    title,
    content,
    code,
    created_at,
  });
  if (!post) {
    return next(new AppError('Error while creating post!', 500));
  }
  res.status(200).json({ status: 'success', data: post });
});
