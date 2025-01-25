<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ÔN LUYỆN TOÁN THCS</title>
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
        #cameraStream {
            width: 100%;
            height: auto;
            aspect-ratio: 2 / 3;
            max-height: 800px;
            object-fit: cover;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        #captureButton {
            margin-top: 10px;
            padding: 10px 20px;
            background-color: #007bff;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
        }
        #captureButton:hover {
            background-color: #0056b3;
        }
        #capturedImage {
            max-width: 100%;
            margin-top: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            display: block;
        }
        .problem-list {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .problem-item {
            cursor: pointer;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .problem-item:last-child {
            border-bottom: none;
        }
        .problem-item:hover {
            background-color: #e6e6e6;
        }
    </style>
</head>
<body>
    <h1>ÔN LUYỆN TOÁN THCS</h1>

    <div id="loginContainer">
        <label for="studentId">Nhập mã học sinh:</label>
        <input type="text" id="studentId" placeholder="Nhập mã học sinh">
        <button id="loginBtn">Đăng nhập</button>
    </div>

    <div id="mainContent" style="display: none;">
        <div id="problemList" class="problem-list">
            <h2>Danh sách bài tập</h2>
            <!-- Các bài tập sẽ được hiển thị tại đây -->
        </div>
        <div id="problemContainer">
            <h2>Đề bài:</h2>
            <div id="problemText">Nội dung bài tập sẽ hiển thị tại đây...</div>
        </div>

        <div>
            <video id="cameraStream" autoplay playsinline></video>
            <button id="captureButton">Chụp ảnh</button>
            <img id="capturedImage" alt="Ảnh bài làm của học sinh" style="display: none;">
        </div>

        <div>
            <button id="submitBtn">Chấm bài</button>
            <div id="result">Kết quả bài làm sẽ hiển thị tại đây...</div>
        </div>
    </div>

    <script>
        const API_KEYS = [
            'AIzaSyCzh6doVzV7Dbmbz60B9pNUQIel2N6KEcI',
            'AIzaSyBVQcUrVTtwKeAAsFR8ENM8-kgZl8CsUM0',
            'AIzaSyCmY4FdhZ4qSN6HhBtldgQgSNbDlZ4J1ug'
        ];
        const SHEET_URL = `https://docs.google.com/spreadsheets/d/175acnaYklfdCc_UJ7B3LJgNaUJpfrIENxn6LN76QADM/gviz/tq?sheet=Toan6&tqx=out:json`;

        async function fetchProblems() {
            try {
                const response = await fetch(SHEET_URL);
                if (!response.ok) throw new Error('Failed to fetch problems.');
                const text = await response.text();
                const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\((.*)\)/)[1]);
                const problems = jsonData.table.rows.map(row => ({
                    index: row.c[0]?.v?.toString() || '',
                    problem: row.c[1]?.v || '',
                })).filter(item => item.index && item.problem);
                return problems;
            } catch (error) {
                console.error('Error fetching problems:', error);
                return [];
            }
        }

        function renderProblemList(problems) {
            const problemListDiv = document.getElementById('problemList');
            problemListDiv.innerHTML = '<h2>Danh sách bài tập</h2>';

            problems.forEach(problem => {
                const problemItem = document.createElement('div');
                problemItem.classList.add('problem-item');
                problemItem.textContent = `Bài ${problem.index}`;
                problemItem.addEventListener('click', () => displayProblem(problem));
                problemListDiv.appendChild(problemItem);
            });
        }

        function displayProblem(problem) {
            const problemTextDiv = document.getElementById('problemText');
            problemTextDiv.textContent = problem.problem;
        }

        async function renderProblems() {
            const problems = await fetchProblems();
            if (problems.length === 0) {
                alert('Không có bài tập nào để hiển thị.');
                return;
            }
            renderProblemList(problems);
        }

        function switchToMainContent() {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        }

        document.getElementById('loginBtn').addEventListener('click', () => {
            const studentId = document.getElementById('studentId').value.trim();
            if (!studentId) {
                alert('Vui lòng nhập mã học sinh.');
                return;
            }
            alert('Đăng nhập thành công!');
            switchToMainContent();
            renderProblems();
        });

        document.getElementById('captureButton').addEventListener('click', () => {
            const video = document.getElementById('cameraStream');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const img = document.getElementById('capturedImage');
            img.src = canvas.toDataURL('image/jpeg');
            img.style.display = 'block';
        });

        document.getElementById('submitBtn').addEventListener('click', () => {
            alert('Chức năng chấm bài đang được phát triển!');
        });

        async function startCamera() {
            const video = document.getElementById('cameraStream');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
            } catch (err) {
                alert('Không thể truy cập camera!');
            }
        }

        startCamera();
    </script>
</body>
</html>
