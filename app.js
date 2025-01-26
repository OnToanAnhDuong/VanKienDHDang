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
    'AIzaSyAJ9DpLy4uLfbFoyh7IhW9N0uk9YkBEUY4'
];

let problems = [];
let currentKeyIndex = 0;
let currentStudentId = null;

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

// Hiển thị danh sách bài tập
function renderExerciseList() {
    const exerciseGrid = document.getElementById('exerciseGrid');
    exerciseGrid.innerHTML = ''; // Xóa nội dung cũ

    if (problems.length === 0) {
        exerciseGrid.textContent = 'Không có bài tập nào để hiển thị.';
        return;
    }

    problems.forEach((problem, index) => {
        const exerciseBox = document.createElement('div');
        exerciseBox.textContent = `Bài ${problem.index}`;
        exerciseBox.style.border = '1px solid #ddd';
        exerciseBox.style.borderRadius = '5px';
        exerciseBox.style.padding = '10px';
        exerciseBox.style.textAlign = 'center';
        exerciseBox.style.cursor = 'pointer';
        exerciseBox.style.backgroundColor = '#f0ad4e'; // Màu cam: chưa làm
        exerciseBox.style.color = '#000';

        // Thêm sự kiện click để hiển thị bài tập
        exerciseBox.addEventListener('click', () => {
            displayProblem(index);
            exerciseBox.style.backgroundColor = '#5cb85c'; // Màu xanh: đã làm
            exerciseBox.style.color = '#fff';
        });

        exerciseGrid.appendChild(exerciseBox);
    });
}

// Hiển thị bài tập theo chỉ số
function displayProblem(index) {
    if (problems[index]) {
        const problemText = problems[index].problem;
        document.getElementById('problemText').innerHTML = problemText.replace(/\n/g, '<br>');
    } else {
        document.getElementById('problemText').textContent = 'Không tìm thấy bài tập.';
    }
}

// Xử lý sự kiện đăng nhập
document.getElementById('loginBtn').addEventListener('click', async () => {
    const studentIdInput = document.getElementById('studentId').value.trim();
    if (!studentIdInput) {
        alert('Vui lòng nhập mã học sinh.');
        return;
    }

    currentStudentId = studentIdInput;

    // Ẩn phần đăng nhập, hiển thị phần bài tập
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // Tải danh sách bài tập từ Google Sheets
    await fetchProblems();
    renderExerciseList();
});

// Gọi hàm khi tải xong danh sách bài tập
fetchProblems().then(() => {
    renderExerciseList();
});
