const bp = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./src/db');
const app = express();

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
  res.json('Hello World!');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
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
