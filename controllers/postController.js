/* eslint-disable camelcase */
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const { Posts } = require('../models/models');
const AppError = require('../utils/appError');
const moment = require('moment');
const { Comments, Likes, Users } = require('../models/models');

exports.getPosts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10;
  const page = req.query.page * 1 || 1;
  const userId = req.query.userId || null;
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
    order: [['created_at', 'DESC']],
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
      {
        model: Likes,
        as: 'Likes',
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
  const postSanitized = post.get({ plain: true });
  const isLiked = !!postSanitized.Likes.find(
    (like) => like.user_id === req.user.user_id,
  );
  postSanitized.isLiked = isLiked;
  res.status(200).json({ status: 'success', data: postSanitized });
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
  const {
    general = null,
    tag = null,
    user = null,
    date = null,
    comments = null,
    likes = null,
    profile = null,
  } = req.body;

  const searchCriteria = {};

  if (general !== null) {
    searchCriteria.title = {
      [Op.like]: `%${general}%`,
    };
    searchCriteria.content = {
      [Op.like]: `%${general}%`,
    };
  }

  if (tag !== null) {
    searchCriteria.tags = {
      [Op.like]: `%${tag}%`,
    };
  }
  const userCriteria = {};
  if (user !== null) {
    userCriteria[Op.or] = [
      {
        first_name: {
          [Op.like]: `%${user}%`,
        },
      },
      {
        last_name: {
          [Op.like]: `%${user}%`,
        },
      },
    ];
  }

  if (date !== null) {
    const unixDate = moment(date, 'DD/MM/YYYY').unix();
    searchCriteria.created_at = {
      [Op.gte]: unixDate,
    };
  }
  const limit = req.query.limit * 1 || 10;
  const page = req.query.page * 1 || 1;
  const offset = (page - 1) * limit;
  const searchResult = await Posts.findAll({
    offset: offset,
    limit: limit,
    where: searchCriteria,
    include: [
      { model: Comments, as: 'Comments' },
      { model: Likes, as: 'Likes' },
      {
        model: Users,
        as: 'user',
        attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
        where: userCriteria,
      },
    ],
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['content', 'code'] },
  });

  // const limit = req.query.limit * 1 || 10;
  // const page = req.query.page * 1 || 1;
  // const offset = (page - 1) * limit;
  // const unixDate = moment(date, 'DD/MM/YYYY').unix();

  // const searchResult = await Posts.findAll({
  //   offset: offset,
  //   limit: limit,
  //   where: {
  //     [Op.or]: [
  //       {
  //         title: {
  //           [Op.like]: `%${general}%`,
  //         },
  //       },
  //       {
  //         content: {
  //           [Op.like]: `%${general}%`,
  //         },
  //       },
  //     ],
  //     [Op.and]: [
  //       {
  //         tags: {
  //           [Op.like]: `%${tag}%`,
  //         },
  //       },

  //       {
  //         created_at: {
  //           [Op.gte]: unixDate,
  //         },
  //       },
  //     ],
  //   },
  //   include: [
  //     { model: Comments, as: 'Comments' },
  //     { model: Likes, as: 'Likes' },
  //     {
  //       model: Users,
  //       as: 'user',
  //       attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
  //       where: {
  //         [Op.or]: [
  //           {
  //             first_name: {
  //               [Op.like]: `%${user}%`,
  //             },
  //           },
  //           {
  //             last_name: {
  //               [Op.like]: `%${user}%`,
  //             },
  //           },
  //         ],
  //       },
  //     },
  //   ],
  //   order: [['created_at', 'DESC']],
  // });
  //console.log(newsfeed);
  if (!searchResult)
    return next(new AppError('Error while getting newsfeed', 404));

  const postsWithCounts = searchResult
    .map((post) => {
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
    })
    .filter((post) => {
      if (comments !== null) {
        return post.commentCount >= comments;
      } else if (likes !== null) {
        return post.likeCount >= likes;
      } else {
        return post.commentCount >= comments && post.likeCount >= likes;
      }
    });

  res.status(200).json({ status: 'success', data: postsWithCounts });
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
  const { user_id } = req.user;
  const { comment_id } = req.body;
  const comment = await Comments.destroy({
    where: { comment_id: comment_id, user_id: user_id },
  });
  if (!comment) {
    return next(new AppError('You are not able to do this!', 403));
  }
  res.status(204).json({ status: 'success', data: comment });
});
//#TODO: add edit Comment in front-end
exports.editComment = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { comment_id, content, updated_at } = req.body;
  const comment = await Comments.update(
    { content, updated_at },
    { where: { comment_id: comment_id, user_id: user_id } },
  );
  if (!comment) {
    return next(new AppError('You are not able to do this!', 403));
  }
  res.status(200).json({ status: 'success' });
});

exports.likePost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { post_id } = req.body;
  console.log(user_id, post_id);
  const like = await Likes.create({ user_id, post_id });
  res.status(201).json({ status: 'success', data: like });
});
exports.unlikePost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { post_id } = req.body;
  const like = await Likes.destroy({ where: { user_id, post_id } });
  res.status(204).json({ status: 'success', data: like });
});
