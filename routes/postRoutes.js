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
module.exports = router;
