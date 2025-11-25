const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // 파일 경로 처리

const app = express();
app.use(cors()); // 프론트엔드와 백엔드 포트가 달라도 통신 허용
app.use(bodyParser.json()); // JSON 데이터 해석

// **프론트엔드 정적 파일 서빙 설정 (Render 배포를 위해 추가)**
// public 폴더의 HTML, CSS, script.js 파일들을 브라우저에 제공합니다.
app.use(express.static(path.join(__dirname, 'public')));

// 'Cannot GET /' 오류를 해결하고 사용자를 login.html 페이지로 리디렉션합니다.
app.get('/', (req, res) => {
    // 사용자가 '/'로 접속하면 public/login.html 파일을 응답으로 보냅니다.
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 1. 데이터베이스 연결 설정
// **Render 배포 시 환경 변수(Environment Variables) 사용으로 수정**
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '127C4@gpi', // 로컬 개발 시 기본값 '1234' (DB_PASSWORD 환경 변수에 실제 비밀번호 설정 필요)
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

// 서버 실행 (포트 3000번 대신 환경 변수 PORT 사용)
// Render에서는 PORT 환경 변수에 접속 가능한 포트 번호를 자동으로 할당합니다.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});