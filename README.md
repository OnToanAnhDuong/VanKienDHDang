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
        input[type="text"], input[type="file"], input[type="number"] {
            width: 100%;
            margin-bottom: 15px;
            padding: 8px;
            box-sizing: border-box;
        }
        .button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            display: block;
            margin: 10px auto;
        }
        .button-primary {
            background-color: #007bff;
            color: white;
        }
        .button-primary:hover {
            background-color: #0056b3;
        }
        .button-success {
            background-color: #5cb85c;
            color: white;
        }
        .button-success:hover {
            background-color: #4cae4c;
        }
        .button-delete {
            background-color: #dc3545;
            color: white;
        }
        .button-delete:hover {
            background-color: #c82333;
        }
        .container {
            margin-top: 20px;
            white-space: pre-wrap;
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #ddd;
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
        #cameraAndImageContainer {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-top: 20px;
        }
        #videoContainer, #imageContainer {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 45%;
        }
    </style>
    <!-- Thêm MathJax -->
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']]
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
    <h1>ÔN LYỆN TOÁN LỚP 6 - THẦY GIÁO TÔN THANH CHƯƠNG</h1>
    <div id="loginContainer">
        <input type="text" id="studentId" placeholder="Nhập mã học sinh">
        <button class="button button-primary" id="loginBtn">Đăng nhập</button>
    </div>
    <div id="mainContent" style="display: none;">
        <div id="topControls">
            <input type="number" id="problemIndexInput" placeholder="Nhập số thứ tự (1, 2, ...)">
            <button class="button button-primary" id="selectProblemBtn">Hiển thị bài tập</button>
            <button class="button button-primary" id="randomProblemBtn">Lấy bài tập ngẫu nhiên</button>
        </div>
        <div class="container" id="problemContainer">
            <label for="problemText">Đề bài:</label>
            <div id="problemText"></div>
        </div>
        <div id="bottomControls">
            <button class="button button-success" id="submitBtn">Chấm Bài</button>
            <button class="button button-success" id="hintBtn">Gợi ý</button>
            <button class="button button-delete" id="deleteAllBtn">Xóa tất cả</button>
        </div>
        <div id="cameraAndImageContainer">
            <div id="videoContainer">
                <video id="cameraStream" autoplay playsinline></video>
                <button class="button button-primary" id="captureButton">Chụp ảnh</button>
            </div>
            <div id="imageContainer">
                <canvas id="photoCanvas" style="display: none;"></canvas>
                <img id="capturedImage" alt="Ảnh đã chụp" style="max-width: 100%; display: none;">
            </div>
        </div>
    </div>
    <script>
        const API_KEYS = [/* API keys */];
        let currentKeyIndex = 0;

        async function fetchGoogleSheetData(sheetId, sheetName) {
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tqx=out:json`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const text = await response.text();
                return JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/)[1]);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu Google Sheet:', error);
                return null;
            }
        }

        function renderMath(elementId) {
            const element = document.getElementById(elementId);
            MathJax.typesetPromise([element])
                .catch(err => console.error('MathJax rendering error:', err));
        }

        function displayMessage(elementId, message) {
            document.getElementById(elementId).textContent = message;
        }

        function disableActions() {
            const keysToDisable = ['F12', 'u', 'p', 's', 'a', 'c'];
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('keydown', e => {
                if (keysToDisable.includes(e.key.toLowerCase()) || (e.ctrlKey && keysToDisable.includes(e.key.toLowerCase()))) {
                    e.preventDefault();
                }
            });
        }
        disableActions();

        document.getElementById('loginBtn').addEventListener('click', () => {
            const studentId = document.getElementById('studentId').value.trim();
            if (studentId) {
                document.getElementById('loginContainer').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
            } else {
                alert('Vui lòng nhập mã học sinh');
            }
        });
    </script>
</body>
</html>
