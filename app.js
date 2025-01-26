/* script.js */

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
    'AIzaSyAJ9DpLy4LfbFoyh7IhW9N0uk9YkBEUY4'
];

let currentKeyIndex = 0;
let problems = [];
let currentProblem = null;
let completedProblems = 0;
let totalScore = 0;
let base64Image = '';
let currentStudentId = null;

function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

async function fetchProblems() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\((.*)\)/)[1]);
        problems = jsonData.table.rows.map(row => ({
            index: row.c[0]?.v || '',
            problem: row.c[1]?.v || ''
        })).filter(item => item.index && item.problem);
        console.log('Bài tập đã tải:', problems);
    } catch (error) {
        console.error('Lỗi khi tải bài tập:', error);
    }
}

function displayProblemByIndex(index) {
    const problem = problems.find(p => parseInt(p.index) === parseInt(index));
    if (problem) {
        document.getElementById('problemText').textContent = problem.problem;
    } else {
        alert(`Không tìm thấy bài tập số ${index}`);
    }
}

async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
    const promptText = `
    Học sinh: ${studentId}
    Đề bài:
    ${problemText}
    Hãy thực hiện các bước sau:
    1. Nhận diện và gõ lại bài làm của học sinh từ hình ảnh thành văn bản một cách chính xác, tất cả công thức Toán viết dưới dạng Latex, bọc trong dấu $, không tự suy luận nội dung hình ảnh, chỉ gõ lại chính xác các nội dung nhận diện được từ hình ảnh.
    2. Giải bài toán và cung cấp lời giải chi tiết cho từng phần.
    3. So sánh bài làm của học sinh với đáp án đúng, chấm chi tiết từng bước làm đến kết quả.
    4. Chấm điểm bài làm của học sinh trên thang điểm 10, cho 0 điểm với bài giải không đúng yêu cầu đề bài. Giải thích chi tiết cách tính điểm cho từng phần.
    5. Đưa ra nhận xét chi tiết và đề xuất cải thiện.
    6. Kiểm tra lại kết quả chấm điểm và đảm bảo tính nhất quán giữa bài làm, lời giải, và điểm số.
    Kết quả trả về cần có định dạng sau:
    Bài làm của học sinh: [Bài làm được nhận diện từ hình ảnh]
    Lời giải chi tiết: [Lời giải từng bước]
    Chấm điểm: [Giải thích cách chấm điểm cho từng phần]
    Điểm số: [Điểm trên thang điểm 10]
    Nhận xét: [Nhận xét chi tiết]
    Đề xuất cải thiện: [Các đề xuất cụ thể]
    Chú ý:
    - Điểm số phải là một số từ 0 đến 10, có thể có một chữ số thập phân.
    - Hãy đảm bảo tính chính xác và khách quan trong việc chấm điểm và nhận xét.
    `;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
                ]
            }
        ]
    };

    try {
        const apiKey = getNextApiKey();
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Lỗi khi chấm bài:', error);
        throw error;
    }
}

document.getElementById('loginBtn').addEventListener('click', async () => {
    const studentId = document.getElementById('studentId').value.trim();
    if (studentId) {
        currentStudentId = studentId;
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        await fetchProblems();
    } else {
        alert('Vui lòng nhập mã học sinh');
    }
});

document.getElementById('selectProblemBtn').addEventListener('click', () => {
    const problemIndex = document.getElementById('problemIndexInput').value;
    if (problemIndex) {
        displayProblemByIndex(problemIndex);
    } else {
        alert('Vui lòng nhập số thứ tự bài tập');
    }
});

document.getElementById('randomProblemBtn').addEventListener('click', () => {
    if (problems.length > 0) {
        const randomIndex = Math.floor(Math.random() * problems.length);
        currentProblem = problems[randomIndex];
        document.getElementById('problemText').textContent = currentProblem.problem;
    } else {
        alert('Không có bài tập nào để hiển thị');
    }
});

document.getElementById('submitBtn').addEventListener('click', async () => {
    const problemText = document.getElementById('problemText').textContent.trim();
    const studentImageInput = document.getElementById('studentImage');
    const studentImage = studentImageInput.files[0];

    if (!problemText) {
        alert('Vui lòng chọn bài tập trước khi chấm bài.');
        return;
    }

    if (!studentImage && !base64Image) {
        alert('Vui lòng tải lên hoặc chụp ảnh bài làm.');
        return;
    }

    const imageToProcess = base64Image || (await getBase64(studentImage));

    try {
        document.getElementById('result').textContent = 'Đang xử lý bài làm...';

        // Gọi API chấm bài với dữ liệu ảnh và đề bài
        const result = await gradeWithGemini(imageToProcess, problemText, currentStudentId);

        // Hiển thị kết quả chấm bài
        const { studentAnswer, feedback, score } = result;
        document.getElementById('result').innerHTML = `
            <h3>Kết quả chấm bài:</h3>
            <p><strong>Bài làm của học sinh:</strong> ${studentAnswer || 'Không nhận diện được'}</p>
            <p><strong>Nhận xét:</strong> ${feedback || 'Không có nhận xét'}</p>
            <p><strong>Điểm số:</strong> ${score || 'Không chấm được'}/10</p>
        `;
    } catch (error) {
        console.error('Lỗi khi chấm bài:', error);
        alert('Đã xảy ra lỗi khi chấm bài. Vui lòng thử lại sau.');
    }
});
