const express = require('express');
const { Pool } = require('pg'); // Client 대신 Pool (연결 풀) 임포트
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
// 💡 PostgreSQL 연결 풀 (Pool) 사용 로직
// ----------------------------------------------------
let pool; // Pool 객체를 전역으로 선언

function handleConnectPool() {
    // 1. PostgreSQL 연결 풀 설정
    pool = new Pool({
        // Render는 Pool 객체에도 DATABASE_URL을 환경 변수로 제공합니다.
        connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/wetee',
        // 옵션: 유휴 연결 유지 시간 설정 (Render 환경에서 안정성 향상)
        idleTimeoutMillis: 30000, // 30초 후 유휴 연결 정리
        max: 20 // 최대 연결 개수
    });

    // Pool에서 오류 발생 시 처리 로직
    pool.on('error', (err, client) => {
        // 이 오류는 Pool 내부에서 자동으로 재연결을 시도하므로 서버를 종료하지 않습니다.
        console.error('PostgreSQL Pool 오류 발생:', err.message, err.code);
    });

    // 초기 연결 테스트 (Pool 초기화 성공 확인)
    pool.connect((err, client, done) => {
        if (err) {
            console.error('PostgreSQL 연결 풀 초기화 실패: 재시도 중...', err.code);
            // 초기 연결 실패 시 2초 후 재시도
            setTimeout(handleConnectPool, 2000); 
            return;
        }
        client.release(); // 연결 테스트 후 클라이언트를 Pool로 반환
        console.log('PostgreSQL 연결 풀 초기화 및 DB 접속 성공!');
        // DB 연결 성공 후에는 별도의 재연결 루프가 필요 없습니다.
    });
}

// 최초 연결 시도
handleConnectPool();


// 2. 회원가입 API ( /signup )
app.post('/signup', async (req, res) => {
    const { name, age, gender, id, pw } = req.body;
    
    // SQL 명령어: PostgreSQL은 파라미터를 $1, $2, ... 형식으로 사용합니다.
    const sql = "INSERT INTO users (email, password, name, age, gender) VALUES ($1, $2, $3, $4, $5)";
    
    try {
        await pool.query(sql, [id, pw, name, age, gender]); // dbClient.query 대신 pool.query 사용
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
        const results = await pool.query(sql, [id, pw]); // dbClient.query 대신 pool.query 사용
        
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