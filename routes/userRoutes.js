const express = require('express');
const usersController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signin', authController.signup);
router.post('/login', authController.login);
router.route('/googleSignIn').post(authController.googleSignIn);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.post(
  '/updatePassword',
  authController.protect,
  authController.updatePassword,
);
router.patch(
  '/deactivateAccount',
  authController.protect,
  authController.deactivateUser,
);
router
  .route('/getAllUsers')
  .get(
    authController.protect,
    authController.restrictTo(['admin']),
    usersController.getAllUser,
  );
router.get(
  '/getProfile/:id?',
  authController.protect,
  usersController.getProfile,
);
router.post('/follow', authController.protect, usersController.followUser);
router.post('/unfollow', authController.protect, usersController.unfollowUser);
module.exports = router;
