/* eslint-disable node/no-missing-require */
const { DataTypes } = require('sequelize');
const _Comments = require('./comments');
const _Followers = require('./followers');
const _Likes = require('./likes');
const _Posts = require('./posts');
const _Users = require('./users');

function initModels(sequelize) {
  const Comments = _Comments(sequelize, DataTypes);
  const Followers = _Followers(sequelize, DataTypes);
  const Likes = _Likes(sequelize, DataTypes);
  const Posts = _Posts(sequelize, DataTypes);
  const Users = _Users(sequelize, DataTypes);

  Posts.belongsToMany(Users, {
    as: 'user_id_Users',
    through: Likes,
    foreignKey: 'post_id',
    otherKey: 'user_id',
  });
  Users.belongsToMany(Posts, {
    as: 'post_id_Posts',
    through: Likes,
    foreignKey: 'user_id',
    otherKey: 'post_id',
  });
  Users.belongsToMany(Users, {
    as: 'following_id_Users',
    through: Followers,
    foreignKey: 'follower_id',
    otherKey: 'following_id',
  });
  Users.belongsToMany(Users, {
    as: 'follower_id_Users',
    through: Followers,
    foreignKey: 'following_id',
    otherKey: 'follower_id',
  });
  Comments.belongsTo(Posts, { as: 'post', foreignKey: 'post_id' });
  Posts.hasMany(Comments, { as: 'Comments', foreignKey: 'post_id' });
  Likes.belongsTo(Posts, { as: 'post', foreignKey: 'post_id' });
  Posts.hasMany(Likes, { as: 'Likes', foreignKey: 'post_id' });
  Comments.belongsTo(Users, { as: 'user', foreignKey: 'user_id' });
  Users.hasMany(Comments, { as: 'Comments', foreignKey: 'user_id' });
  Followers.belongsTo(Users, { as: 'follower', foreignKey: 'follower_id' });
  Users.hasMany(Followers, { as: 'Followers', foreignKey: 'follower_id' });
  Followers.belongsTo(Users, { as: 'following', foreignKey: 'following_id' });
  Users.hasMany(Followers, {
    as: 'following_Followers',
    foreignKey: 'following_id',
  });
  Likes.belongsTo(Users, { as: 'user', foreignKey: 'user_id' });
  Users.hasMany(Likes, { as: 'Likes', foreignKey: 'user_id' });
  Posts.belongsTo(Users, { as: 'user', foreignKey: 'user_id' });
  Users.hasMany(Posts, { as: 'Posts', foreignKey: 'user_id' });

  return {
    Comments,
    Followers,
    Likes,
    Posts,
    Users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
