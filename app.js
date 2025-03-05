const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const port = 3000;

// ダッシュボードルートをインポート
const dashboardRoutes = require('./routes/dashboard');

// ミドルウェア設定
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'layouts'), // layouts フォルダもビューの検索対象にする
]);
app.use(express.static(path.join(__dirname, 'public')));

// アプリ起動時に「likes」カラムを確認（ない場合は追加）
db.get('PRAGMA table_info(machines)', [], (err, result) => {
  if (err) {
    console.error('テーブル情報取得エラー:', err.message);
    return;
  }

  // likesカラムが存在するか確認し、なければ追加
  const hasLikesColumn =
    result && result.some((column) => column.name === 'likes');
  if (!hasLikesColumn) {
    db.run(
      'ALTER TABLE machines ADD COLUMN likes INTEGER DEFAULT 0',
      [],
      (err) => {
        if (err) {
          console.error('カラム追加エラー:', err.message);
        } else {
          console.log('「likes」カラムを追加しました');
        }
      }
    );
  }
});

// トップページ - 機械一覧表示
app.get('/', (req, res) => {
  db.all('SELECT * FROM machines', [], (err, machines) => {
    if (err) {
      console.error('クエリエラー:', err.message);
      return res.status(500).send('データベースエラー');
    }
    res.render('index', { machines });
  });
});

// レンタル申込フォーム表示
app.get('/rental/:id', (req, res) => {
  const machineId = req.params.id;

  db.get('SELECT * FROM machines WHERE id = ?', [machineId], (err, machine) => {
    res.render('rental_form', { machine });
  });
});

// 予約確認ページ
app.get('/confirmation/:id', (req, res) => {
  const rentalId = req.params.id;

  const query = `
    SELECT rentals.*, machines.name, machines.daily_fee
    FROM rentals
    JOIN machines ON rentals.machine_id = machines.id
    WHERE rentals.id = ?
  `;

  db.get(query, [rentalId], (err, rental) => {
    if (err) {
      console.error('クエリエラー:', err.message);
      return res.status(500).send('データベースエラー');
    }
    if (!rental) {
      return res.status(404).send('予約が見つかりません');
    }

    // 日数計算 (簡易版)
    const rentalDate = new Date(rental.rental_date);
    const returnDate = new Date(rental.return_date);
    const days =
      Math.round((returnDate - rentalDate) / (1000 * 60 * 60 * 24)) + 1;

    // 料金計算
    const totalFee = days * rental.daily_fee;

    res.render('confirmation', {
      rental,
      days,
      totalFee,
    });
  });
});

// 課題1: 機械を料金の安い順に表示
app.get('/machines/cheap', (req, res) => {
  // データベースから料金の安い順に機械の情報を取得する処理をここに追加

  // cheap_machines.ejsに遷移するように変更。
  // ヒント: res.render('ファイル名', { 変数: DBから取得した値 })
  res.redirect('/');
});

// 課題2: 機械名で検索する
app.get('/search', (req, res) => {
  const keyword = req.query.keyword || '';

  if (keyword === '') {
    return res.render('search', { machines: [], keyword: '' }); // 検索ワードなしの場合の処理
  }

  // データベースから検索ワードに合致する機械情報を取得する処理をここに追加

  // cheap_machines.ejsに遷移するように変更。
  // ヒント: res.render('ファイル名', { keyword: DBから取得した値, machines: DBから取得した値 })
  res.redirect('/');
});

// 課題3: 「いいね」ボタンの処理
app.post('/machines/:id/like', (req, res) => {
  const machineId = req.params.id;
  const referer = req.headers.referer || '/';

  if (req.headers.referer) {
    try {
      const url = new URL(req.headers.referer);
      redirectPath = url.pathname;
    } catch (e) {
      console.error('URL解析エラー:', e);
    }
  }

  // いいね数を増やす処理をここに追加

  res.redirect(redirectPath);
});

// 課題4: 人気順（いいねの多い順）に機械を表示(front・backend)
app.get('/machines/popular', (req, res) => {
  // データベースからいいねの多い順に機械の情報を取得する処理をここに追加

  // 取得したデータをpopular_machines.ejsに渡す
  // ヒント: res.render('ファイル名', {machines: データベースから取得した値})
  res.redirect('/');
});

app.post('/rental/:id', (req, res) => {
  const machineId = req.params.id;

  // データベースに挿入
  db.run(
    'INSERT INTO rentals (machine_id, user_name, user_phone, rental_date, return_date) VALUES (?, ?, ?, ?, ?)',
    [
      machineId,
      req.body.user_name,
      req.body.user_phone,
      req.body.rental_date,
      req.body.return_date,
    ],
    function (err) {
      // 最後に挿入されたレコードのIDを取得
      const newRentalId = this.lastID;
      console.log(newRentalId);

      // 予約確認ページへリダイレクト
      res.redirect(`/confirmation/${newRentalId}`);
    }
  );
});

// ダッシュボードルートの使用
app.use('/dashboard', dashboardRoutes);

// SQLクエリ実行のルートも移行
app.use('/execute-sql', dashboardRoutes);

// サーバー起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});
