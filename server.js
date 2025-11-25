const express = require('express');
const { Pool } = require('pg'); // pg 라이브러리에서 Pool(연결 관리자) 기능을 가져옵니다.
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // 파일 경로를 안전하게 다루기 위한 도구

const app = express();

/* ============================
    미들웨어 설정 (기본 설정)
    ============================ */
app.use(cors()); // 다른 주소(프론트엔드)에서 서버로 요청을 보낼 때 허용해줍니다.
app.use(bodyParser.json()); // 요청으로 들어온 데이터를 JSON 형식으로 해석해줍니다.

// **프론트엔드 파일 위치 지정**
// 'public' 폴더 안에 있는 HTML, CSS, JS 파일들을 브라우저가 볼 수 있게 개방합니다.
app.use(express.static(path.join(__dirname, 'public')));

// 루트 경로('/')로 접속했을 때 로그인 화면(login.html)을 보여줍니다.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

/* ============================
    데이터베이스 연결 설정 (PostgreSQL Pool 최적화)
    ============================ */
// 1. Pool 객체는 전역에서 '한 번만' 생성합니다. (자원 낭비 방지)
const pool = new Pool({
    // Render가 제공하는 DB 주소(DATABASE_URL)를 사용합니다.
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/wetee',
    
    // [중요] Render 무료 DB가 자주 끊기는 것을 방지하기 위한 설정입니다.
    idleTimeoutMillis: 30000, // 30초 동안 사용하지 않으면 연결을 정리해서 오류를 방지합니다.
    max: 20 // 동시에 연결할 수 있는 최대 개수입니다.
});

// Pool 내부에서 발생하는 에러 처리 (서버 종료 방지)
pool.on('error', (err) => {
    console.error('⚠️ DB 연결 풀 에러:', err.message);
});

// 2. 연결 재시도 로직 (기존 Pool 객체 재사용)
function connectToDB() {
    console.log('🔄 DB 연결을 시도합니다...');
    
    // pool.connect()는 Pool 객체 자체를 재사용합니다.
    pool.connect((err, client, done) => {
        if (err) {
            console.error(`❌ DB 연결 실패 (코드: ${err.code})`);
            console.log('⏳ 5초 후 다시 시도합니다...');
            // 2초 -> 5초로 늘려서 불필요한 로그 감소
            setTimeout(connectToDB, 5000); 
            return;
        }
        
        // 연결 성공 시
        client.release(); // 빌려온 연결을 다시 Pool에 돌려놓습니다.
        console.log('✅ PostgreSQL 데이터베이스 연결 성공!');
    });
}

// 서버 시작 시 최초 연결 시도
connectToDB();


/* ============================
    API 라우터 (회원가입 & 로그인)
    ============================ */

// 1. 회원가입 처리 ( /signup )
app.post('/signup', async (req, res) => {
    // 프론트엔드에서 보내준 데이터를 받아서 변수에 저장합니다.
    const { name, age, gender, id, pw } = req.body;
    
    // SQL 명령어: 데이터를 DB에 집어넣습니다. ($1, $2... 는 보안을 위한 자리표시자입니다)
    const sql = "INSERT INTO users (email, password, name, age, gender) VALUES ($1, $2, $3, $4, $5)";
    
    try {
        // DB에 명령을 보냅니다. (pool.query() 사용)
        await pool.query(sql, [id, pw, name, age, gender]);
        
        // 성공하면 성공 메시지를 보냅니다.
        res.json({ success: true, message: '회원가입 성공!' });
    } catch (err) {
        console.error('회원가입 실패:', err); 
        
        // 에러 코드 '23505'는 이미 있는 데이터(중복)라는 뜻입니다.
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }
        // 그 외의 알 수 없는 서버 오류
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 2. 로그인 처리 ( /login )
app.post('/login', async (req, res) => {
    const { id, pw } = req.body;

    // SQL 명령어: 이메일($1)과 비밀번호($2)가 모두 맞는 사람이 있는지 찾아봅니다.
    const sql = "SELECT name FROM users WHERE email = $1 AND password = $2";

    try {
        const results = await pool.query(sql, [id, pw]); // DB 조회 시작
        
        // 조회 결과가 1개 이상이면(로그인 성공)
        if (results.rows.length > 0) {
            const user = results.rows[0]; // 찾은 사용자 정보
            res.json({ success: true, name: user.name });
        } else {
            // 조회 결과가 없으면(로그인 실패)
            res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
    } catch (err) {
        console.error('로그인 실패:', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    }
});

/* ============================
    서버 실행
    ============================ */
// Render가 지정해준 포트가 있으면 그걸 쓰고, 없으면 3000번을 씁니다.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});