const express = require('express');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');

const router = express.Router();
router.get('/getPosts', authController.protect, postController.getPosts);
router.get(
  '/postdetail/:postId',
  authController.protect,
  postController.getPostDetail,
);
router.post('/createPost', authController.protect, postController.createPost);
router.get('/search', authController.protect, postController.searchPost);
router.post('/addComment', authController.protect, postController.addComment);
router.patch(
  '/editComment',
  authController.protect,
  postController.editComment,
);
router.delete(
  '/deleteComment',
  authController.protect,
  postController.deleteComment,
);
router.post('/likePost', authController.protect, postController.likePost);
router.delete('/unlikePost', authController.protect, postController.unlikePost);
module.exports = router;
