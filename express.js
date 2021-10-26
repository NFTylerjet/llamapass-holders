const express = require('express');
const ejs = require('ejs');
const app = express();
app.use(express.static('public'));
app.set('view engine','ejs');
let lastupated;

app.set('view options', {lastupdated: lastupated});
const path = require('path');
const port = 5200;
const date = require('date-and-time')
const ordinal = require('date-and-time/plugin/ordinal');
date.plugin(ordinal);
const cron = require('node-cron');
const fs = require('fs');

const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path)
  return stats.mtime
}
function modifiedDate() {
  try {
    lastupdated = date.format(getFileUpdatedDate('./public/files/CombinedPassHolders.csv'),'MMM DDD YYYY hh:mm:ss A', true) + ' UTC';
  } catch (error) {
    console.log(error.message);
  }
}

cron.schedule('45 * * * *', () => {
  modifiedDate();
})

app.get('/', (req, res) => {
  modifiedDate();
  res.render('pages/index')
})

app.get('/public/files/:file(*)', function(req, res, next){
  var filePath = path.join(__dirname, 'public/files', req.params.file);

  res.download(filePath, function (err) {
    if (!err) return; // file sent
    if (err.status !== 404) return next(err); // non-404 error
    // file for download not found
    res.statusCode = 404;
    res.render('pages/404');
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
