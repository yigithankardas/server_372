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

// ilacid'si verilen ilaci doner
app.get('/kullandigim', (req, res) => {
  const { ilacid, tcno } = req.query;
  db.query(`select * from ILAC as I inner join KULLANIR as KU on I.ilacid = KU.ilacid left join YAZAR as Y on Y.ilacid = I.ilacid where I.ilacid = '${ilacid}' and KU.tcno = '${tcno}'`).then((data) => {
    res.json(data[0][0]);
  });
});

// Eger HastaneId verilmediyse
// tum doktorlari doner
// Eger HastaneId verildiyse
// O hastanede calisan doktorlari doner
app.get('/api/doktorlar', (req, res) => {
  const { hastaneid } = req.query;
  if (hastaneid === undefined) {
    db.query(
      'Select * from DOKTOR as D, KULLANICI as K where D.tcno = K.tcno',
    ).then((data) => {
      res.json(data[0][0]);
    });
  } else {
    db.query(
      `select * from DOKTOR as D, KULLANICI as K where D.hastaneid = '${hastaneid}' and D.tcno = K.tcno`,
    ).then((data) => {
      res.json(data[0][0]);
    });
  }
});

// tum asilari doner
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
  const { tcno } = req.query;
  db.query(
    `Select * From KULLANICI as U, KULLANIR as K, ILAC as I Where U.TCNo='${tcno}' and K.TCNo = U.TCNo and K.IlacId = I.IlacId`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin asilarini doner
app.get('/asilarim', (req, res) => {
  const { tcno } = req.query;
  db.query(
    `Select * From KULLANICI as K, ASI as S, YAPTIRIR as Y Where K.TCNo = '${tcno}' and K.TCNo = Y.TCNo and Y.AsiId = S.AsiId`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin randevularini doner
app.get('/randevularim', (req, res) => {
  const { tcno } = req.query;
  db.query(
    `Select * From HASTANE as H, RANDEVU as R,KULLANICI as K,DOKTOR as D Where K.TCNo = '${tcno}' and K.TCNo = R.KullaniciTc and R.DoktorTc = D.TCNo and D.HastaneId = H.HastaneId;`,
  ).then((data) => {
    const rows = data[0];
    const newRows = Promise.all(rows.map(async (row) => {
      await db.query(`select ad from KULLANICI where TCNo = '${row.doktortc}'`).then((data2) => {
        row.doktorad = data2[0][0].ad;
      });
      return row;
    }));
    newRows.then((a) => { res.json(a); });
  });
});

// body'de bilgileri veirlen randevuyu doner
app.get('/randevu', (req, res) => {
  const { kullanicitc, doktortc, tarih, saat } = req.query;
  db.query(`select * from RANDEVU where kullanicitc='${kullanicitc}' and doktortc='${doktortc}' and tarih='${tarih}' and saat='${saat}:00'`)
    .then((data) => {
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
  const { tcno, ilacid, kullanmasayisi, siklik } = req.body;
  if (siklik === undefined) {
    db.query(`Update KULLANIR Set KullanmaSayisi='${kullanmasayisi}' From KULLANICI as U, Ilac As I Where U.TCNo = '${tcno}' and U.TCNo = KULLANIR.TCNo and I.IlacId = '${ilacid}' and I.IlacId = KULLANIR.IlacId;
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`Insert Into KULLANIR Values('${tcno}','${ilacid}','${siklik}',0);
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
  const { tcno, asiid, yapilmatarihi } = req.body;
  if (yapilmatarihi === undefined) {
    db.query(`INSERT INTO YAPTIRIR VALUES('${tcno}','${asiid}',NULL);
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`Update Yaptirir Set YapilmaTarihi='${yapilmatarihi}' From KULLANICI as U, ASI as A Where U.TCNo = '${tcno}' and U.TCNo = Yaptirir.TCNo and A.AsiId = '${asiid}' and A.AsiId = YAPTIRIR.AsiId;
`).then(
      (data) => {
        res.json(data[0]);
      },
    );
  }
});

app.post('/asilarim', (req, res) => {
  const { tcno, asiid, yapilmatarihi } = req.body;
  db.query(`INSERT INTO YAPTIRIR VALUES('${tcno}','${asiid}', '${yapilmatarihi}');
  `).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

// Eger bodyde RandevuIsmi yoksa
// DoktorTC si ve Tarihi verilen randevunun Gittimi degeri bodydeki ile degisir
// Eger bodyde RandevuIsmi varsa
// Verilen TCler tarih ve Randevu ismi ile yeni Randevu olusturulur
app.put('/randevularim', (req, res) => {
  const { kullanicitc, doktortc, tarih, gitti_mi, randevuismi, saat } = req.body;
  if (randevuismi === undefined) {
    db.query(`
    Update RANDEVU Set gitti_mi='${gitti_mi}' From KULLANICI as U, DOKTOR As D Where U.tcno = '${kullanicitc}' and U.tcno = RANDEVU.kullanicitc and D.TCNo = RANDEVU.doktortc and RANDEVU.tarih='${tarih}' and RANDEVU.saat='${saat}';
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else if (randevuismi !== '' && doktortc !== '' && tarih !== '' && saat !== '') {
    let modifiedTarih = tarih.slice(0, 10);
    const lastCharacterModified = (parseInt(modifiedTarih.charAt(modifiedTarih.length - 1), 10) + 1).toString();
    modifiedTarih = modifiedTarih.slice(0, modifiedTarih.length - 1) + lastCharacterModified;
    db.query(`
    INSERT INTO RANDEVU VALUES('${kullanicitc}','${doktortc}','${randevuismi}',0,'${modifiedTarih}','${saat}');
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
  const { tcno, ilacid } = req.query;
  db.query(`delete From KULLANIR where tcno='${tcno}' and ilacid='${ilacid}'`).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

// Body'de TCsi verilen kullanicinin ID'si verilen asisi silinir
app.delete('/asilarim', (req, res) => {
  const { tcno, asiid } = req.query;
  db.query(`delete from YAPTIRIR where tcno='${tcno}' and asiid='${asiid}'`).then(
    (data) => {
      res.json(data[0]);
    },
  );
});

// Body'de TCsi verilen kullanicinin DoktorTC'si ve Tarihi verilen randevu silinir
app.delete('/randevularim', (req, res) => {
  const { kullanicitc, doktortc, tarih } = req.query;
  db.query(`delete from RANDEVU where kullanicitc='${kullanicitc}' and doktortc='${doktortc}' and tarih='${tarih}'`).then(
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
        const userObject = { ...result, token, doktor_mu: false };
        db.query(`select * from DOKTOR where tcno='${result.tcno}'`).then((data2) => {
          const [result2] = data2[0];
          if (result2 !== undefined) {
            userObject.doktor_mu = true;
          }
          res.json(userObject);
        });
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
