const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const { sequelize } = require('./models/models');
const app = require('./app');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
testConnection();
//TODO: listening port
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
