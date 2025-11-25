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