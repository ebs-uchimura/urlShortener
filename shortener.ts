/**
/* shortener.ts
/* URL短縮ツール「ゑびす短縮er」 
*/

// import global interface
import { } from "./@types/globalsql";
// モジュール読み込み
import { config as dotenv } from 'dotenv'; // dotenv
import * as path from 'path'; // path
import express from 'express'; // express
import log4js from "log4js"; // ロガー
import helmet from 'helmet'; // セキュリティ対策
import SQL from './class/MySql0429'; // DB操作用
import Crypto from './class/Crypto0514'; // 暗号化用

// get now date
const getNowDate = (diff: number): string => {
  // now
  const d: Date = new Date();
  // combine date string
  const prefix: string = d.getFullYear() +
    ('00' + (d.getMonth() + 1)).slice(-2) +
    ('00' + (d.getDate() + diff)).slice(-2);
  return prefix;
}

// ロガー設定
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    system: { type: 'file', filename: `./logs/${getNowDate(0)}.log` }
  },
  categories: {
    default: { appenders: ['out', 'system'], level: 'debug' }
  }
});
// ロガー
const logger: any = log4js.getLogger();
const crypto: any = new Crypto();

// 開発フラグ
const DEV_FLG: boolean = true;

// モジュール設定
dotenv({ path: path.join(__dirname, '../keys/.env') });

// 開発環境切り替え
let globalDefaultPort: number; // ポート番号
let sqlHost: string; // SQLホスト名
let sqlUser: string; // SQLユーザ名
let sqlPass: string; // SQLパスワード
let sqlDb: string; // SQLデータベース名

// 開発モード
if (DEV_FLG) {
  globalDefaultPort = Number(process.env.DEV_PORT); // ポート番号
  sqlHost = process.env.SQL_DEVHOST!; // SQLホスト名
  sqlUser = process.env.SQL_DEVADMINUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_DEVADMINPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DEVDBNAME!; // SQLデータベース名

} else {
  globalDefaultPort = Number(process.env.DEFAULT_PORT); // ポート番号
  sqlHost = process.env.SQL_HOST!; // SQLホスト名
  sqlUser = process.env.SQL_ADMINUSER!; // SQLユーザ名
  sqlPass = process.env.SQL_ADMINPASS!; // SQLパスワード
  sqlDb = process.env.SQL_DBNAME!; // SQLデータベース名
}
// DB設定
const myDB: SQL = new SQL(
  sqlHost, // ホスト名
  sqlUser, // ユーザ名
  sqlPass, // ユーザパスワード
  Number(process.env.SQL_PORT), // ポート番号
  sqlDb, // DB名
);
// express設定
const app: any = express(); // express

app.use(helmet()); // ヘルメットを使用する
app.set('view engine', 'ejs'); // ejs使用
app.use(express.static('public')); // public設定
app.use(express.json()); // json設定
app.use(
  express.urlencoded({
    extended: true, // body parser使用
  })
);

// 短縮URLアクセス時
app.get('/:key', async (req: any, res: any) => {
  try {
    // 検索キー設定
    const searchKey: string = req.params.key;

    // 5文字なら処理
    if (searchKey.length == 5) {
      // 対象データ
      const shortUrlArgs: selectargs = {
        table: 'shortenurl',
        columns: ['short_url', 'usable'],
        values: [searchKey, 1],
        fields: ['pre_url'],
      }
      // 短縮前URL抽出
      const tmpPreUrlData: any = await myDB.selectDB(shortUrlArgs);

      // 該当URLにリダイレクト
      if (tmpPreUrlData != 'error') {
        res.redirect(tmpPreUrlData[0].pre_url);

      } else {
        res.send('error');
      }

    } else {
      res.send("connected");
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      logger.error(e.message);
    }
  }
});

// 短縮URL作成時
app.post('/create', async (req: any, res: any) => {
  try {
    // カウンタ
    let num: number = 0;
    // 検索結果
    let shortDataCount: number = 0;
    // 短縮文字列
    let randomKey: string = '';
    // 短縮対象URL
    const setUrl: any = req.body.url;

    // 重複無し生成までループ
    while (num < 5) {
      // 短縮文字列
      randomKey = crypto.random(5);
      // 対象データ
      const shortSelectArgs: countargs = {
        table: 'shortenurl', // テーブル
        columns: ['short_url'], // カラム
        values: [randomKey], // 値
      }
      // 対象データ取得
      shortDataCount = await myDB.countDB(shortSelectArgs);

      // 検索結果あり
      if (shortDataCount == 0) {
        break;
      }
      // カウントアップ
      num++;

      // ループリミット超え
      if (num == 5) {
        throw new Error('randomkey making failed.');
      }
    }

    // 対象データ
    const insertTransArgs: insertargs = {
      table: 'shortenurl',
      columns: [
        'pre_url',
        'short_url',
        'usable',
      ],
      values: [
        setUrl,
        randomKey,
        1,
      ],
    }
    // トランザクションDB格納
    const tmpReg: any = await myDB.insertDB(insertTransArgs);

    // エラー
    if (tmpReg == 'error') {
      throw new Error('shortenurl insertion error');

    } else {
      logger.debug('initial insertion to shortenurl completed.');
      // 結果を返す
      res.send(randomKey);
    }

  } catch (e: unknown) {
    // エラー型
    if (e instanceof Error) {
      logger.error(e.message);
    }
  }
});

// ポート開放
app.listen(globalDefaultPort, () => {
  console.log("server started");
});

