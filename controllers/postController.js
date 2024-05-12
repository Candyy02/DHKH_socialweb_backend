/* eslint-disable camelcase */
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const { Posts, User_saved_posts } = require('../models/models');
const AppError = require('../utils/appError');

const { Comments, Likes, Users } = require('../models/models');

exports.getPosts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10;
  const page = req.query.page * 1 || 1;
  const userId = req.query.userId || null;
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
    order: [['created_at', 'DESC']],
  });
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
        model: User_saved_posts,
        as: 'User_saved_posts',
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
  const isSaved = !!postSanitized.User_saved_posts.find(
    (save) => save.user_id === req.user.user_id,
  )
  postSanitized.isLiked = isLiked;
  postSanitized.isSaved = isSaved;
  res.status(200).json({ status: 'success', data: postSanitized });
});
exports.editPost = catchAsync(async (req, res, next) => {
  const { post_id } = req.body;
  const { user_id } = req.user;
  console.log("day la post id:" + post_id)
  console.log("day la user_id:" + user_id)
  const { title, content, code, tags, update_at } = req.body;
  const post = await Posts.update(
    { title, content, code, tags, update_at },
    { where: { post_id: post_id , user_id: user_id} },
  );
  if (!post) {
    return next(new AppError('Error while updating post!', 500));
  }
  res.status(200).json({ status: 'success', data: post });
});

exports.deletePost = catchAsync(async (req,res, next) => {
  const {user_id} = req.body;
  const {post_id} = req.body;
  await Comments.destroy({
    where: {post_id: post_id}
  });
  await User_saved_posts.destroy({
    where: { post_id: post_id }
  });
  await Likes.destroy({
    where: { post_id: post_id}
  });
  const posts = await Posts.destroy({
    where: { post_id: post_id, user_id: user_id},
  });
  if (!posts) {
    return next(new AppError('You are not able to do this!', 403));
  }
  res.status(204).json({ status: 'success', data: posts });
})
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
  const like = await Likes.create({ user_id, post_id });
  res.status(201).json({ status: 'success', data: like });
});
exports.unlikePost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { post_id } = req.body;
  const like = await Likes.destroy({ where: { user_id, post_id } });
  res.status(204).json({ status: 'success', data: like });
});




exports.getSavedPost = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10;
  const page = req.query.page * 1 || 1;
  const userId = req.user.user_id;
  const offset = (page - 1) * limit;

  const savedPosts = await User_saved_posts.findAll({
    offset: offset,
    limit: limit,
    where: { user_id: userId },
    include: [
      {
        model: Posts,
        as: 'post',
        attributes: ['post_id', 'title', 'tags', 'created_at'],
        order: [['created_at', 'DESC']],
        include: [
          { model: Comments, as: 'Comments', attributes: ['comment_id']},
          { model: Likes, as: 'Likes', attributes: ['user_id'] },
          {
            model: Users,
            as: 'user',
            attributes: ['user_id', 'first_name', 'last_name', 'profile_picture'],
          },
        ]
      },
    ],
  });
  console.log(savedPosts);
  if (!savedPosts) return next(new AppError('Error while getting savepost', 404));

  const postsWithCounts = savedPosts.map((savepost) => {
    const commentCount = savepost.post.Comments.length;
    const likeCount = savepost.post.Likes.length;

    return {
      ...savepost.toJSON(),
      commentCount,
      likeCount,
  
      post: {
        ...savepost.post.toJSON(),
        Comments: undefined,
        Likes: undefined,
      },
      User: undefined,
    };
  });
  res.status(200).json({ status: 'success', data: postsWithCounts });
});

exports.savepost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { post_id } = req.body;
  const savedpost = await User_saved_posts.create({ user_id, post_id });
  res.status(201).json({ status: 'success', data: savedpost });
});
exports.unSavePost = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;
  const { post_id } = req.body;
  const savedpost = await User_saved_posts.destroy({ where: { user_id, post_id } });
  res.status(204).json({ status: 'success', data: savedpost });
});