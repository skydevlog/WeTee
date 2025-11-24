const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // 프론트엔드와 백엔드 포트가 달라도 통신 허용
app.use(bodyParser.json()); // JSON 데이터 해석

// 1. 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234', // ★★★ 설치할 때 설정한 비밀번호로 꼭 변경하세요! ★★★
    database: 'wetee'
});

db.connect((err) => {
    if (err) {
        console.error('DB 연결 실패:', err);
    } else {
        console.log('MySQL 데이터베이스 연결 성공!');
    }
});

// 2. 회원가입 API ( /signup )
app.post('/signup', (req, res) => {
    const { name, age, gender, id, pw } = req.body;
    
    // SQL 명령어: users 테이블에 데이터 삽입
    const sql = "INSERT INTO users (email, password, name, age, gender) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [id, pw, name, age, gender], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ success: false, message: '회원가입 중 오류 발생 (아이디 중복 등)' });
        } else {
            res.json({ success: true, message: '회원가입 성공!' });
        }
    });
});

// 3. 로그인 API ( /login )
app.post('/login', (req, res) => {
    const { id, pw } = req.body;

    // SQL 명령어: 아이디와 비번이 일치하는 사람 찾기
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [id, pw], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '서버 오류' });

        if (results.length > 0) {
            // 로그인 성공 (찾은 사용자 정보 보냄)
            const user = results[0];
            res.json({ success: true, name: user.name });
        } else {
            // 로그인 실패
            res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
    });
});

// 서버 실행 (포트 3000번)
app.listen(3000, () => {
    console.log('서버가 3000번 포트에서 실행 중입니다.');
    console.log('접속 주소: http://localhost:3000/login.html');
});