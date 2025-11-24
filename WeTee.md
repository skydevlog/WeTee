# 로그인 화면 간단하게 구현하기

---

### vscode 파일 겹침 문제 해결

1. Windows/Linux : ctrl + ,
2. 설정창 상단 검책창에 Compact Folders를 입력합니다.
3. Explorer: Compact Folders라는 옵션이 나타나면, 해당 체크박스를 해제합니다.

### Git “Author Identity Unknown” 오류

```bash
PS C:\Users\user\Desktop\login_project> echo "# WeTee" >> README.md
>> git init
>> git add README.md
>> git commit -m "first commit"
>> git branch -M main
>> git remote add origin https://github.com/skydevlog/WeTee.git
>> git push -u origin main
Initialized empty Git repository in C:/Users/user/Desktop/login_project/.git/
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
Omit --global to set the identity only in this repository.

fatal: unable to auto-detect email address (got 'user@pc.(none)')
error: src refspec main does not match any
error: failed to push some refs to 'https://github.com/skydevlog/WeTee.git'
```

- 의미 : 작성자(Author)의 신원(Identity)을 알 수 없음(Unknown)
- Git 초기 설정(Config)을 안 해서 Author identity unknown 에러가 떴습니다.

Error

```bash
error: src refspec main does not match any
=> 설정이 없어서 커밋이 실패했으므로, main이라는 브랜치가 생성되지 않았습니다.
error: failed to push some refs to 'https://github.com/skydevlog/WeTee.git'
```

해결 방법

```bash
git config --global user.email "본인_깃허브_이메일@example.com"
git config --global user.name "본인_영어_닉네임"
```

## 아키텍처 설계(Architecture Design)

---

### 기술 스택 선정

- 프론트엔드 : HTML, CSS, JavaScript
- 백엔드 : Node.js(Express)
- 데이터베이스 : MySQL : 1234

### 폴더 구조 결정

```
WeTee/                  (최상위 프로젝트 폴더)
│
├── node_modules/       (라이브러리들이 설치된 폴더 - 건드리지 않음)
│
├── public/             (프론트엔드 폴더: 브라우저가 접근 가능한 곳)
│   ├── index.html      (메인 화면)
│   ├── login.html      (로그인 화면)
│   ├── signup.html     (회원가입 화면)
│   ├── style.css       (디자인)
│   └── script.js       (프론트엔드 로직)
│
├── server.js           (⚙️ 백엔드 파일: 서버 실행 및 DB 연결)
├── package.json        (프로젝트 설정 파일)
└── package-lock.json   (버전 잠금 파일)
```

### 회원정보 저장 방법
- 2번 방법을 사용합니다.

| **구분** | **1. 로컬스토리지 (LocalStorage)** | **2. 백엔드 + 데이터베이스 (DB)** |
| --- | --- | --- |
| **저장 위치** | 사용자의 웹 브라우저 내부 (내 컴퓨터) | 원격 서버의 하드디스크 (MySQL) |
| **접근 범위** | 저장한 그 컴퓨터(브라우저)에서만 보임.
(다른 컴퓨터나 핸드폰에서는 로그인 불가) | 인터넷만 되면 어디서든 로그인 가능.
(PC, 핸드폰, 친구 컴퓨터 등) |
| **데이터 공유** | 나만 볼 수 있음. (다른 사람과 소통 불가능) | 모든 사용자의 데이터가 한곳에 모임.
(게시판, 채팅 등 소통 가능) |
| **보안성** | 매우 취약함.
브라우저 개발자 도구(F12)만 켜면 누구나 비밀번호를 볼 수 있음. | 안전함.
데이터가 서버 내부에 숨겨져 있고, 관리자만 접근 가능함. |
| **데이터 수명** | 사용자가 '인터넷 사용 기록 삭제'를 하면 다 날아감. | 사용자가 탈퇴하거나 관리자가 지우기 전까지 영구 보존. |
| **난이도** | 매우 쉬움. (코드 1~2줄) | 어려움. (서버 언어, SQL 공부, 설치 과정 필요) |
| **주 사용처** | 자동 로그인 여부, 다크모드 설정, 장바구니 임시 저장, 프로토타입(연습용) | 실제 서비스 (회원가입, 결제 내역, 게시글 저장 등) |

### Node.js 프로젝트 초기화

```bash
npm init -y
```

### Node.js 서버 라이브러리 설치

```bash
npm install express mysql cors body-parser
```

### MySQL 설정

```markdown
MySQL
- Root 계정 : 1234
    - MySQL Workbench
```

## 프론트엔드

---

- 메인 화면 - index.html
    
    ```html
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>WeTee - 메인</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <header>
            <div class="header-content">
                <span id="welcomeMsg" style="margin-right: 15px; font-weight: bold;"></span>
                <button id="logoutBtn" class="nav-btn">로그아웃</button>
            </div>
        </header>
    
        <main>
            <h1 class="logo-text">WeTee</h1>
        </main>
    
        <script src="script.js"></script>
        <script>
            // 이 페이지가 열리면 즉시 로그인 상태를 확인
            checkLoginStatus();
        </script>
    </body>
    </html>
    ```
    
- 로그인 화면 - login.html
    
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
    
- 회원가입 화면 - signup.html
    
    ```html
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>WeTee - 회원가입</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <div class="login-container" style="margin-top: 50px;">
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
    
- 스타일 시트 - style.css
    
    ```css
    /* 기본 설정 */
    body {
        margin: 0;
        font-family: 'Pretendard', Arial, sans-serif; /* 폰트 깔끔하게 */
        height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: #fff;
    }
    
    /* 헤더 스타일 */
    header {
        padding: 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }
    
    .nav-btn {
        padding: 8px 16px;
        background-color: #333;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .nav-btn:hover {
        background-color: #555;
    }
    
    /* 메인 컨텐츠 중앙 정렬 */
    main {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .logo-text {
        font-size: 60px;
        font-weight: 800;
        color: #333;
        letter-spacing: -1px;
    }
    
    /* 로그인/회원가입 컨테이너 */
    .login-container {
        width: 320px;
        margin: 80px auto;
        padding: 40px;
        border: 1px solid #e1e1e1;
        text-align: center;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .login-container h2 {
        margin-bottom: 30px;
        color: #333;
    }
    
    /* 입력 필드 공통 */
    .login-container input, 
    .login-container select {
        width: 100%;
        padding: 12px;
        margin-bottom: 12px;
        box-sizing: border-box;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
    }
    
    /* 버튼 스타일 */
    .login-btn {
        width: 100%;
        padding: 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
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
        margin-left: 5px;
    }
    
    /* 에러 메시지 (빨간색) */
    .error-text {
        color: #e74c3c;
        font-size: 12px;
        text-align: left;
        margin: -5px 0 15px 0;
        line-height: 1.4;
        display: none;
    }
    ```
    
- 자바스크립트 로직 - script.js
    
    ```jsx
    // 서버 주소 (Node.js 서버)
    const SERVER_URL = "http://localhost:3000";
    
    /* ============================
       1. 메인 화면 로직
       ============================ */
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn'); // 로그인 여부만 브라우저에 남김
        const userName = localStorage.getItem('currentUser');
    
        if (!isLoggedIn && window.location.pathname.includes('index.html')) {
            alert("로그인이 필요한 서비스입니다.");
            window.location.href = 'login.html';
        } else if (isLoggedIn && document.getElementById('welcomeMsg')) {
            document.getElementById('welcomeMsg').innerText = userName + "님 안녕하세요!";
        }
    }
    
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
       2. 회원가입 로직
       ============================ */
    const signupForm = document.getElementById('signupForm');
    const signupPwInput = document.getElementById('signupPw');
    const pwErrorMsg = document.getElementById('pwErrorMsg');
    
    // 비밀번호 검증 (기존과 동일)
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
       3. 로그인 로직
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
    

## 백엔드

---

- 데이터베이스 만들기 - MySQL
    
    ```sql
    /* 1. wetee라는 이름의 데이터베이스(창고) 생성 */
    CREATE DATABASE wetee;
    
    /* 2. wetee 데이터베이스 사용 선언 */
    USE wetee;
    
    /* 3. users 테이블(표) 생성 */
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,   -- 고유 번호 (자동 증가)
        email VARCHAR(100) NOT NULL UNIQUE,  -- 아이디(이메일) 중복 불가
        password VARCHAR(255) NOT NULL,      -- 비밀번호
        name VARCHAR(50) NOT NULL,           -- 이름
        age INT,                             -- 나이
        gender VARCHAR(10)                   -- 성별
    );
    ```
    
- 서버 로직 - server.js
    
    ```jsx
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
    });
    ```
    

## 실행 방법

---

- 서버 실행
    
    ```bash
    node server.js
    ```
    

- 웹 사이트 실행
    
    ```markdown
    ## login.html 이란 파일을 열면 됩니다.
    ```