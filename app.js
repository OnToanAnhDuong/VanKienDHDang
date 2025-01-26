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
let cameraStream = null;

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
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
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

// Hàm chấm bài với nội dung tiếng Việt
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
    const promptText = `
    Học sinh: ${studentId}
    Đề bài:
    ${problemText}
     Hãy thực hiện các bước sau:
    1. Nhận diện và gõ lại bài làm của học sinh từ hình ảnh thành văn bản một cách chính xác, tất cả công thức Toán viết dưới dạng Latex, bọc trong dấu $, không tự suy luận nội dung hình ảnh, chỉ gõ lại chính xác các nội dung nhận diện được từ hình ảnh.
    2. Giải bài toán và cung cấp lời giải chi tiết cho từng phần, lời giải phù hợp học sinh lớp 7 học theo chương trình 2018.
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
    - Bài làm của học sinh không khớp với đề bài thì cho 0 điểm.
    - Điểm số phải là một số từ 0 đến 10, có thể có một chữ số thập phân.
    - Hãy đảm bảo tính chính xác và khách quan trong việc chấm điểm và nhận xét.
    - Nếu có sự không nhất quán giữa bài làm và điểm số, hãy giải thích rõ lý do.
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
        const data = await callGeminiApi(requestBody);
        const response = data?.contents?.[0]?.parts?.[0]?.text;
        if (!response) {
            throw new Error('Không nhận được phản hồi hợp lệ từ API');
        }
        const studentAnswer = response.match(/Bài làm của học sinh: ([\s\S]*?)(?=\nLời giải chi tiết:)/)?.[1]?.trim() || '';
        const feedback = response.match(/Lời giải chi tiết:[\s\S]*?Chấm điểm:/)?.[0]?.trim() || 'Không có lời giải chi tiết';
        const score = parseFloat(response.match(/Điểm số: (\d+(\.\d+)?)/)?.[1] || '0');
        const suggestions = response.match(/Đề xuất cải thiện:[\s\S]*/)?.[0]?.trim() || 'Không có đề xuất cải thiện';
        return { studentAnswer, feedback, score, suggestions };
    } catch (error) {
        console.error('Lỗi:', error);
        return { studentAnswer: '', feedback: `Đã xảy ra lỗi: ${error.message}`, score: 0, suggestions: '' };
    }
}

// Xử lý nút chấm bài
document.getElementById('submitBtn').addEventListener('click', async () => {
    const problemText = document.getElementById('problemText').textContent.trim();
    const studentFileInput = document.getElementById('studentImage');

    if (!problemText) {
        alert('Vui lòng chọn bài tập trước khi chấm bài.');
        return;
    }

    if (!base64Image && (!studentFileInput || !studentFileInput.files.length)) {
        alert('Vui lòng tải hoặc chụp ảnh bài làm.');
        return;
    }

    if (!base64Image && studentFileInput && studentFileInput.files.length > 0) {
        const file = studentFileInput.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
            base64Image = reader.result.split(',')[1];
            const { studentAnswer, feedback, score, suggestions } = await gradeWithGemini(base64Image, problemText, currentStudentId);
            displayGradingResult(studentAnswer, feedback, score, suggestions);
        };
        reader.readAsDataURL(file);
    } else {
        const { studentAnswer, feedback, score, suggestions } = await gradeWithGemini(base64Image, problemText, currentStudentId);
        displayGradingResult(studentAnswer, feedback, score, suggestions);
    }
});

// Hiển thị kết quả chấm bài
function displayGradingResult(studentAnswer, feedback, score, suggestions) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div><strong>Bài làm của học sinh:</strong> ${studentAnswer}</div>
        <div><strong>Lời giải chi tiết:</strong><pre>${feedback}</pre></div>
        <div><strong>Điểm số:</strong> ${score}/10</div>
        <div><strong>Đề xuất cải thiện:</strong><pre>${suggestions}</pre></div>
    `;
}
