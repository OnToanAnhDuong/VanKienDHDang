<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>ÔN LUYỆN TOÁN THCS - TRUNG TÂM ÁNH DƯƠNG</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 30px;
            line-height: 1.6;
        }
        h1, h2 {
            color: #333;
            text-align: center;
        }
        label {
            font-weight: bold;
            display: block;
            margin-top: 10px;
        }
        input[type="text"], input[type="file"] {
            width: 100%;
            margin-bottom: 15px;
            padding: 8px;
            box-sizing: border-box;
        }
        button {
            padding: 10px 20px;
            background-color: #5cb85c;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            margin: 10px auto;
            display: block;
        }
        button:hover {
            background-color: #4cae4c;
        }
        #result, #hintText {
            margin-top: 20px;
            white-space: pre-wrap;
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
        }
        p#breadcrumb {
            display: none;
        }
        #problemText {
            font-size: 18px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
            background-color: #f9f9f9;
            min-height: 100px;
            white-space: pre-wrap;
        }
        #problemContainer, #progressContainer {
            position: relative;
            margin-bottom: 20px;
        }
        #randomProblemBtn, #loginBtn {
            display: block;
            width: 30%;
            margin-bottom: 10px;
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        #randomProblemBtn:hover, #loginBtn:hover {
            background-color: #0056b3;
        }
        #progress {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .message-box {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            max-width: 80%;
            width: 400px;
        }
        .message-box-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            z-index: 999;
        }
    </style>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\(', '\)']]
            },
            svg: {
                fontCache: 'global'
            }
        };
    </script>
    <script id="MathJax-script" async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
    </script>
</head>
<body>
    <h1>ÔN LUYỆN TOÁN LỚP 6  - THẦY GIÁO TÔN THANH CHƯƠNG</h1>
    <div id="exerciseListContainer"></div>
    <div id="loginContainer">
        <input type="text" id="studentId" placeholder="Nhập mã học sinh">
        <button id="loginBtn">Đăng nhập</button>
    </div>
   <div id="mainContent" style="display: none;">
    <div id="topControls">
        <input type="number" id="problemIndexInput" placeholder="Nhập số thứ tự (1, 2, ...)" />
        <button id="selectProblemBtn">Hiển thị bài tập</button>
        <button id="randomProblemBtn">Lấy bài tập ngẫu nhiên</button>
        <div id="progressContainer" style="display: none;">
            <p>
                Số bài: <span id="completedExercises">0</span> |
                Điểm TB: <span id="averageScore">0</span>
            </p>
        </div>
    </div>
    <div id="problemContainer">
        <label for="problemText">Đề bài:</label>
        <div id="problemText"></div>
    </div>
    <div id="bottomControls">
        <button id="submitBtn">Chấm Bài</button>
        <button id="hintBtn">Gợi ý</button>
        <button id="deleteAllBtn">Xóa tất cả</button>
    </div>
    <div id="result"></div>
    <label for="studentImage">Ảnh bài làm của học sinh:</label>
    <input type="file" id="studentImage" accept="image/*">
    </div>

    <script>
        const SHEET_ID = '175acnaYklfdCc_UJ7B3LJgNaUJpfrIENxn6LN76QADM';
        const SHEET_NAME = 'Toan6';
        const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tq=&tqx=out:json`;

        const API_KEYS = [
            'AIzaSyCzh6doVzV7Dbmbz60B9pNUQIel2N6KEcI',
            'AIzaSyBVQcUrVTtwKeAAsFR8ENM8-kgZl8CsUM0',
            'AIzaSyCmY4FdhZ4qSN6HhBtldgQgSNbDlZ4J1ug'
        ];

        let currentStudentId = null;
        let problems = [];
        let currentKeyIndex = 0;

        function getNextApiKey() {
            const key = API_KEYS[currentKeyIndex];
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            return key;
        }

        async function fetchProblems() {
            try {
                const response = await fetch(SHEET_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\((.*)\)/)[1]);
                problems = jsonData.table.rows.map(row => ({
                    index: row.c[0]?.v || '',
                    problem: row.c[1]?.v || ''
                })).filter(item => item.index && item.problem);
            } catch (error) {
                console.error('Error fetching problems:', error);
            }
        }

        async function makeApiRequest(apiUrl, requestBody) {
            let attempts = 0;
            while (attempts < API_KEYS.length) {
                const apiKey = getNextApiKey();
                try {
                    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });
                    if (response.ok) {
                        return await response.json();
                    } else if (response.status === 403) {
                        console.log(`API key expired or invalid: ${apiKey}`);
                        attempts++;
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Error making API request:', error);
                    attempts++;
                }
            }
            throw new Error('All API keys have been exhausted or are invalid.');
        }

        function displayProblem(index) {
            if (problems[index]) {
                const problemText = problems[index].problem;
                document.getElementById('problemText').innerHTML = problemText.replace(/\n/g, '<br>');
                MathJax.typesetPromise();
            } else {
                document.getElementById('problemText').textContent = 'Không tìm thấy bài tập.';
            }
        }

        async function handleLogin() {
            const studentId = document.getElementById('studentId').value.trim();
            if (!studentId) {
                alert('Vui lòng nhập mã học sinh.');
                return;
            }
            currentStudentId = studentId;
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            await fetchProblems();
            displayProblem(0);
        }

        function handleSelectProblem() {
            const problemIndex = parseInt(document.getElementById('problemIndexInput').value, 10);
            if (!isNaN(problemIndex) && problemIndex >= 0 && problemIndex < problems.length) {
                displayProblem(problemIndex);
            } else {
                alert('Số thứ tự không hợp lệ.');
            }
        }

        async function handleHint() {
            const currentProblemText = document.getElementById('problemText').innerText;
            if (!currentProblemText) {
                alert('Không có bài tập để gợi ý.');
                return;
            }
            alert('Gợi ý: Vui lòng đọc kỹ đề bài và áp dụng công thức phù hợp.');
        }

        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        document.getElementById('randomProblemBtn').addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * problems.length);
            displayProblem(randomIndex);
        });
        document.getElementById('selectProblemBtn').addEventListener('click', handleSelectProblem);
        document.getElementById('hintBtn').addEventListener('click', handleHint);
    </script>
</body>
</html>
