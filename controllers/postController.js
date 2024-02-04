/* eslint-disable camelcase */
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const { Posts } = require('../models/models');
const AppError = require('../utils/appError');

const { Comments, Likes, Users } = require('../models/models');

exports.getPosts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10;
  const page = req.query.page * 1 || 1;
  const userId = req.query.userId || null;
  console.log(req.query);
  const offset = (page - 1) * limit;

  const newsfeed = await Posts.findAll({
    offset: offset,
    limit: limit,
    where: userId ? { user_id: userId } : null,
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
  //console.log(newsfeed);
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

exports.createPost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { title, content, code, tags, created_at } = req.body;
  const post = await Posts.create({
    user_id,
    title,
    content,
    code,
    tags,
    created_at,
  });
  if (!post) {
    return next(new AppError('Error while creating post!', 500));
  }
  res.status(201).json({ status: 'success', data: post });
});
exports.getPostDetail = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Posts.findOne({
    where: { post_id: postId },
    include: [
      {
        model: Comments,
        as: 'Comments',
        include: [
          {
            model: Users,
            as: 'user',
            attributes: [
              'user_id',
              'first_name',
              'last_name',
              'profile_picture',
            ],
          },
        ],
      },
      { model: Likes, as: 'Likes' },
      {
        model: Users,
        as: 'user',
        attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
      },
    ],
  });
  if (!post) {
    return next(new AppError("Couldn't found post!", 404));
  }
  res.status(200).json({ status: 'success', data: post });
});
exports.updatePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, code, update_at } = req.body;
  const post = await Posts.update(
    { title, content, code, update_at },
    { where: { post_id: postId } },
  );
  if (!post) {
    return next(new AppError('Error while updating post!', 500));
  }
  res.status(200).json({ status: 'success', data: post });
});
exports.searchPost = catchAsync(async (req, res, next) => {
  const { keyword } = req.query;
  const posts = await Posts.findAll({
    where: {
      [Op.or]: [
        {
          title: {
            [Op.like]: `%${keyword}%`,
          },
        },
        {
          content: {
            [Op.like]: `%${keyword}%`,
          },
        },
        {
          tags: {
            [Op.like]: `%${keyword}%`,
          },
        },
      ],
    },
    attributes: ['post_id', 'title'],
  });
  if (!posts) {
    return next(new AppError('Error while searching posts!', 500));
  }
  res.status(200).json({ status: 'success', data: posts });
});
exports.getUserPosts = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const posts = await Posts.findAll({
    where: { user_id: userId },
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
  if (!posts) {
    return next(new AppError('Error while getting user posts!', 500));
  }
  res.status(200).json({ status: 'success', data: posts });
});
exports.addComment = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { post_id, content, created_at } = req.body;
  const comment = await Comments.create({
    user_id,
    post_id,
    content,
    created_at,
  });
  if (!comment) {
    return next(new AppError('Error while adding comment!', 500));
  }
  res.status(201).json({ status: 'success', data: comment });
});
exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await Comments.destroy({ where: { comment_id: commentId } });
  if (!comment) {
    return next(new AppError('Error while deleting comment!', 500));
  }
  res.status(200).json({ status: 'success', data: comment });
});
