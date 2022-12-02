/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */

const bp = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./src/db');

const app = express();

// yigithan

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// tum ilaclari doner
app.get('/api/ilaclar', (req, res) => {
  db.query(
    'Select * From ILAC',
  ).then((data) => {
    res.json(data[0]);
  });
});

// Eger HastaneId verilmediyse
// tum doktorlari doner
// Eger HastaneId verildiyse
// O hastanede calisan doktorlari doner
app.get('/api/doktorlar', (req, res) => {
  const { HastaneId } = req.body;
  if (HastaneId === undefined) {
    db.query(
      'Select * From DOKTOR',
    ).then((data) => {
      res.json(data[0]);
    });
  } else {
    db.query(
      `Select * From DOKTOR where HastaneId = '${HastaneId}'`,
    ).then((data) => {
      res.json(data[0]);
    });
  }
});

// tum ilaclari doner
app.get('/api/asilar', (req, res) => {
  db.query(
    'Select * From ASI',
  ).then((data) => {
    res.json(data[0]);
  });
});

// tum hastaneleri doner
app.get('/api/hastaneler', (req, res) => {
  db.query(
    'Select * From HASTANE',
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
// Kullanicinin id'si verilen ilacin kullanim sayisini Body'de verilen deger ile degistirir
// Eger body'de siklik verildiyse,
// Kullaniciya yeni ilac ekler
app.put('/ilaclarim', (req, res) => {
  const { TCNo, IlacId, KullanmaSayisi, Siklik } = req.body;

  if (Siklik === undefined) {
    db.query(`Update KULLANIR Set KullanmaSayisi='${KullanmaSayisi}' From KULLANICI as U, Ilac As I Where U.TCNo = '${TCNo}' and U.TCNo = KULLANIR.TCNo and I.IlacId = '${IlacId}' and I.IlacId = KULLANIR.IlacId;
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

// Eger bodyde RandevuIsmi yoksa
// DoktorTC si ve Tarihi verilen randevunun Gittimi degeri bodydeki ile degisir
// Eger bodyde RandevuIsmi varsa
// Verilen TCler tarih ve Randevu ismi ile yeni Randevu olusturulur
app.put('/randevularim', (req, res) => {
  const { KullaniciTc, DoktorTc, Tarih, Gitti_mi, RandevuIsmi } = req.body;

  if (RandevuIsmi === undefined) {
    db.query(`
    Update RANDEVU Set Gitti_mi='${Gitti_mi}' From KULLANICI as U, DOKTOR As D Where U.TCNo = '${KullaniciTc}' and U.TCNo = RANDEVU.KullaniciTc and D.TCNo = RANDEVU.DoktorTc and RANDEVU.Tarih='${Tarih}';
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`
    INSERT INTO RANDEVU VALUES('${KullaniciTc}','${DoktorTc}','${RandevuIsmi}',0,'${Tarih}');
    `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  }
});

// Eger Body'de sifre verilmediyse
// Diger ozellikler bodydeki degerlerle guncellenir
// Eger Body'de sifre verildiyse
// Sifre Bodydeki deger ile guncellenir
app.put('/profilim', (req, res) => {
  const { TCNo, Ad, Soyad, DogumT, Adres, Cinsiyet, Boy, Kilo, Sifre } = req.body;
  console.log(`SIFRE: ${Sifre}`);
  if (Sifre === undefined) {
    db.query(`Update KULLANICI Set Ad='${Ad}', Soyad='${Soyad}', DogumT='${DogumT}', Adres='${Adres}', Cinsiyet='${Cinsiyet}', Boy='${Boy}', Kilo='${Kilo}' Where TCNo='${TCNo}';`).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`Update KULLANICI Set Sifre='${Sifre}' Where TCNo='${TCNo}';`).then(
      (data) => {
        res.json(data[0]);
      },
    );
  }
});

// Body'de TCsi verilen kullanicinin ID'si verilen Ilaci silinir
app.delete('/ilaclarim', (req, res) => {
  const { TCNo, IlacId } = req.body;
  db.query(`Delete From KULLANIR Where TCNo='${TCNo}' and IlacId='${IlacId}'`).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

// Body'de TCsi verilen kullanicinin ID'si verilen asisi silinir
app.delete('/asilarim', (req, res) => {
  const { TCNo, AsiId } = req.body;
  db.query(`Delete From YAPTIRIR Where TCNo='${TCNo}' and AsiId='${AsiId}'`).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

// Body'de TCsi verilen kullanicinin DoktorTC'si ve Tarihi verilen randevu silinir
app.delete('/randevularim', (req, res) => {
  const { KullaniciTc, DoktorTc, Tarih } = req.body;
  db.query(`Delete From RANDEVU Where KullaniciTc='${KullaniciTc}' and DoktorTc='${DoktorTc}' and Tarih='${Tarih}'`).then(
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
