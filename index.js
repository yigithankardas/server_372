const bp = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./src/db');

const app = express();

// oguz

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
  res.json('Hello World!');
});

app.get('/ilaclarim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `Select * From KULLANICI as U, KULLANIR as K, ILAC as I Where U.TCNo='${TCNo}' and K.TCNo = U.TCNo and K.IlacId = I.IlacId`,
  ).then((data) => {
    res.json(data[0]);
  });
});

app.get('/asilarim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `Select * From KULLANICI as K, ASI as S, YAPTIRIR as Y Where K.TCNo = '${TCNo}' and K.TCNo = Y.TCNo and Y.AsiId = S.AsiId`,
  ).then((data) => {
    res.json(data[0]);
  });
});

app.get('/randevularim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `Select * From HASTANE as H, RANDEVU as R,KULLANICI as K,DOKTOR as D Where K.TCNo = '${TCNo}' and K.TCNo = R.KullaniciTc and R.DoktorTc = D.TCNo and D.HastaneId = H.HastaneId;`,
  ).then((data) => {
    res.json(data[0]);
  });
});

app.get('/profilim', (req, res) => {
  const { TCNo } = req.body;
  db.query(`Select * From KULLANICI as K Where K.TCNo = '${TCNo}'`).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

app.put('/ilaclarim', (req, res) => {
  const { TCNo, IlacId } = req.body;
  db.query(`Update KULLANIR Set KullanmaSayisi=KullanmaSayisi+1 From KULLANICI as U, Ilac As I Where U.TCNo = '${TCNo}' and U.TCNo = KULLANIR.TCNo and I.IlacId = '${IlacId}' and I.IlacId = KULLANIR.IlacId;
  `).then(
    (data) => {
      res.json(data[0]);
    },
  );
});



app.post('/login', (req, res) => {
  const { TCNo, Sifre } = req.body;
  db.query(`select * from Kullanici where TCNo='${TCNo}' and Sifre='${Sifre}'`)
    .then((data) => {
      const [result] = data[0];
      if (result !== undefined) {
        const token = jwt.sign({ TCNo, Sifre }, 'secretkey');
        res.json({ token, type: result.type });
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
