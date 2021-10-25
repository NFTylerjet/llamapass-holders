const express = require('express')
const app = express()
const path = require('path')
const port = 3000
const index = path.join(__dirname, 'www/index.html')

app.get('/', (req, res) => {
  res.sendFile(index);
})

app.get('/csv/:file(*)', function(req, res, next){
  var filePath = path.join(__dirname, 'csv', req.params.file);

  res.download(filePath, function (err) {
    if (!err) return; // file sent
    if (err.status !== 404) return next(err); // non-404 error
    // file for download not found
    res.statusCode = 404;
    res.send('File Not Found!');
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})