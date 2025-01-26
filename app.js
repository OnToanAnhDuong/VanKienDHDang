const SHEET_ID = '175acnaYklfdCc_UJ7B3LJgNaUJpfrIENxn6LN76QADM';
const SHEET_NAME = 'Toan6';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tq=&tqx=out:json`;

const API_KEYS = [
    'AIzaSyCzh6doVzV7Dbmbz60B9pNUQIel2N6KEcI',
    'AIzaSyBVQcUrVTtwKeAAsFR8ENM8-kgZl8CsUM0',
    'AIzaSyCmY4FdhZ4qSN6HhBtldgQgSNbDlZ4J1ug',
    'AIzaSyAkX3rMYxN_-aO95QKMPy-OLIV62esaANU',
    'AIzaSyDtmacgYKn1PBgCVWkReF9Kyn6vC4DKZmg',
    'AIzaSyAusgvzZkUPT9lHoB7vzZW_frx-Z0xIxU8',
    'AIzaSyBBNxoJh9UZXbc4shgRc7nUiJKya3JR2eI',
    'AIzaSyAru8K7uUTD85FOCmrNESQmQYh-gfFCOZ8',
    'AIzaSyAkDbRl7iBYWhc00KZ9dZL1_l0cobcC0ak',
    'AIzaSyAJ9DpLy4UlfbFoyh7IhW9N0uk9YkBEUY4'
];

let problems = [];
let currentKeyIndex = 0;
let currentStudentId = null;
let base64Image = '';

// Chọn API Key tiếp theo
function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

// Tải bài tập từ Google Sheets
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

        console.log('Danh sách bài tập:', problems); // Kiểm tra danh sách bài tập
    } catch (error) {
        console.error('Error fetching problems:', error);
    }
}

// Hiển thị danh sách bài tập
function renderExerciseList() {
    const exerciseGrid = document.getElementById('exerciseGrid');
    exerciseGrid.innerHTML = ''; // Xóa nội dung cũ

    problems.forEach((problem) => {
        const exerciseBox = document.createElement('div');
        exerciseBox.className = 'exercise-box';
        exerciseBox.textContent = problem.index;

        // Thêm sự kiện khi nhấn vào ô bài tập
        exerciseBox.addEventListener('click', () => {
            displayProblem(problem);
            exerciseBox.classList.add('completed'); // Đổi màu ô đã làm
        });

        exerciseGrid.appendChild(exerciseBox);
    });
}

// Hiển thị bài tập
function displayProblem(problem) {
    const problemText = document.getElementById('problemText');
    problemText.textContent = problem.problem; // Hiển thị đề bài
}

// Gửi yêu cầu đến API Gemini để chấm bài hoặc gợi ý
async function callGeminiApi(requestBody) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent';
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
            console.error('Error calling Gemini API:', error);
            attempts++;
        }
    }

    throw new Error('All API keys have been exhausted or are invalid.');
}

// Xử lý sự kiện đăng nhập
document.getElementById('loginBtn').addEventListener('click', async () => {
    const studentIdInput = document.getElementById('studentId').value.trim();
    if (!studentIdInput) {
        alert('Vui lòng nhập mã học sinh.');
        return;
    }

    currentStudentId = studentIdInput;

    // Hiển thị danh sách bài tập
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // Tải danh sách bài tập từ Google Sheets
    await fetchProblems();
    renderExerciseList();
});

// Chấm bài và gửi kết quả
async function gradeSubmission() {
    const problemText = document.getElementById('problemText').textContent;
    if (!problemText) {
        alert('Vui lòng chọn bài tập trước khi chấm bài.');
        return;
    }

    if (!base64Image) {
        alert('Vui lòng tải hoặc chụp ảnh bài làm.');
        return;
    }

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: `Đề bài: ${problemText}\nBài làm:` },
                    { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
                ]
            }
        ]
    };

    try {
        const response = await callGeminiApi(requestBody);
        const resultDiv = document.getElementById('result');
        resultDiv.textContent = `Kết quả: ${JSON.stringify(response)}`;
    } catch (error) {
        console.error('Error grading submission:', error);
        alert('Lỗi khi chấm bài. Vui lòng thử lại.');
    }
}

// Sự kiện chấm bài
document.getElementById('submitBtn').addEventListener('click', gradeSubmission);

// Gọi hàm để hiển thị danh sách bài tập khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    renderExerciseList();
});
