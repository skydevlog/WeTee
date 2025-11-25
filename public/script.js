// 서버 주소 (Node.js 서버)
// Render에 동시 배포 시, 같은 도메인을 사용하므로 빈 문자열(상대 경로)로 설정합니다.
const SERVER_URL = "";

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