const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// データベースファイルのパス
const dbPath = path.resolve(__dirname, 'database.sqlite');

// 新しいデータベース接続を作成
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
    return;
  }
  console.log('SQLiteデータベースに接続しました');

  // テーブルを作成（存在しない場合のみ）
  db.serialize(() => {
    // 機械テーブルの作成
    db.run(
      `
      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        daily_fee INTEGER NOT NULL,
        likes INTEGER DEFAULT 0
      )
    `,
      (err) => {
        if (err) {
          console.error('機械テーブル作成エラー:', err.message);
        } else {
          // サンプルデータの挿入（すでに存在する場合は挿入されない）
          db.get('SELECT COUNT(*) as count FROM machines', (err, row) => {
            if (err) {
              console.error('カウントエラー:', err.message);
              return;
            }

            if (row.count === 0) {
              const stmt = db.prepare(
                'INSERT INTO machines (name, type, description, image_url, daily_fee) VALUES (?, ?, ?, ?, ?)'
              );

              const sampleData = [
                // 既存のサンプルデータ
                [
                  'トラクター A',
                  '耕運機',
                  '小型耕運機。1〜2反用',
                  '/images/tractor.jpg',
                  3000,
                ],
                [
                  '田植え機 B',
                  '田植え機',
                  '4条植え。中規模向け',
                  '/images/rice-planter.jpg',
                  5000,
                ],
                [
                  'コンバイン C',
                  '収穫機',
                  '小型汎用コンバイン',
                  '/images/combine.jpg',
                  7000,
                ],
                [
                  '動力噴霧器',
                  '防除機',
                  '背負い式、20Lタンク',
                  '/images/sprayer.jpg',
                  1500,
                ],
                [
                  '草刈り機',
                  '除草機',
                  'エンジン式、肩掛けタイプ',
                  '/images/mower.jpg',
                  1000,
                ],
              ];

              sampleData.forEach((data) => {
                stmt.run(data, (err) => {
                  if (err)
                    console.error('サンプルデータ挿入エラー:', err.message);
                });
              });

              stmt.finalize();
              console.log('機械のサンプルデータを挿入しました');
            }
          });
        }
      }
    );

    // 予約テーブルの作成
    db.run(
      `
      CREATE TABLE IF NOT EXISTS rentals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_phone TEXT NOT NULL,
        rental_date TEXT NOT NULL,
        return_date TEXT NOT NULL,
        status TEXT DEFAULT '予約済',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES machines (id)
      )
    `,
      (err) => {
        if (err) {
          console.error('予約テーブル作成エラー:', err.message);
        } else {
          console.log('予約テーブルを作成しました');
        }
      }
    );
  });
});

// データベースオブジェクトをエクスポート
module.exports = db;
