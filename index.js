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

app.get('/ilaclarim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `select * from KULLANICI as U, KULLANIR as K, ILAC as I where U.TCNo='${TCNo}' and K.TCNo = U.TCNo and K.IlacId = I.IlacId`
  ).then((data) => {
    res.json(data[0]);
  });
});

app.get('/asilarim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `select * from KULLANICI as K, ASI as S, YAPTIRIR as Y where K.TCNo = '${TCNo}' and K.TCNo = Y.TCNo and Y.AsiId = S.AsiId`
  ).then((data) => {
    res.json(data[0]);
  });
});

// app.get("/randevularim", (req, res) => {
//   const { TCNo } = req.body;
//   db.query(``).then((data) => {
//     res.json(data[0]);
//   });
// });

app.post('/login', (req, res) => {
  const { TCNo, Sifre } = req.body;
  db.query(`select * from Kullanici where TCNo='${TCNo}' and Sifre='${Sifre}'`)
    .then((data) => {
      const [result] = data[0];
      if (result !== undefined) {
        const token = jwt.sign({ TCNo, Sifre }, 'secretkey');
        res.json({ token: token, type: result.type });
      } else {
        res.status(404).json();
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(4000, () => {
  console.log('this is develop branch');
});
