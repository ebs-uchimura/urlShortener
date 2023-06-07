/**
/* app.js
/* URL短縮ツール「ゑびす短縮er」 
/* ver1.4.0
*/

// ☆ モジュール読み込み
import express from 'express'; // express
import SQL from './class/sql.js'; // sql

// ☆ 環境変数系処理
import * as dotenv from 'dotenv'; // 環境変数用
dotenv.config();

const DB_HOST = process.env.DB_HOST; // ホスト名
const DB_USER = process.env.DB_USER; // ユーザ名
const DB_PASS = process.env.DB_PASS; // パスワード名
const DB_NAME = process.env.DB_NAME; // DB名
const PORT = process.env.PORT; // ポート番号

// ☆ express系処理
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ☆ mysql接続
const myDB = new SQL(
    DB_HOST, // ホスト名
    DB_USER, // ユーザ名
    DB_PASS, // パスワード
    DB_NAME // DB名
); 

// ◇ 短縮URLアクセス時
app.get('/s/:id', async(req, res) => {
  // 検索キー設定
  const search_key = req.params.id;
  console.log(search_key);
  // 4文字なら処理
  if (search_key.length == 4) {
      // mysql接続
      const urlResult = await selectDB(
          "urls",
          "short_url",
          search_key
      );
      console.log(urlResult);
      // 該当URLにリダイレクト
      if (urlResult[0].pre_url) {
        res.redirect(urlResult[0].pre_url);
      } else {
        res.send('error');
      }
  } else {
      res.send("connected");
    }
});

// ポート開放
app.listen(PORT, function(){
  console.log("server started");
});

// Mysql Query
// * select
// select from database
const selectDB = async(table, column, value) => {
  return new Promise(async(resolve, reject) => {
    try {
      // query
      await myDB.doInquiry("SELECT * FROM ?? WHERE ?? IN (?)", [table, column, value]);
      // resolve
      resolve(myDB.getValue);

    } catch(e) {
      // error
      reject(e);
    }
  });
}
