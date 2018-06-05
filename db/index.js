const debug = require('debug')('sql');
const chalk = require('chalk');
const Sequelize = require('sequelize');

const name = (process.env.DATABASE_NAME || 'transcend' + (process.env.NODE_ENV === 'testing' ? '_test' : ''));

let url = process.env.DATABASE_URL || 
 `postgres://ccemapytutvlku:767801983fd3a556260132d5b9653d45cece6eece858ba885d06691858ac8d24@ec2-54-243-185-195.compute-1.amazonaws.com:5432/dc6llibj1933kd`;


  url = process.env.DATABASE_URL || `postgres://localhost:5432/${name}`;

console.log(chalk.blue(`Opening database connection to ${url}`));

// Create the database instance
const db = module.exports = new Sequelize(url, {
  logging: debug, // export DEBUG=sql in the environment to get SQL queries
  define: {
    underscored: true,       // use snake_case rather than camelCase column names
    freezeTableName: true,   // don't change table names from the one specified
    timestamps: true         // automatically include timestamp columns
  }
});

// Pull in our models
require('./models');

// Sync the db, creating it if necessary
function sync (force = process.env.NODE_ENV === 'testing', retries = 0, maxRetries = 5) {
  return db.sync({ force })
    .then(ok => console.log(chalk.blue(`Synced models to db ${url}`)))
    .catch(fail => {
      // Don't do this auto-create nonsense in prod, or if we've retried too many times
      if (process.env.NODE_ENV === 'production' || retries > maxRetries) {
        console.error(chalk.red(`********** database error ***********`));
        console.error(chalk.red(`Couldn't connect to ${url}`));
        console.error();
        console.error(chalk.red(fail));
        console.error(chalk.red(`*************************************`));
        return;
      }
      // Otherwise, do this autocreate nonsense
      console.log(chalk.blue(`${retries ? `[retry ${retries}]` : ''} Creating database ${name}...`));
      return new Promise((resolve, reject) =>
        require('child_process').exec(`createdb "${name}"`, resolve)
      ).then(() => sync(true, retries + 1));
    });
}

db.didSync = sync();
