const express = require('express');
const app = express();
const port = 4000;

app.get('/api', (req, res) => {
  res.json('Hello World!');
});

app.listen(port, () => {
  console.log('this is develop branch');
});
