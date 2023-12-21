/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');
// eslint-disable-next-line import/no-extraneous-dependencies
const helmet = require('helmet');

//TODO: require Routers
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const errorController = require('./controllers/errorController');

const app = express();
app.use(cors());
app.options('*', cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(compression());
app.use(helmet());
app.use(hpp());
app.use(express.json());
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
app.use('/user', userRouter);
app.use('/', postRouter);
app.use(errorController);
module.exports = app;
