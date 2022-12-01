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

app.get('/api/ilaclar', (req, res) => {
  db.query(
    'Select * From ILAC',
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin ilaclarinin doner
app.get('/ilaclarim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `Select * From KULLANICI as U, KULLANIR as K, ILAC as I Where U.TCNo='${TCNo}' and K.TCNo = U.TCNo and K.IlacId = I.IlacId`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin asilarini doner
app.get('/asilarim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `Select * From KULLANICI as K, ASI as S, YAPTIRIR as Y Where K.TCNo = '${TCNo}' and K.TCNo = Y.TCNo and Y.AsiId = S.AsiId`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin randevularini doner
app.get('/randevularim', (req, res) => {
  const { TCNo } = req.body;
  db.query(
    `Select * From HASTANE as H, RANDEVU as R,KULLANICI as K,DOKTOR as D Where K.TCNo = '${TCNo}' and K.TCNo = R.KullaniciTc and R.DoktorTc = D.TCNo and D.HastaneId = H.HastaneId;`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin profil bilgilerini doner
app.get('/profilim', (req, res) => {
  const { TCNo } = req.body;
  db.query(`Select * From KULLANICI as K Where K.TCNo = '${TCNo}'`).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

// Eger body'de siklik verilmediyse,
// TCsi verilen kullanicinin id'si verilen ilacin kullanim sayisini 1 arttirir
// Eger body'de siklik verildiyse,
// Kullaniciya yeni ilac ekler
app.put('/ilaclarim', (req, res) => {
  const { TCNo, IlacId, Siklik } = req.body;

  if (Siklik === undefined) {
    db.query(`Update KULLANIR Set KullanmaSayisi=KullanmaSayisi+1 From KULLANICI as U, Ilac As I Where U.TCNo = '${TCNo}' and U.TCNo = KULLANIR.TCNo and I.IlacId = '${IlacId}' and I.IlacId = KULLANIR.IlacId;
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`Insert Into KULLANIR Values('${TCNo}','${IlacId}','${Siklik}',0);
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  }
});

// Eger bodyde yapilma tarihi verilmediyse
// Body'de tc si verilen kullaniciya asi'yi ekler
// Eger bodyde yapilma tarihi verildiyse
// Body'de tc si verilen kullanicinin kullandigi asinin yapilma tarihini gunceller
app.put('/asilarim', (req, res) => {
  const { TCNo, AsiId, YapilmaTarihi } = req.body;
  console.log(`YAPILMA TARIHI: ${YapilmaTarihi}`);
  if (YapilmaTarihi === undefined) {
    db.query(`INSERT INTO YAPTIRIR VALUES('${TCNo}','${AsiId}',NULL);
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`Update Yaptirir Set YapilmaTarihi='${YapilmaTarihi}' From KULLANICI as U, ASI as A Where U.TCNo = '${TCNo}' and U.TCNo = Yaptirir.TCNo and A.AsiId = '${AsiId}' and A.AsiId = YAPTIRIR.AsiId;
`).then(
      (data) => {
        res.json(data[0]);
      },
    );
  }
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
