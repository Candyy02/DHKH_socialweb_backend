const express = require('express');
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');

const router = express.Router();
router.get('/getPosts', authController.protect, postController.getPosts);
router.get(
  '/getPostInfo/:postId',
  authController.protect,
  postController.getPostInfo,
);
router.post('/createPost', authController.protect, postController.createPost);

module.exports = router;
