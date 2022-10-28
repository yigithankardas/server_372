const { Sequelize, DataTypes } = require('sequelize');
const bp = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');

const sequelize = new Sequelize(
  'postgres://postgres:2002@localhost:5432/project',
  { define: { freezeTableName: true } }
);

try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

const Auth = sequelize.define(
  'auth',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

const app = express();

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
  res.json('Hello World!');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  sequelize
    .query(
      `select * from auth where username='${username}' and password='${password}'`
    )
    .then((data) => {
      const [result] = data[0];
      if (result !== undefined) {
        const token = jwt.sign({ username, password }, 'secretkey');
        res.json({ token: token, type: result.type });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(4000, () => {
  console.log('this is develop branch');
});
