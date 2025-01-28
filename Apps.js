/* script.js */
        const SHEET_ID = '175acnaYklfdCc_UJ7B3LJgNaUJpfrIENxn6LN76QADM';
        const SHEET_NAME = 'Toan6';
        const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tq=&tqx=out:json`;
        const API_KEYS = ['AIzaSyCzh6doVzV7Dbmbz60B9pNUQIel2N6KEcI', 'AIzaSyBVQcUrVTtwKeAAsFR8ENM8-kgZl8CsUM0', 'AIzaSyCmY4FdhZ4qSN6HhBtldgQgSNbDlZ4J1ug', 'AIzaSyAkX3rMYxN_-aO95QKMPy-OLIV62esaANU', 'AIzaSyDtmacgYKn1PBgCVWkReF9Kyn6vC4DKZmg', 'AIzaSyAusgvzZkUPT9lHoB7vzZW_frx-Z0xIxU8', 'AIzaSyBBNxoJh9UZXbc4shgRc7nUiJKya3JR2eI', 'AIzaSyAru8K7uUTD85FOCmrNESQmQYh-gfFCOZ8', 'AIzaSyAkDbRl7iBYWhc00KZ9dZL1_l0cobcC0ak', 'AIzaSyAJ9DpLy4uLfbFoyh7IhW9N0uk9YkBEUY4'];        
        let currentKeyIndex = 0;
        let problems = [];
        let currentProblem = null;
	let completedProblems = 0;  // Khai báo số bài đã giải
        let totalScore = 0;  // Khai báo tổng điểm
        let currentProblemScore = 0; // Điểm của bài hiện tại
	let base64Image = ''; // Đặt ở đầu script để có phạm vi toàn cục
        let currentStudentId = null;
        let currentHint = '';
        let studentName = '';
	let currentProblemIndex = 0; // Bắt đầu từ bài đầu tiên
        function getNextApiKey() {
            const key = API_KEYS[currentKeyIndex];
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            return key;
        }

// Hàm API tổng quát
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

// Hàm lấy bài toán từ Google Sheet
async function fetchProblems() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/)[1]);
        problems = parseGoogleSheetData(jsonData);
        console.log('Đã tải xong bài tập:', problems);
    } catch (error) {
        console.error('Lỗi khi tải bài toán:', error);
        document.getElementById('problemText').textContent = 'Không thể tải bài toán. Vui lòng thử lại.';
    }
}

// Hàm phân tích dữ liệu từ Google Sheet
function parseGoogleSheetData(jsonData) {
    const data = jsonData.table.rows;
    return data.map(row => ({
        index: row.c[0]?.v || '',
        problem: row.c[1]?.v.replace(/\r\n|\r|\n/g, '\n') || ''
    })).filter(item => item.problem && item.index);
}

// Hiển thị bài toán tiếp theo
function displayNextProblem() {
    if (problems.length > 0) {
        if (currentProblemIndex >= problems.length) {
            currentProblemIndex = 0;
        }

        currentProblem = problems[currentProblemIndex];
        currentProblemIndex++;
        document.getElementById('problemText').innerHTML = formatProblemText(currentProblem.problem);
        MathJax.typesetPromise([document.getElementById('problemText')]).catch(err => {
            console.error('MathJax rendering error:', err);
        });
    } else {
        document.getElementById('problemText').textContent = 'Không có bài toán nào.';
    }
}

// Hàm định dạng văn bản bài toán
function formatProblemText(problemText) {
    return problemText.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
}

// Kiểm tra thiết bị camera
function checkCameraAccess() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length === 0) {
                alert('Không tìm thấy thiết bị camera.');
            }
        })
        .catch(error => console.error('Lỗi khi kiểm tra thiết bị camera:', error));
}

// Hàm tạo nội dung qua Gemini API
async function generateWithGemini(apiUrl, promptText) {
    const requestBody = {
        contents: [{ parts: [{ text: promptText }] }]
    };
    try {
        const data = await makeApiRequest(apiUrl, requestBody);
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Error generating content:', error);
        return `Lỗi: ${error.message}`;
    }
}

// Hàm tạo gợi ý bài toán
async function generateHint(problemText) {
    const promptText = `
        Đề bài:
        ${problemText}
        Hãy đưa ra một gợi ý ngắn gọn để giúp học sinh giải bài toán này.
    `;
    return await generateWithGemini(GEMINI_API_URL_HINT, promptText);
}

// Hàm tạo bài toán tương tự
async function generateSimilarProblem(originalProblem) {
    const promptText = `
        Bạn hãy tạo một bài toán tương tự bài sau:
        ${originalProblem}
    `;
    return await generateWithGemini(GEMINI_API_URL_PROBLEM, promptText);
}

// Hàm cập nhật tiến độ học tập
async function updateProgress(score, updateToSheet = true) {
    if (!currentStudentId) {
        console.error('No currentStudentId provided.');
        return;
    }

    let completedProblems = 0, totalScore = 0, averageScore = 0;
    try {
        if (updateToSheet) {
            const progressUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=StudentProgress&tqx=out:json`;
            const response = await fetch(progressUrl);
            const text = await response.text();
            const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/)[1]);
            const rows = jsonData.table.rows;
            const studentRow = rows.find(row => row.c[0]?.v.trim().toLowerCase() === currentStudentId.trim().toLowerCase());

            if (studentRow) {
                completedProblems = parseInt(studentRow.c[1]?.v || '0') + 1;
                totalScore = parseFloat(studentRow.c[2]?.v || '0') + score;
                averageScore = totalScore / completedProblems;
            }
        } else {
            completedProblems++;
            totalScore += score;
            averageScore = totalScore / completedProblems;
        }

        document.getElementById("completedProblems").textContent = completedProblems;
        document.getElementById("averageScore").textContent = averageScore.toFixed(2);

        if (updateToSheet) {
            await updateGoogleSheetData(currentStudentId, completedProblems, totalScore);
        }
    } catch (error) {
        console.error('Error updating progress:', error.message);
    }
}
// Hàm hiển thị bài toán theo chỉ số
function displayProblemByIndex(index) {
    if (problems.length === 0) {
        document.getElementById('problemText').textContent = 'Danh sách bài tập chưa được tải. Vui lòng thử lại.';
        return;
    }
    const selectedProblem = problems.find(problem => parseInt(problem.index) === parseInt(index));
    if (selectedProblem) {
        document.getElementById('problemText').innerHTML = formatProblemText(selectedProblem.problem);
        MathJax.typesetPromise([document.getElementById('problemText')]).catch(err => {
            console.error('MathJax rendering error:', err);
        });
    } else {
        document.getElementById('problemText').textContent = `Không tìm thấy bài tập với số thứ tự ${index}.`;
    }
}

// Hàm chấm bài bằng Gemini API
async function gradeWithGemini(base64Image, problemText, studentId) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
    const promptText = `
        Học sinh: ${studentId}
        Đề bài:
        ${problemText}
        Hãy thực hiện các bước sau:
        1. Nhận diện và gõ lại bài làm của học sinh từ hình ảnh.
        2. Chấm điểm và đưa ra nhận xét chi tiết.
        3. Đưa ra điểm số và lời nhận xét cuối cùng.
    `;
    const requestBody = {
        contents: [
            { parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ] }
        ]
    };
    try {
        const data = await makeApiRequest(apiUrl, requestBody);
        const response = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!response) {
            throw new Error('Không nhận được phản hồi hợp lệ từ API');
        }
        const studentAnswer = response.match(/Bài làm của học sinh: ([\s\S]*?)(?=\nLời giải chi tiết:)/)?.[1]?.trim() || '';
        const feedback = response.replace(/Bài làm của học sinh: [\s\S]*?\n/, '');
        const score = parseFloat(response.match(/Điểm số: (\d+(\.\d+)?)/)?.[1] || '0');
        return { studentAnswer, feedback, score };
    } catch (error) {
        console.error('Lỗi:', error);
        return { studentAnswer: '', feedback: `Đã xảy ra lỗi: ${error.message}`, score: 0 };
    }
}

// Hàm gửi kết quả lên Google Form
async function submitToGoogleForm(score, studentId, problemText, studentAnswer, feedback, studentName) {
    const formId = '1FAIpQLSd4HefrKz-FAyo4YCttFzI9j9wEYQ7IVL38uZe8EwMtTj6KCw';
    const entryName = 'entry.854745128';
    const entryProblem = 'entry.1086866640';
    const entryAnswer = 'entry.939840295';
    const entryFeedback = 'entry.34713471';
    const entryScore = 'entry.413593378';
    const entryTen = 'entry.1135916403';
    const formData = new URLSearchParams();
    formData.append(entryName, `${studentId}`);
    formData.append(entryProblem, problemText || 'Không có đề bài');
    formData.append(entryAnswer, studentAnswer || 'Không có bài làm');
    formData.append(entryFeedback, feedback || 'Không có phản hồi');
    formData.append(entryScore, score || '0');
    formData.append(entryTen, `${studentName}`);
    try {
        const response = await fetch(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });
        console.log('Dữ liệu đã được gửi đến Google Form');
        return true;
    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu đến Google Form:', error);
        return false;
    }
}
// Hàm xử lý sự kiện đăng nhập
async function checkStudentId(studentId) {
    const progressUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=StudentProgress&tqx=out:json`;
    try {
        const response = await fetch(progressUrl);
        const text = await response.text();
        const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/)[1]);
        const rows = jsonData.table.rows;                
        const studentRow = rows.find(row => row.c[0]?.v?.toString() === studentId);
        if (studentRow) {
            studentName = studentRow.c[3]?.v || '';
            return true;
        }
        return false;
    } catch (error) {
        console.error('Lỗi khi kiểm tra mã học sinh:', error);
        return false;
    }
}

// Hàm xử lý nút chấm điểm
async function gradeProblem(base64Image, problemText, studentId) {
    try {
        const { studentAnswer, feedback, score } = await gradeWithGemini(base64Image, problemText, studentId);
        document.getElementById('result').innerHTML = feedback;
        MathJax.typesetPromise([document.getElementById('result')]).catch(err => console.error('MathJax rendering error:', err));
        await updateProgress(score);
    } catch (error) {
        console.error('Error grading problem:', error);
        document.getElementById('result').innerText = `Đã xảy ra lỗi: ${error.message}`;
    }
}

// Hàm xử lý nút tạo gợi ý
async function handleHintButtonClick() {
    if (currentProblem) {
        const hint = await generateHint(currentProblem.problem);
        alert(hint);
    } else {
        alert('Chưa có bài toán nào để tạo gợi ý.');
    }
}

// Hàm xử lý nút chụp ảnh
function captureImage(video, canvas, imgElement) {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    imgElement.src = base64Data;
    base64Image = base64Data.split(',')[1];
}

// Hàm xử lý nút xóa bài giải và hình ảnh
function clearResults() {
    document.getElementById('result').innerHTML = '';
    document.getElementById('capturedImage').src = '';
    base64Image = null;
}
// Hàm gắn các nút vào sự kiện
function attachButtonHandlers() {
    // Nút hiển thị bài toán tiếp theo
    document.getElementById('nextProblemBtn').addEventListener('click', displayNextProblem);

    // Nút hiển thị bài toán theo chỉ số
    document.getElementById('selectProblemBtn').addEventListener('click', () => {
        const problemIndex = document.getElementById('problemIndexInput').value;
        displayProblemByIndex(problemIndex);
    });

    // Nút tạo gợi ý
    document.getElementById('hintBtn').addEventListener('click', handleHintButtonClick);

    // Nút chấm bài
    document.getElementById('submitBtn').addEventListener('click', async () => {
        const problemText = document.getElementById('problemText').innerHTML.trim();
        const studentId = currentStudentId;
        const imgElement = document.getElementById('capturedImage');

        if (!problemText || !base64Image) {
            alert('Vui lòng kiểm tra đề bài hoặc ảnh bài làm của học sinh.');
            return;
        }

        await gradeProblem(base64Image, problemText, studentId);
    });

    // Nút chụp ảnh
    document.getElementById('captureBtn').addEventListener('click', () => {
        const video = document.getElementById('cameraStream');
        const canvas = document.getElementById('photoCanvas');
        const imgElement = document.getElementById('capturedImage');

        if (video) {
            captureImage(video, canvas, imgElement);
        } else {
            alert('Camera chưa được kích hoạt.');
        }
    });

    // Nút xóa bài giải và hình ảnh
    document.getElementById('clearBtn').addEventListener('click', clearResults);

    // Nút đăng nhập
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const studentId = document.getElementById('studentId').value.trim();

        if (studentId) {
            const isValid = await checkStudentId(studentId);
            if (isValid) {
                currentStudentId = studentId;
                document.getElementById('loginContainer').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
                await fetchProblems();
            } else {
                alert('Mã học sinh không hợp lệ.');
            }
        } else {
            alert('Vui lòng nhập mã học sinh.');
        }
    });
}

// Gọi hàm gắn sự kiện sau khi DOM đã tải
window.addEventListener('DOMContentLoaded', attachButtonHandlers);

