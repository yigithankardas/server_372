const bp = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./src/db');

const app = express();

// oguz

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// tum ilaclari doner
app.get('/api/ilaclar', (req, res) => {
  db.query(
    'select ilacadi, mg, ilacid from ILAC',
  ).then((data) => {
    res.json(data[0]);
  });
});

// TCNo verilen kullanicinin id'si verilen ilacin gerekli bilgilerini doner
app.get('/kullandigim', (req, res) => {
  const { ilacid, tcno } = req.query;
  db.query(`select I.prospektus, I.ac_tok, I.mg, KU.siklik, Y.yaztarih 
  from ILAC as I inner join KULLANIR as KU on I.ilacid = KU.ilacid left join YAZAR as Y on Y.ilacid = I.ilacid 
  where I.ilacid = '${ilacid}' and KU.tcno = '${tcno}'`).then((data) => {
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
      'select * from DOKTOR as D, KULLANICI as K where D.tcno = K.tcno',
    ).then((data) => {
      res.json(data[0]);
    });
  } else {
    db.query(
      `select K.ad as doktorad, K.soyad as doktorsoyad, D.tcno 
      From DOKTOR as D,KULLANICI as K 
      where D.hastaneid = '${hastaneid}' and D.tcno=K.tcno;
      `,
    ).then((data) => {
      res.json(data[0]);
    });
  }
});

// tum asilari doner
app.get('/api/asilar', (req, res) => {
  db.query(
    'select asiid, asiadi from ASI',
  ).then((data) => {
    res.json(data[0]);
  });
});

// tum hastaneleri doner
app.get('/api/hastaneler', (req, res) => {
  db.query(
    'select hastanead, hastaneid from HASTANE',
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin ilaclarinin doner
app.get('/ilaclarim', (req, res) => {
  const { tcno } = req.query;
  db.query(
    `select I.ilacadi, I.mg, I.resim, I.prospektus, K.kullanmasayisi, K.siklik, U.tcno, I.ilacid
    from KULLANICI as U, KULLANIR as K, ILAC as I 
    where U.tcno='${tcno}' and K.tcno = U.tcno and K.ilacid = I.ilacid
    `,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin asilarini doner
app.get('/asilarim', (req, res) => {
  const { tcno } = req.query;
  db.query(
    `select S.asiadi, S.yapilmayasi, Y.yapilmatarihi, S.asiid 
    from KULLANICI as K, ASI as S, YAPTIRIR as Y 
    where K.tcno = '${tcno}' and K.tcno = Y.tcno and Y.asiid = S.asiid`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de TCsi verilen kullanicinin randevularini doner
app.get('/randevularim', (req, res) => {
  const { tcno } = req.query;
  db.query(
    `select K.ad, DK.ad as doktorad, DK.soyad as doktorsoyad, R.tarih, R.randevuadi, H.hastanead, R.gitti_mi, R.saat, D.tcno as doktortc 
    from HASTANE as H, RANDEVU as R,KULLANICI as K, DOKTOR as D, KULLANICI as DK 
    where K.tcno = '${tcno}' and K.tcno = R.kullanicitc and R.doktortc = D.tcno and D.hastaneid = H.hastaneid and DK.tcno= D.tcno`,
  ).then((data) => {
    res.json(data[0]);
  });
});

// body'de bilgileri veirlen randevuyu doner
app.get('/randevu', (req, res) => {
  const { kullanicitc, doktortc, tarih, saat } = req.query;
  db.query(`select kullanicitc, doktortc, tarih, saat, randevuadi, gitti_mi 
  from RANDEVU where kullanicitc = '${kullanicitc}' and doktortc = '${doktortc}' and tarih = '${tarih}' and saat = '${saat}:00'`)
    .then((data) => {
      res.json(data[0]);
    });
});

// body'de TCsi verilen kullanicinin profil bilgilerini doner
app.get('/profilim', (req, res) => {
  const { TCNo } = req.body;
  db.query(`select * from KULLANICI as K where K.tcno = '${TCNo}'`).then(
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
    db.query(`update KULLANIR set kullanmasayisi='${kullanmasayisi}' from KULLANICI as U, ILAC as I where U.tcno = '${tcno}' and U.tcno = KULLANIR.tcno and I.ilacid = '${ilacid}' and I.ilacid = KULLANIR.ilacid
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`insert into KULLANIR values('${tcno}','${ilacid}','${siklik}',0)
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
    db.query(`insert into YAPTIRIR values('${tcno}','${asiid}',NULL)
  `).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`update YAPTIRIR set yapilmatarihi='${yapilmatarihi}' from KULLANICI as U, ASI as A where U.tcno = '${tcno}' and U.tcno = YAPTIRIR.tcno and A.asiid = '${asiid}' and A.asiid = YAPTIRIR.asiid;
`).then(
      (data) => {
        res.json(data[0]);
      },
    );
  }
});

app.post('/asilarim', (req, res) => {
  const { tcno, asiid, yapilmatarihi } = req.body;
  db.query(`insert into YAPTIRIR values('${tcno}','${asiid}', '${yapilmatarihi}')
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
    update RANDEVU set gitti_mi='${gitti_mi}' from KULLANICI as U, DOKTOR as D where U.tcno = '${kullanicitc}' and U.tcno = RANDEVU.kullanicitc and D.tcno = RANDEVU.doktortc and RANDEVU.tarih='${tarih}' and RANDEVU.saat='${saat}';
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
    insert into RANDEVU values('${kullanicitc}','${doktortc}','${randevuismi}',0,'${modifiedTarih}','${saat}')
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
    db.query(`update KULLANICI set ad='${Ad}', soyad='${Soyad}', dogumt='${DogumT}', adres='${Adres}', cinsiyet='${Cinsiyet}', boy='${Boy}', kilo='${Kilo}' where tcno='${TCNo}'`).then(
      (data) => {
        res.json(data[0]);
      },
    );
  } else {
    db.query(`update KULLANICI set sifre='${Sifre}' where tcno='${TCNo}'`).then(
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
  db.query(`select * from KULLANICI where tcno='${TCNo}' and sifre='${Sifre}'`)
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
