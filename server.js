const express = require('express');
const { Client } = require('pg'); // MySQL 대신 PostgreSQL 클라이언트 임포트
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // 파일 경로 처리

const app = express();
app.use(cors()); // 프론트엔드와 백엔드 간 통신 허용
app.use(bodyParser.json()); // JSON 데이터 해석

// **프론트엔드 정적 파일 서빙 설정 (Render 배포용)**
// public 폴더의 HTML, CSS, script.js 파일들을 브라우저에 제공합니다.
app.use(express.static(path.join(__dirname, 'public')));

// '/' 경로 요청 처리: 'Cannot GET /' 오류를 해결하고 login.html 페이지를 응답합니다.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ----------------------------------------------------
// 💡 PostgreSQL 연결 안정화 로직 (자동 재연결)
// ----------------------------------------------------
let dbClient; // DB 연결 객체를 전역으로 선언

function handleDisconnect() {
    // 1. PostgreSQL 연결 설정: Render는 DATABASE_URL 환경 변수를 제공합니다.
    dbClient = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/wetee' // 로컬 테스트용 기본값 포함
    });

    dbClient.connect((err) => {
        if (err) {
            console.error('PostgreSQL 연결 실패: 재시도 중...', err.code);
            // 2초 후 재귀적으로 재연결 시도
            setTimeout(handleDisconnect, 2000); 
        } else {
            console.log('PostgreSQL 데이터베이스 연결 성공!');
            // TODO: (선택 사항) 연결 성공 후 users 테이블 생성 쿼리를 실행할 수 있습니다.
        }
    });

    // 2. 연결 종료 이벤트 리스너: 연결이 끊기면 재연결 함수 호출
    dbClient.on('error', (err) => {
        console.error('PostgreSQL DB 오류 발생:', err.code);
        dbClient.end(); // 기존 연결 종료
        handleDisconnect(); // 재연결 시도
    });
}

// 최초 연결 시도
handleDisconnect();


// 2. 회원가입 API ( /signup )
app.post('/signup', async (req, res) => {
    const { name, age, gender, id, pw } = req.body;
    
    // SQL 명령어: PostgreSQL은 파라미터를 $1, $2, ... 형식으로 사용합니다.
    const sql = "INSERT INTO users (email, password, name, age, gender) VALUES ($1, $2, $3, $4, $5)";
    
    try {
        await dbClient.query(sql, [id, pw, name, age, gender]);
        res.json({ success: true, message: '회원가입 성공!' });
    } catch (err) {
        console.error('회원가입 쿼리 오류:', err); 
        // PostgreSQL의 중복 오류 코드('23505')를 확인하여 메시지를 분기할 수 있습니다.
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: '가입 실패: 이미 존재하는 이메일입니다.' });
        }
        res.status(500).json({ success: false, message: '회원가입 중 서버 오류 발생' });
    }
});

// 3. 로그인 API ( /login )
app.post('/login', async (req, res) => {
    const { id, pw } = req.body;

    // SQL 명령어: PostgreSQL 파라미터 $1, $2
    const sql = "SELECT name FROM users WHERE email = $1 AND password = $2";

    try {
        const results = await dbClient.query(sql, [id, pw]); // 비동기 쿼리 실행
        
        if (results.rows.length > 0) { // PostgreSQL은 results.rows를 통해 결과를 확인
            const user = results.rows[0];
            res.json({ success: true, name: user.name });
        } else {
            res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
    } catch (err) {
        console.error('로그인 쿼리 오류:', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 서버 실행 (환경 변수 PORT 사용)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});