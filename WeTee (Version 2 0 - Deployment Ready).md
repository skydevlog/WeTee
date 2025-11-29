# WeTee (Version 2.0 - Deployment Ready)

---

## 웹 주소

---

https://wetee.onrender.com/

## 아키텍처 및 기술 스택

---

| 구분 | WeTee.md | WeTee_v2.0 | 이유 |
| --- | --- | --- | --- |
| 백엔드 | Node.js(Express) | Node.js(Express) | 유지 |
| 데이터베이스 | MySQL(로컬 기준) | PostgreSQL(Render Free Tier) | Render의 기본 지원 DB를 사용하여 배포 복잡성 제거 |
| DB 라이브러리 | mysql | pg(Node.js PostgreSQL driver) | DB 전환에 따른 필수 라이브러리 변경 |
| 배포 플랫폼 | 로컬 실행 | Render(Node.js Web Service) | 클라우드 환경에서 24시간 서비스 제공 |

## 발생 오류 및 해결 과정

---

| **오류 유형** | **원인 및 로그** | **해결 방법** | **최종 코드 반영** |
| --- | --- | --- | --- |
| Cannot GET / | Express 서버가 루트 경로(/)에 대해 응답할 파일(HTML)을 찾지 못함. | / 요청 시 “public/login.html”을 명시적으로 응답하도록 app.get(‘/’) 라우터 추가 | server.js |
| 500 Internal Error(MySQL) | 1. DB_HOST가 localhost로 설정됨. 2. Render DB에 접속 정보 자체가 틀림. | DB를 MySQL에서 PostgreSQL로 전환하여 환경 변수 문제를 단순화합니다. | server.js |
| ECONNREFUSED 반복 | Render DB 서비스가 절전 모드이거나, 웹 서비스가 DB 연결을 계속 거부당함. | DB 서비스를 수동 재시작하고, pgAdmin을 사용하여 DB 방화벽/비밀번호 인증 문제를 해결합니다. | DB 서비스 설정 |
| 요청 pending 및 3초 끊김 | pg.Client 단일 연결 방식 사용으로, Render DB의 짧은 세션 타임아웃(약 3초) 발생 시 연결이 끊어짐. | pg.Pool(연결 풀) 방식으로 전환하여 DB 연결을 재사용하고 안정성 확보. | server.js |
| 회원가입 500(테이블 없음) | users 테이블이 PostgreSQL DB에 생성되어 있지 않음. | pgAdmin의 Query Tool에서 CREATE TABLE users (…) 쿼리 실행 완료. | DB 설정 완료 |

## 폴더 구조

---

```
WeTee/             (최상위 프로젝트 폴더)
│
├── node_modules/          (npm install로 설치된 라이브러리들)
│
├── public/                (프론트엔드 폴더: 브라우저가 접근하는 곳)
│   ├── index.html         (메인 화면 - 로그인 후 접근)
│   ├── login.html         (로그인 화면 - 사이트 접속 시 첫 화면)
│   ├── signup.html        (회원가입 화면)
│   ├── style.css          (전체 디자인 통합 파일)
│   └── script.js          (프론트엔드 로직 통합 파일)
│
├── .env                   (환경변수 파일 - DB 주소 등 보안 정보 저장)
├── .gitignore             (Git에 올리지 않을 파일 목록 설정)
├── database.sql           (데이터베이스 테이블 생성 쿼리 백업)
├── package.json           (프로젝트 정보 및 실행 스크립트 "start": "node server.js")
├── package-lock.json      (설치된 라이브러리 버전 잠금 파일)
├── README.md              (프로젝트 설명서)
└── server.js              (백엔드 서버 실행 파일)
```

## 웹 서비스 동작 순서

---

| **단계 (Step)** | **동작 (Action)** | **관련 파일 (Files)** | **핵심 코드 로직 및 상세 설명 (Code Logic & Detail)** |
| --- | --- | --- | --- |
| **1. 서버 부팅** | **초기화 및 DB 연결** | `package.json`, `server.js`, `database.sql` | • **실행**: `npm start` 명령이 `"start": "node server.js"`를 실행하여 진입점인 `server.js`를 깨웁니다. • **설정**: `express.static(..., { index: false })`로 `index.html` 자동 노출을 차단합니다. • **DB**: `new Pool` 생성 시 `idleTimeoutMillis: 30000`(30초 유휴 해제), `max: 20` 설정을 적용해 끊김을 방지하고, 실패 시 `setTimeout`으로 **5초 후 재시도**합니다. |
| **2. 접속** | **강제 리다이렉트** | `server.js` | • **요청**: 사용자가 루트 경로(`/`)로 접속하면 `app.get('/')` 라우터가 이를 감지합니다. • **이동**: 즉시 `res.redirect('/login.html')`을 실행하여 메인 화면을 건너뛰고 **로그인 페이지로 강제 이동**시킵니다. |
| **3. 렌더링** | **화면 표시** | `login.html`, `style.css`, `script.js` | • **스타일**: `style.css`가 로드되어 `.login-container` 등 UI 디자인을 입힙니다. • **노출**: `script.js`의 `checkLoginStatus()`가 실행되지만, 메인 페이지가 아니므로 `else` 블록이 작동, `document.body.style.display = 'flex'`를 통해 **검사 없이 화면을 즉시 표시**합니다. |
| **4. 회원가입** | **검증 및 저장** | `script.js`, `style.css`, `server.js` | • **검증**: 비밀번호 입력 시 `validatePassword()`가 정규식(regex)을 확인하고, 실패 시 `.error-text`(`pwErrorMsg`)를 `block`으로 바꿔 경고합니다. • **저장**: `fetch('/signup')`로 전송된 데이터를 서버가 `INSERT`합니다. 이때 중복 이메일은 에러 코드 `'23505'`로 감지하여 처리합니다. |
| **5. 로그인** | **인증 및 상태 저장** | `script.js`, `server.js` | • **요청**: `fetch('/login')`로 아이디/비번을 전송합니다. • **조회**: 서버는 `SELECT` 쿼리로 일치하는 유저를 찾고 성공 시 이름을 반환합니다. • **저장**: 성공 응답을 받으면 `localStorage.setItem('isLoggedIn', 'true')`를 실행하고 `index.html`로 이동합니다. |
| **6. 메인 진입** | **보안 검사 (Auth)** | `index.html`, `script.js`, `style.css` | • **숨김**: `index.html`의 `<body>`는 `style="display: none;"`으로 설정되어 있어 초기 로딩 시 **화면이 보이지 않습니다**. • **검사**: `checkLoginStatus()`가 실행되어 `localStorage` 정보를 확인합니다. • **결과**: 로그인 상태면 환영 문구와 함께 `display: flex`를 적용해 화면을 보여줍니다(세로 정렬). 비로그인 시 `alert` 후 쫓아냅니다. |
| **7. 로그아웃** | **세션 삭제** | `index.html`, `script.js` | • **실행**: 로그아웃 버튼 클릭 시 이벤트 리스너가 작동합니다. • **삭제**: `localStorage.removeItem(...)`으로 저장된 인증 정보를 모두 지우고 로그인 페이지로 이동합니다. |

### 1단계: 서버 부팅 및 DB 연결 (Server Initialization)

관리자가 배포 환경(Render 등)에서 서비스를 시작할 때의 과정입니다.

1. 서버 실행 명령:
- package.json의 scripts 설정인 "start": "node server.js"가 실행되어 server.js를 깨웁니다.
- "main": "server.js" 설정은 이 패키지의 진입점이 server.js임을 명시합니다.
2. 미들웨어 및 정적 파일 설정:
- 라이브러리 로드: express, pg, cors, body-parser가 로드됩니다.
- 공통 미들웨어: app.use(cors())로 도메인 간 통신을 허용하고, app.use(bodyParser.json())으로 JSON 데이터를 받을 준비를 합니다.
- 정적 파일 경로: app.use(express.static(..., { index: false })) 코드가 실행됩니다. 이는 public 폴더를 개방하되, 루트 접속 시 index.html을 자동으로 보여주는 기본 기능을 끄는(false) 핵심 설정입니다.
3. 데이터베이스(DB) 연결 풀 생성:
- new Pool({...})을 통해 PostgreSQL 연결 설정을 초기화합니다.
- 안정성 설정: idleTimeoutMillis: 30000 (30초 유휴 시 연결 해제)과 max: 20 (최대 접속 20명) 설정이 적용되어 클라우드 환경에서의 끊김을 방지합니다.
- 스키마 정의: 이 DB는 database.sql에 정의된 대로 users 테이블(id, email, password, name, age, gender)을 포함합니다.
4. DB 연결 실행:
- connectToDB() 함수가 실행됩니다. 연결 실패 시 setTimeout을 통해 5초 후 재시도하는 로직이 작동하여 서버가 죽지 않고 DB를 기다립니다.

### 2단계: 클라이언트 접속 및 리다이렉트 (Access & Redirect)

사용자가 브라우저에 주소(https://.../)를 입력했을 때입니다.

1. 루트 경로 요청:
- 사용자가 / 경로로 접속합니다.
- server.js의 app.get('/', ...) 라우터가 요청을 받습니다.
2. 강제 이동:
- 서버는 res.redirect('/login.html') 응답을 보내, 사용자를 즉시 로그인 페이지로 강제 이동시킵니다.

### 3단계: 로그인/회원가입 화면 렌더링 (Frontend Rendering)

사용자가 login.html 또는 signup.html을 볼 때입니다.

1. 스타일 적용:
- HTML 파일들은 <link rel="stylesheet" href="style.css">를 로드합니다.
- style.css는 .login-container로 박스를 중앙 정렬하고, input 태그들의 디자인을 정의합니다.
2. 스크립트 로드 및 화면 표시:
- HTML 하단에서 <script src="script.js"></script>를 로드합니다.
- 초기화 로직: script.js가 로드되면 맨 아래의 checkLoginStatus()가 즉시 실행됩니다.
- 화면 노출: 현재 페이지가 메인(index.html)이 아니므로, else 블록이 실행되어 document.body.style.display = 'flex'가 적용됩니다. 즉, 로그인 화면은 검사 없이 바로 보여집니다.

### 4단계: 회원가입 프로세스 (Sign Up Process)

1. 입력값 검증 (프론트엔드):
- 사용자가 비밀번호를 입력할 때마다 signupPwInput의 input 이벤트가 발생해 validatePassword() 함수를 실행합니다.
- 정규식(regex)을 통과하지 못하면 pwErrorMsg(style.css의 .error-text)를 block으로 바꿔 경고 메시지를 보여줍니다.
2. 데이터 전송:
- 가입 버튼 클릭 시 fetch 함수가 실행되어 입력된 데이터를 JSON으로 변환해 /signup 주소로 POST 요청을 보냅니다.
3. DB 저장 (백엔드):
- server.js의 app.post('/signup') 라우터가 데이터를 받습니다.
- INSERT INTO users ... SQL 쿼리를 실행합니다.
- 중복 처리: 만약 이메일이 이미 존재하면 DB 에러 코드 '23505'를 감지하여 클라이언트에게 "이미 가입된 이메일입니다"라는 메시지를 반환합니다.

### 5단계: 로그인 프로세스 (Login Process)

1. 로그인 요청:
- login.html에서 폼 제출 시, script.js가 아이디/비번을 /login으로 POST 전송합니다.
2. 사용자 조회 (백엔드):
- server.js의 app.post('/login') 라우터가 SELECT name FROM users WHERE ... 쿼리를 실행합니다.
- 일치하는 사용자가 있으면(results.rows.length > 0) 성공 응답과 사용자 이름을 보냅니다.
3. 상태 저장 (프론트엔드):
- 응답이 성공이면 script.js는 localStorage에 isLoggedIn = 'true'와 currentUser를 저장하고, index.html로 페이지를 이동시킵니다.

### 6단계: 메인 화면 보안 및 표시 (Main Page & Auth Check)

가장 중요한 보안 로직입니다.

1. 초기 화면 숨김 (Flash 방지):
- index.html의 <body> 태그는 style="display: none;" 속성을 가지고 있어, 브라우저가 파일을 읽어도 화면에는 아무것도 나오지 않습니다.
2. 권한 검사:
- script.js의 checkLoginStatus() 함수가 실행됩니다.
- 검사 조건: window.location.pathname을 확인해 현재 페이지가 메인 화면인지 판단합니다.
3. 분기 처리:
- Case A: 로그인 안 함: localStorage에 정보가 없으면 alert을 띄우고 즉시 login.html로 쫓아냅니다. 화면은 여전히 보이지 않습니다.
- Case B: 로그인 함: localStorage 정보가 확인되면:
    1. welcomeMsg 태그에 "000님 안녕하세요!" 텍스트를 넣습니다.
    2. document.body.style.display = 'flex' 코드를 실행하여, 숨겨져 있던 화면을 짠! 하고 보여줍니다.
    3. style.css의 main { flex-direction: column; } 덕분에 로고와 환영 문구가 세로로 정렬되어 나타납니다.

### 7단계: 로그아웃 (Logout)

1. 로그아웃 실행:
- index.html의 로그아웃 버튼 클릭 시, script.js의 이벤트 리스너가 작동합니다.
- localStorage.removeItem(...)으로 저장된 정보를 모두 삭제하고, 다시 login.html로 이동시킵니다.

## Code

---

### public

- index.html(메인 화면)
    
    ```html
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>WeTee - 메인</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body style="display: none;">
    
        <header>
            <div class="header-content">
                <span id="welcomeMsg"></span>
                <button id="logoutBtn" class="nav-btn">로그아웃</button>
            </div>
        </header>
    
        <main>
            <h1 class="logo-text">WeTee</h1>
            <h3 class="sub-text">안녕하세요. WeTee에 오신 것을 환영합니다.</h3>
        </main>
    
        <script src="script.js"></script>
    </body>
    </html>
    ```
    
- login.html(로그인 화면 - 사이트 접속 시 첫 화면)
    
    ```html
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>WeTee - 로그인</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <div class="login-container">
            <h2>WeTee 로그인</h2>
            <form id="loginForm">
                <input type="text" id="loginId" placeholder="아이디 (이메일)" required>
                <input type="password" id="loginPw" placeholder="비밀번호" required>
                <button type="submit" class="login-btn">로그인</button>
            </form>
            
            <div class="signup-link">
                아직 계정이 없으신가요? <a href="signup.html">회원가입</a>
            </div>
        </div>
    
        <script src="script.js"></script>
    </body>
    </html>
    ```
    
- signup.html(회원가입 화면)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>WeTee - 회원가입</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="login-container">
        <h2>WeTee 회원가입</h2>
        <form id="signupForm">
            <input type="text" id="name" placeholder="이름" required>
            
            <input type="number" id="age" placeholder="나이" required>
            
            <select id="gender" required>
                <option value="" disabled selected>성별 선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
            </select>
            
            <input type="email" id="signupId" placeholder="아이디 (이메일)" required>
            
            <input type="password" id="signupPw" placeholder="비밀번호" required>
            <p id="pwErrorMsg" class="error-text"></p>

            <button type="submit" class="login-btn">가입하기</button>
        </form>
        
        <div class="signup-link">
            이미 계정이 있으신가요? <a href="login.html">로그인</a>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

- script.js(프론트엔드 로직 통합 파일)

```jsx
// 서버 주소 (Node.js 서버)
// Render에 동시 배포 시, 같은 도메인을 사용하므로 빈 문자열(상대 경로)로 설정합니다.
const SERVER_URL = "";

/* ============================
   1. 페이지 로드 및 로그인 체크 (통합됨)
   ============================ */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn'); // 로그인 여부만 브라우저에 남김
    const userName = localStorage.getItem('currentUser');
    // 현재 페이지가 메인(index.html)인지 확인 (루트 경로 '/' 포함)
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    // [메인 화면 로직]
    if (isIndexPage) {
        if (!isLoggedIn) {
            // 1. 비로그인 상태면 즉시 쫓아냄
            alert("로그인이 필요한 서비스입니다.");
            window.location.href = 'login.html';
        } else {
            // 2. 로그인 상태면 환영 메시지 표시 및 화면 공개
            if (document.getElementById('welcomeMsg')) {
                document.getElementById('welcomeMsg').innerText = userName + "님 안녕하세요!";
            }
            // 숨겨뒀던 화면을 짠! [cite_start]하고 보여줌 [cite: 1]
            document.body.style.display = 'flex';
        }
    } 
    // [로그인/회원가입 화면 로직]
    else {
        // 메인 화면이 아니면 그냥 보여줌 (혹시 숨겨져 있을 경우 대비)
        document.body.style.display = 'flex';
    }
}

// 페이지가 로드되자마자 실행
checkLoginStatus();

/* ============================
   2. 로그아웃 로직
   ============================ */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        alert('로그아웃 되었습니다.');
        window.location.href = 'login.html';
    });
}

/* ============================
   3. 회원가입 로직
   ============================ */
const signupForm = document.getElementById('signupForm');
const signupPwInput = document.getElementById('signupPw');
const pwErrorMsg = document.getElementById('pwErrorMsg');

// 비밀번호 검증
function validatePassword() {
    const pw = signupPwInput.value;
    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!regex.test(pw)) {
        pwErrorMsg.style.display = 'block';
        pwErrorMsg.textContent = "조건 불충족: 8자 이상, 대문자/숫자/특수문자 포함";
        return false;
    } else {
        pwErrorMsg.style.display = 'none';
        return true;
    }
}

if (signupForm) {
    signupPwInput.addEventListener('input', validatePassword);

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validatePassword()) return;

        const userData = {
            name: document.getElementById('name').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            id: document.getElementById('signupId').value,
            pw: document.getElementById('signupPw').value
        };
        // ★ 서버로 데이터 전송 (fetch) ★
        fetch(`${SERVER_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('회원가입 성공! DB에 저장되었습니다.');
                window.location.href = 'login.html';
            } else {
                alert('가입 실패: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    });
}

/* ============================
   4. 로그인 로직
   ============================ */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const loginData = {
            id: document.getElementById('loginId').value,
            pw: document.getElementById('loginPw').value
        };

        // ★ 서버로 로그인 요청 (fetch) ★
        fetch(`${SERVER_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 로그인 성공 시 브라우저에 '로그인 했다'는 표시만 남김
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', data.name);
                alert(data.name + '님 환영합니다!');
                window.location.href = 'index.html';
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    });
}
```

- style.css(전체 디자인 통합 파일)

```css
/* 기본 설정 */
body {
    margin: 0;
    font-family: 'Arial', sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #fff; /* 배경색 명시 */
}

/* 헤더 */
header {
    padding: 20px;
    background-color: #f4f4f4;
    border-bottom: 1px solid #e0e0e0; /* 헤더 구분선 추가 */
    display: flex;
    justify-content: flex-end; /* 오른쪽 정렬 */
    align-items: center; /* 세로 중앙 정렬 */
}

/* 환영 메시지 (index.html) */
#welcomeMsg {
    margin-right: 15px;
    font-weight: bold;
    color: #333;
    font-size: 16px;
}

/* 로그아웃 버튼 */
.nav-btn {
    padding: 8px 16px;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px; /* 버튼 둥글게 */
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s; /* 마우스 올렸을 때 부드럽게 */
}

.nav-btn:hover {
    background-color: #555;
}

/* 메인 본문 */
main {
    flex: 1;
    display: flex;
    flex-direction: column; /* 세로 정렬 (로고 아래에 텍스트 오도록) */
    justify-content: center;
    align-items: center;
}

.logo-text {
    font-size: 60px; /* 로고 크기 키움 */
    font-weight: 800;
    color: #333;
    margin: 0 0 20px 0; /* 아래쪽 여백 추가 */
}

/* 메인 화면 서브 텍스트 (h3) */
.sub-text {
    font-size: 18px;
    color: #666;
    font-weight: normal;
    margin: 0;
}

/* 로그인/회원가입 박스 공통 */
.login-container {
    width: 320px; /* 너비 약간 넓힘 */
    margin: 100px auto; /* 상하 여백 100px, 좌우 중앙 정렬 */
    padding: 40px;
    border: 1px solid #ddd;
    text-align: center;
    border-radius: 12px; /* 박스 둥글게 */
    box-shadow: 0 4px 12px rgba(0,0,0,0.05); /* 그림자 효과 추가 */
}

.login-container h2 {
    margin-top: 0;
    margin-bottom: 30px;
    color: #333;
}

/* 입력 필드 (input, select) */
.login-container input,
select {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    box-sizing: border-box;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
}

/* 입력 필드 포커스 효과 */
.login-container input:focus,
select:focus {
    border-color: #007bff;
    outline: none;
}

/* 로그인/가입 버튼 */
.login-btn {
    width: 100%;
    padding: 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    margin-top: 10px;
}

.login-btn:hover {
    background-color: #0056b3;
}

/* 링크 스타일 */
.signup-link {
    margin-top: 20px;
    font-size: 13px;
    color: #666;
}

.signup-link a {
    color: #007bff;
    text-decoration: none;
    font-weight: bold;
}

.signup-link a:hover {
    text-decoration: underline;
}

/* 에러 메시지 */
.error-text {
    color: #e74c3c; /* 더 선명한 빨간색 */
    font-size: 12px;
    text-align: left;
    margin: -5px 0 15px 5px;
    display: none;
}
```

### server.js(백엔드 서버 실행 파일)

```jsx
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
// 그리고 index.html 자동 연결 끄기
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// 접속 시 무조건 로그인 페이지로 이동
app.get('/', (req, res) => {
    res.redirect('/login.html');
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
```

### database.sql(데이터베이스 테이블 생성 쿼리 백업)

```sql
-- 이 파일은 실행되는 코드가 아니라, DB 구조를 기록해두는 백업 파일입니다.
-- 나중에 DB를 초기화하거나 다시 만들 때 이 코드를 사용하세요.

-- 1. 기존 테이블이 있다면 삭제 (초기화)
DROP TABLE IF EXISTS users;

-- 2. users 테이블 새로 생성 (컬럼 길이 확장 적용됨)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE, -- 이메일 길이 넉넉하게
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,         -- 이름 길이 넉넉하게
    age INTEGER,
    gender VARCHAR(50)                  -- 성별 길이 넉넉하게 (오류 해결 핵심)
);

------------------------------------------------------------------------------------------

SELECT * FROM users;
```

### .gitignore(Git에 올리지 않을 파일 목록 설정)

```markdown
# 1. 의존성 모듈 (가장 중요! 절대 올리면 안 됩니다.)
node_modules/

# 2. 환경변수 파일 (비밀번호, API 키 등 보안 정보)
.env

# 3. 운영체제 시스템 파일 (불필요한 파일)
.DS_Store
Thumbs.db

# 4. 에러 로그 등
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### package.json(프로젝트 정보 및 실행 스크립트 "start": "node server.js")

```json
{
  "name": "login_project",
  "version": "1.0.0",
  "description": "",
  "main": "script.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "body-parser": "^2.2.1",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "pg": "^8.16.3"
  }
}

```

## Render

---

Render 홈페이지 - 로그인 - 대시보드 - 프로젝트 - 서비스를 삭제하면 사용량이 초기화되나요?

- 아니요. 서비스를 삭제해도 이미 사용한 시간과 데이터 전송량은 0으로 돌아가지 않습니다.

달마다 사용량이 초기화되나요?

- 네 맞습니다. Render의 무료 사용량(750시간, 100GB 등)은 매달 1일(또는 계정 결제 주기 시작일)에 자동으로 초기화됩니다.
- 다음 달이 되면 다시 0시간부터 시작합니다.

무료 인스턴스 시간의 의미

- 750시간은 한 달(31일) 내내(24시간) 서버를 켜놓아도 무료라는 뜻입니다.
- 24시간 * 31일 = 744시간
- 현재 Web Service 1개만 돌리고 있다면, 끄지 않고 계속 켜두어도 한 달 동안 무료 한도를 초과하지 않습니다.
- 다만, 무료 Web Service는 접속이 없으면 자동으로 절전 모드(Spin down)로 돌아가서 시간을 아꺼줍니다.

Render Postgres 서비스 사용시 주의사항

- Render의 무료 PostgreSQL은 생성 후 90일까지만 무료입니다.
- 90일이 지나면 데이터베이스가 만료되어 삭제될 수 있으니, 3개월 뒤에는 데이터를 백업하거나 유료로 전환해야 한다는 점을 꼭 기억해 두세요.

Render 무료 티어 정책 비교 표

| 구분 | Web Service (Node.js 서버) | PostgreSQL (데이터베이스) |
| --- | --- | --- |
| 핵심 개념 | 월간 이용권 (Time Bank) | 유통기한 (Expiration Date) |
| 비유 | 휴대폰 데이터 요금제(매달 충전됩니다.) | 우유 유통기한(개봉하든 안 하든 날짜 지나면 끝납니다.) |
| 무료 제공량 | 매월 750시간(24시간 × 31일 = 744시간이므로 한 달 내내 충분) | 생성일로부터 90일(90일이 지나면 데이터베이스 만료/삭제됩니다.) |
| 초기화(리셋) 시점 | 매달 1일(사용량이 0시간으로 자동 초기화) | 초기화 없습니다. (90일 카운트다운은 멈추거나 리셋되지 않습니다.) |
| 삭제 후 재생성 시 | 누적 적용(지웠다 다시 만들어도 이번 달 이미 쓴 시간은 그대로 남습니다.) | 새로 시작 (Reset) (새로 만들면 다시 90일짜리 새것을 받습니다. 85일 남는 게 아닙니다.) |
| 제한 사항 | 개수 제한 없음 (시간 총합만 750시간 이내면 됩니다.) | 계정당 1개만 생성 가능합니다. |