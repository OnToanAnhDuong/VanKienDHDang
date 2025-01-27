/* script.js */
        const SHEET_ID = '175acnaYklfdCc_UJ7B3LJgNaUJpfrIENxn6LN76QADM';
        const SHEET_NAME = 'Toan6';
        const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tq=&tqx=out:json`;
        const API_KEYS = ['AIzaSyCzh6doVzV7Dbmbz60B9pNUQIel2N6KEcI', 'AIzaSyBVQcUrVTtwKeAAsFR8ENM8-kgZl8CsUM0', 'AIzaSyCmY4FdhZ4qSN6HhBtldgQgSNbDlZ4J1ug', 'AIzaSyAkX3rMYxN_-aO95QKMPy-OLIV62esaANU', 'AIzaSyDtmacgYKn1PBgCVWkReF9Kyn6vC4DKZmg', 'AIzaSyAusgvzZkUPT9lHoB7vzZW_frx-Z0xIxU8', 'AIzaSyBBNxoJh9UZXbc4shgRc7nUiJKya3JR2eI', 'AIzaSyAru8K7uUTD85FOCmrNESQmQYh-gfFCOZ8', 'AIzaSyAkDbRl7iBYWhc00KZ9dZL1_l0cobcC0ak', 'AIzaSyAJ9DpLy4uLfbFoyh7IhW9N0uk9YkBEUY4'];        
        const GITHUB_REPO = 'OnToanAnhDuong/WEBMOi'; // Thay 'username' bằng tên GitHub của bạn
	const GITHUB_TOKEN = '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';   // Thay bằng token của bạn
	const PROGRESS_FILE = 'progress.json';          // Tên file JSON lưu tiến độ
	let progress = {};                              // Biến lưu tiến trình
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
	function displayProblems() {
    const problemListContainer = document.getElementById('problemListContainer');

    if (!problemListContainer) {
        console.error('Không tìm thấy container #problemListContainer');
        return;
    }

    problemListContainer.innerHTML = ''; // Xóa nội dung cũ

    if (!problems || problems.length === 0) {
        problemListContainer.textContent = 'Không có bài tập nào để hiển thị.';
        return;
    }

    problems.forEach(problem => {
        const item = document.createElement('div');
        item.className = `progress-item ${progress[problem.index] ? 'green' : 'yellow'}`;
        item.textContent = problem.index; // Số thứ tự bài tập

        // Thêm sự kiện khi nhấn vào ô bài tập
        item.addEventListener('click', () => handleProblemClick(problem.index));
        problemListContainer.appendChild(item);
    });

    console.log('Danh sách bài tập đã được hiển thị:', problems);
}

	async function loadProgressFromGitHub(studentId) {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${PROGRESS_FILE}`, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
            },
        });

        if (!response.ok) throw new Error('Không thể tải tiến độ từ GitHub.');

        const data = await response.json();
        const fileContent = JSON.parse(atob(data.content)); // Giải mã nội dung file
        progress = fileContent[studentId] || {}; // Tiến độ của học sinh theo ID

        console.log('Tiến độ đã tải:', progress);
        displayProblems(); // Hiển thị giao diện bài tập
    } catch (error) {
        console.error('Lỗi khi tải tiến độ:', error);
    }
}
        function getNextApiKey() {
            const key = API_KEYS[currentKeyIndex];
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            return key;
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
        document.getElementById('problemText').textContent = 'Không thể tải bài toán.';
    }
}
function parseGoogleSheetData(jsonData) {
    const data = jsonData.table.rows;
    return data.map(row => ({
        index: row.c[0]?.v || '', // Cột thứ tự
        problem: row.c[1]?.v.replace(/\r\n|\r|\n/g, '\n') || '' // Cột đề bài
    })).filter(item => item.problem && item.index);
}
function displayNextProblem() {
    if (problems.length > 0) {
        // Nếu chỉ số hiện tại vượt quá số bài, quay lại bài đầu tiên (tuỳ chọn)
        if (currentProblemIndex >= problems.length) {
            currentProblemIndex = 0;
        }

        // Lấy bài tập theo thứ tự
        currentProblem = problems[currentProblemIndex];
        currentProblemIndex++; // Tăng chỉ số lên bài tiếp theo

        document.getElementById('problemText').innerHTML = formatProblemText(currentProblem.problem);
        MathJax.typesetPromise([document.getElementById('problemText')]).catch(function (err) {
            console.error('MathJax rendering error:', err);
        });
    } else {
        document.getElementById('problemText').textContent = 'Không có bài toán nào.';
    }
}
function displayProblemByIndex(index) {
    if (problems.length === 0) {
        document.getElementById('problemText').textContent = 'Danh sách bài tập chưa được tải. Vui lòng thử lại.';
        return;
    }
    const selectedProblem = problems.find(problem => parseInt(problem.index) === parseInt(index));
    if (selectedProblem) {
        document.getElementById('problemText').innerHTML = formatProblemText(selectedProblem.problem);
        MathJax.typesetPromise([document.getElementById('problemText')]).catch(function (err) {
            console.error('MathJax rendering error:', err);
        });
    } else {
        document.getElementById('problemText').textContent = `Không tìm thấy bài tập với số thứ tự ${index}.`;
    }
}
        function formatProblemText(problemText) {
            return problemText.replace(/\n/g, '<br>').replace(/([a-d]\))/g, '<br>$1');
        }
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
       // Hàm cập nhật số bài đã làm và điểm trung bình
        function updateProgress(newScore) {
            completedProblems++;
            totalScore += newScore;
            let averageScore = totalScore / completedProblems;
            document.getElementById("completedProblems").textContent = completedProblems;
            document.getElementById("averageScore").textContent = averageScore.toFixed(2);
        }
        // Xử lý khi học sinh giải bài và bấm chấm bài
        document.getElementById('submitBtn').addEventListener('click', function() {
            // Giả sử điểm của bài hiện tại đã được tính là currentProblemScore
            updateProgress(currentProblemScore);
        });
        // Xử lý khi học sinh đăng nhập
        document.getElementById('loginBtn').addEventListener('click', function() {
            const studentId = document.getElementById('studentId').value;
            if (studentId) {
                currentStudentId = studentId;
                document.getElementById('loginContainer').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
            } else {
                alert('Vui lòng nhập mã học sinh');
            }
        });
        // Lấy bài toán ngẫu nhiên
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
        console.error('Error fetching problems:', error);
        document.getElementById('problemText').textContent = 'Lỗi khi tải bài toán. Vui lòng thử lại sau.';
    }
}
async function generateSimilarProblem(originalProblem) {
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent';
            const promptText = `
            Bạn hãy tạo một bài toán tương tự bài sau bằng cách thay đổi các số liệu một cách phù hợp, nhưng giữ nguyên cấu trúc và dạng toán:
            Bài toán gốc:
            ${originalProblem}
            Bài toán mới:
            `;
            const requestBody = {
                contents: [
                    {
                        parts: [
                            { text: promptText }
                        ]
                    }
                ]
            };           
            try {
                const data = await makeApiRequest(apiUrl, requestBody);
                return data.candidates[0].content.parts[0].text.trim();
            } catch (error) {
                console.error('Lỗi:', error);
                return `Đã xảy ra lỗi: ${error.message}`;
            }
        }
        async function generateHint(problemText) {
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent';
            const promptText = `
            Đề bài:
            ${problemText}
            Hãy đưa ra một gợi ý ngắn gọn để giúp học sinh giải bài toán này. Gợi ý nên:
            1. Không cung cấp đáp án trực tiếp
            2. Hướng dẫn học sinh về hướng giải quyết hoặc công thức cần sử dụng
            3. Khuyến khích học sinh suy nghĩ độc lập
            4. Phân chia gợi ý theo cấu trúc của đề bài (nếu có các phần a, b, c)

            Gợi ý:
            `;
            const requestBody = {
                contents: [
                    {
                        parts: [
                            { text: promptText }
                        ]
                    }
                ]
            };          
            try {
                const data = await makeApiRequest(apiUrl, requestBody);
                let hint = data.candidates[0].content.parts[0].text.trim();
                hint = hint.replace(/([a-d]\))/g, '\n$1');
                return hint;
            } catch (error) {
                console.error('Lỗi:', error);
                return `Đã xảy ra lỗi khi tạo gợi ý: ${error.message}`;
            }
        }
        async function gradeWithGemini(base64Image, problemText, studentId) {
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent';
            const promptText = `
            Học sinh: ${studentId}
            Đề bài:
            ${problemText}
             Hãy thực hiện các bước sau:
            1. Nhận diện và gõ lại bài làm của học sinh từ hình ảnh thành văn bản một cách chính xác, tất cả công thức Toán viết dưới dạng Latex, bọc trong dấu $, không tự suy luận nội dung hình ảnh, chỉ gõ lại chính xác các nội dung nhận diện được từ hình ảnh
            2. Giải bài toán và cung cấp lời giải chi tiết cho từng phần, lời giải phù hợp học sinh lớp 7 học theo chương trình 2018.
            3. So sánh bài làm của học sinh với đáp án đúng, chấm chi tiết từng bước làm đến kết quả
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
	    - Bài làm của học sinh không khớp với đề bài thì cho 0 điểm,
            - Điểm số phải là một số từ 0 đến 10, có thể có một chữ số thập phân.
            - Hãy đảm bảo tính chính xác và khách quan trong việc chấm điểm và nhận xét.
            - Nếu có sự không nhất quán giữa bài làm và điểm số, hãy giải thích rõ lý do.
            `;
            const requestBody = {
                contents: [
                    {
                        parts: [
                            { text: promptText },
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                        ]
                    }
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
        function getBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });
        }
        async function displayRandomProblem() {
            if (problems.length > 0) {
                const randomIndex = Math.floor(Math.random() * problems.length);
                currentProblem = problems[randomIndex];
                let problemText = currentProblem.problem;
                problemText = await generateSimilarProblem(problemText);
                problemText = formatProblemText(problemText);
                document.getElementById('problemText').innerHTML = problemText;
                currentHint = await generateHint(problemText);
                MathJax.typesetPromise([document.getElementById('problemText')]).catch(function (err) {
                    console.error('MathJax rendering error:', err);
                });
            } else {
                document.getElementById('problemText').textContent = 'Không có bài toán nào.';
            }
        }
        async function checkStudentId(studentId) {
            const progressUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=StudentProgress&tq=&tqx=out:json`;
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
        async function updateProgress(score) {
    if (!currentStudentId) {
        console.error('No currentStudentId provided.');
        return;
    }
    console.log('Current Student ID:', currentStudentId);
    const progressUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=StudentProgress&tq=&tqx=out:json`;
    try {
        const response = await fetch(progressUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch progress: ${response.statusText}`);
        }
        const text = await response.text();
        console.log('Response from Google Sheet:', text);
        const jsonData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/)[1]);
        const rows = jsonData.table.rows;
        console.log('Parsed Rows:', rows);
        let studentRow = rows.find(row => row.c[0]?.v.trim().toLowerCase() === currentStudentId.trim().toLowerCase());
        if (studentRow) {
            console.log('Student Row Data:', studentRow);
            let completedProblems = parseInt(studentRow.c[1]?.v || '0') + 1; // Số bài đã làm
            let totalScore = parseFloat(studentRow.c[2]?.v || '0') + score; // Tổng điểm
            let averageScore = totalScore / completedProblems; // Điểm trung bình
            console.log('Computed Values:', { completedProblems, totalScore, averageScore });
            // Cập nhật giao diện
            const completedElem = document.getElementById('completedProblems');
            const averageElem = document.getElementById('averageScore');
            if (completedElem && averageElem) {
                completedElem.textContent = completedProblems; // Hiển thị số bài
                averageElem.textContent = averageScore.toFixed(2); // Hiển thị điểm trung bình
            } else {
                console.error('Progress elements not found in DOM.');          }
            // Cập nhật Google Sheet
            await updateGoogleSheetData(currentStudentId, completedProblems, totalScore);
        } else {
            console.error('Student ID not found in Google Sheet.');
            document.getElementById('completedProblems').textContent = '0';
            document.getElementById('averageScore').textContent = '0';
        }
   	 } catch (error) {
        console.error('Error updating progress:', error.message, error.stack);
   	 }
	}
        function showMessageBox(message) {
            const overlay = document.createElement('div');
            overlay.className = 'message-box-overlay';            
            const messageBox = document.createElement('div');
            messageBox.className = 'message-box';
            messageBox.innerHTML = `
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">Đóng</button>
            `;            
            overlay.appendChild(messageBox);
            document.body.appendChild(overlay);
        }
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
async function handleLogin() {
    const studentId = document.getElementById('studentId').value.trim();

    // Bước 1: Kiểm tra nếu mã học sinh rỗng
    if (!studentId) {
        alert('Vui lòng nhập mã học sinh.');
        return;
    }

    // Bước 2: Lấy dữ liệu từ Google Sheets
    const sheetId = '165WblAAVsv_aUyDKjrdkMSeQ5zaLiUGNoW26ZFt5KWU'; // ID Google Sheet
    const sheetName = 'StudentProgress'; // Tên tab trong Google Sheet
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tqx=out:json`;

    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Phân tích dữ liệu Google Sheets
        const text = await response.text();
        const jsonDataMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/);
        if (!jsonDataMatch) {
            throw new Error('Không thể phân tích dữ liệu từ Google Sheet.');
        }

        const jsonData = JSON.parse(jsonDataMatch[1]);
        const rows = jsonData.table.rows;

        // Bước 3: Tìm mã học sinh
        const studentData = rows.find(row => (row.c[0]?.v || '').toString().trim() === studentId);
        if (!studentData) {
            alert(`Không tìm thấy lịch sử cho mã học sinh: ${studentId}`);
            return;
        }

        // Bước 4: Hiển thị thông tin tiến độ
        document.getElementById('progressContainer').style.display = 'block';
        document.getElementById('completedExercises').textContent = studentData.c[2]?.v || '0'; // Số bài đã làm
        document.getElementById('averageScore').textContent = studentData.c[3]?.v || '0'; // Điểm trung bình

        // Bước 5: Chuyển giao diện
        document.getElementById('loginContainer').style.display = 'none'; // Ẩn giao diện đăng nhập
        document.getElementById('mainContent').style.display = 'block';  // Hiển thị giao diện chính

        // Bước 6: Cập nhật thông tin học sinh
        currentStudentId = studentId; // Lưu mã học sinh hiện tại
        studentName = studentData.c[3]?.v || ''; // Lưu tên học sinh
        alert(`Chào mừng ${studentName}, bạn đã đăng nhập thành công!`);
	await loadProgressFromGitHub(studentId); // Tải tiến độ từ GitHub
	await fetchProblems();
	displayProblems(); // Hiển thị danh sách bài tập
	await updateProgress(0);
    } catch (error) {
        console.error('Lỗi khi xử lý đăng nhập:', error);
        alert(`Đã xảy ra lỗi khi đăng nhập: ${error.message}`);
    }
}
    document.getElementById('submitBtn').addEventListener('click', async () => {
    const problemText = document.getElementById('problemText')?.innerHTML?.trim();
    const studentFileInput = document.getElementById('studentImage');

    if (!problemText) {
        alert('Vui lòng đợi đề bài được tải.');
        return;    }
    if (!base64Image && !studentFileInput?.files?.length) {
        alert('Vui lòng chọn hoặc chụp ảnh bài làm của học sinh.');
        return;
    }
    // Ưu tiên ảnh từ camera, nếu không có thì sử dụng ảnh tải lên từ file
    const imageToProcess = base64Image || (studentFileInput.files.length > 0 ? await getBase64(studentFileInput.files[0]) : null);
    if (!imageToProcess) {
        alert('Không thể lấy ảnh bài làm. Vui lòng thử lại.');
        return;
    }
    try {
        document.getElementById('result').innerText = 'Đang xử lý...';
        // Gửi ảnh để chấm bài
        const { studentAnswer, feedback, score } = await gradeWithGemini(imageToProcess, problemText, currentStudentId);
	 const problemIndex = currentProblem.index; // Lấy số thứ tự bài tập hiện tại
        if (score > 0) { // Chỉ cập nhật nếu bài làm hợp lệ (điểm > 0)
            await updateProgress(problemIndex);
        }
        const submitted = await submitToGoogleForm(score, currentStudentId, problemText, studentAnswer, feedback, studentName);
        if (submitted) {
            document.getElementById('result').innerHTML = feedback;
            MathJax.typesetPromise([document.getElementById('result')]).catch(err => console.error('MathJax rendering error:', err));
            await updateProgress(score); // Vẫn giữ logic cập nhật nội bộ nếu có
            // Thêm logic cập nhật điểm trung bình và số bài làm từ Google Sheets
            const sheetId = '165WblAAVsv_aUyDKjrdkMSeQ5zaLiUGNoW26ZFt5KWU'; // ID Google Sheet
            const sheetName = 'StudentProgress'; // Tên tab trong Google Sheet
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tqx=out:json`;
            // Chờ vài giây để Google Sheets kịp cập nhật
            setTimeout(async () => {
                try {
                    const response = await fetch(sheetUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const text = await response.text();
                    const jsonDataMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/);
                    if (!jsonDataMatch) {
                        throw new Error('Không thể phân tích dữ liệu từ Google Sheets.');
                    }
                    const jsonData = JSON.parse(jsonDataMatch[1]);
                    const rows = jsonData.table.rows;
                    // Tìm thông tin theo mã học sinh
                    const studentData = rows.find(row => {
                        const sheetId = (row.c[0]?.v || '').toString().trim();
                        return sheetId === currentStudentId;
                    });
                    if (!studentData) {
                        console.error(`Không tìm thấy dữ liệu cho mã học sinh: ${currentStudentId}`);
                        return;
                    }
                    // Cập nhật số bài và điểm trung bình
                    const completedExercises = studentData.c[2]?.v || 0; // Cột C: Số bài đã làm
                    const averageScore = studentData.c[3]?.v || 0; // Cột D: Điểm trung bình
                    document.getElementById('completedExercises').textContent = completedExercises; // Cập nhật số bài
                    document.getElementById('averageScore').textContent = averageScore; // Cập nhật điểm trung bình
                    console.log(`Số bài đã làm: ${completedExercises}, Điểm trung bình: ${averageScore}`);
                } catch (error) {
                    console.error('Lỗi khi tải dữ liệu từ Google Sheets:', error);
                    alert(`Không thể tải tiến độ học tập. Chi tiết lỗi: ${error.message}`);
                }
            }, 3000); // Chờ 3 giây trước khi cập nhật để Google Sheets kịp xử lý
        } else {
            throw new Error('Không thể gửi dữ liệu đến Google Form.');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('result').innerText = `Đã xảy ra lỗi: ${error.message}. Vui lòng thử lại sau.`;
    }
});
       document.getElementById('randomProblemBtn').addEventListener('click', () => {
            displayRandomProblem();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            if (currentHint) {
                showMessageBox(currentHint);
            } else {
                alert("Chưa có gợi ý cho bài toán này.");
            }
        });
       
	document.getElementById('selectProblemBtn').addEventListener('click', async () => {
    const problemIndexInput = document.getElementById('problemIndexInput').value.trim();
    // Kiểm tra xem người dùng đã nhập số thứ tự hay chưa
    if (!problemIndexInput) {
        alert('Vui lòng nhập số thứ tự bài cần chọn.');
        return;
    }
    // Tìm bài tập theo số thứ tự
    const selectedProblem = problems.find(problem => parseInt(problem.index) === parseInt(problemIndexInput));
    if (selectedProblem) {
        // Hiển thị đề bài
        document.getElementById('problemText').innerHTML = formatProblemText(selectedProblem.problem);
        // Gọi hàm generateHint() để tạo gợi ý
        try {
            currentHint = await generateHint(selectedProblem.problem);
            console.log('Gợi ý cho bài tập đã chọn:', currentHint);
        } catch (error) {
            console.error('Lỗi khi tạo gợi ý:', error);
            currentHint = null;
        }
        // Hiển thị nội dung MathJax
        MathJax.typesetPromise([document.getElementById('problemText')]).catch(err => {
            console.error('MathJax rendering error:', err);
        });
    } else {
        // Không tìm thấy bài tập
        document.getElementById('problemText').textContent = `Không tìm thấy bài tập với số thứ tự ${problemIndexInput}.`;
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('cameraStream');
    const captureButton = document.getElementById('captureButton');
    const canvas = document.getElementById('photoCanvas');
    const img = document.getElementById('capturedImage');
      checkCameraAccess(); // Kiểm tra thiết bị
    startCamera(); // Bắt đầu camera
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (err) {
            console.error('Lỗi khi mở camera:', err);
            if (err.name === 'NotAllowedError') {
                alert('Bạn chưa cấp quyền truy cập camera.');
            } else if (err.name === 'NotFoundError') {
                alert('Không tìm thấy thiết bị camera.');
            } else {
                alert('Lỗi không xác định. Vui lòng thử lại.');
            }
        }
    }
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
captureButton.addEventListener('click', () => {
    if (!video.videoWidth || !video.videoHeight) {
        alert('Camera chưa sẵn sàng. Vui lòng đợi.');
        return;
    }
    // Tính toán tỷ lệ khung hình mong muốn (1.5:1)
    const desiredAspectRatio = 1.5; // Chiều cao gấp 1.5 lần chiều rộng
    const videoWidth = video.clientWidth;
    const videoHeight = videoWidth * desiredAspectRatio; // Tính chiều cao theo tỷ lệ 1.5:1
    // Đặt kích thước canvas với tỷ lệ mong muốn
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    // Tính toán phần video cần cắt để khớp tỷ lệ
    const actualAspectRatio = video.videoHeight / video.videoWidth;
    let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;
    if (actualAspectRatio > desiredAspectRatio) {
        // Video quá cao, cắt bớt chiều cao
        sHeight = video.videoWidth * desiredAspectRatio;
        sy = (video.videoHeight - sHeight) / 2; // Cắt đều hai bên
    } else if (actualAspectRatio < desiredAspectRatio) {
        // Video quá rộng, cắt bớt chiều rộng
        sWidth = video.videoHeight / desiredAspectRatio;
        sx = (video.videoWidth - sWidth) / 2; // Cắt đều hai bên
    }
    // Vẽ nội dung video lên canvas với kích thước và tỷ lệ đã tính toán
    const context = canvas.getContext('2d');
    context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    // Chuyển đổi canvas thành Base64 (JPEG, chất lượng 0.9)
    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    base64Image = base64Data.split(',')[1]; // Loại bỏ tiền tố "data:image/jpeg;base64,"
    console.log('Base64 Image:', base64Image.substring(0, 100), '...'); // Log 100 ký tự đầu để kiểm tra
    // Hiển thị ảnh chụp
    img.src = base64Data;
    img.style.display = 'block';
    const imageContainer = document.getElementById('imageContainer');
if (!imageContainer.contains(img)) {
    imageContainer.appendChild(img); // Đảm bảo ảnh nằm trong `#imageContainer`
}
});
document.getElementById('deleteAllBtn').addEventListener('click', () => {
    // Xóa ảnh được hiển thị
    const img = document.getElementById('capturedImage');
    if (img) {
        img.src = ''; // Đặt lại ảnh
        img.style.display = 'none'; // Ẩn ảnh
    }
    base64Image = ''; // Xóa dữ liệu base64 của ảnh
    // Xóa bài giải hiển thị
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.innerHTML = ''; // Xóa nội dung bài giải
    }
    // Thông báo hành động hoàn thành
    alert('Đã xóa tất cả ảnh và bài giải.');
});

async function saveProgressToGitHub(studentId) {
    try {
        // Lấy SHA của file hiện tại (nếu không có, file sẽ được tạo mới)
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${PROGRESS_FILE}`, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
            },
        });

        const data = await response.json();
        const sha = data.sha; // SHA của file hiện tại

        // Cập nhật tiến độ của học sinh
        const updatedContent = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${PROGRESS_FILE}`, {
            method: 'PUT',
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Cập nhật tiến độ học sinh',
                content: btoa(JSON.stringify({ ...JSON.parse(atob(data.content)), [studentId]: progress }, null, 2)),
                sha: sha, // Đảm bảo ghi đè file cũ
            }),
        });

        if (!updatedContent.ok) throw new Error('Không thể lưu tiến độ lên GitHub.');

        console.log('Tiến độ đã được lưu lên GitHub.');
    } catch (error) {
        console.error('Lỗi khi lưu tiến độ:', error);
    }
}	

	async function updateProgress(problemIndex) {
    progress[problemIndex] = true; // Đánh dấu bài đã làm
    displayProblems(); // Cập nhật giao diện
    await saveProgressToGitHub(currentStudentId); // Lưu tiến độ lên GitHub
}
	function handleProblemClick(problemIndex) {
    // Kiểm tra trạng thái bài tập
    const progress = {}; // Đây là nơi bạn lưu trạng thái bài tập
    const isCompleted = progress[problemIndex] || false;

    if (isCompleted) {
        const confirmRedo = confirm(`Bài tập ${problemIndex} đã được làm. Bạn có muốn làm lại không?`);
        if (!confirmRedo) {
            return; // Không làm lại, thoát hàm
        }
    }

    // Xử lý logic khi chọn bài tập
    console.log(`Bắt đầu làm bài tập ${problemIndex}`);
    alert(`Đang mở bài tập ${problemIndex}`);

    // Hiển thị đề bài hoặc thực hiện các thao tác tiếp theo
    displayProblemByIndex(problemIndex);
}

       // Các đoạn mã ngăn chặn xem mã nguồn và bảo vệ nội dung
        (function() {
            // Vô hiệu hóa nhấp chuột phải
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });

            // Vô hiệu hóa các phím tắt
            document.addEventListener('keydown', function(e) {
                // Vô hiệu hóa F12
                if (e.key === 'F12' || e.keyCode === 123) {
                    e.preventDefault();
                    return false;
                }
                
                if (e.ctrlKey) {
                    // Vô hiệu hóa Ctrl+U
                    if (e.key === 'u' || e.keyCode === 'U'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                    // Vô hiệu hóa Ctrl+S
                    if (e.key === 's' || e.keyCode === 'S'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                    // Vô hiệu hóa Ctrl+P
                    if (e.key === 'p' || e.keyCode === 'P'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                    // Vô hiệu hóa Ctrl+A
                    if (e.key === 'a' || e.keyCode === 'A'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                    // Vô hiệu hóa Ctrl+C
                    if (e.key === 'c' || e.keyCode === 'C'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                }

                if (e.ctrlKey && e.shiftKey) {
                    // Vô hiệu hóa Ctrl+Shift+I
                    if (e.key === 'i' || e.keyCode === 'I'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                    // Vô hiệu hóa Ctrl+Shift+J
                    if (e.key === 'j' || e.keyCode === 'J'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                    // Vô hiệu hóa Ctrl+Shift+C
                    if (e.key === 'c' || e.keyCode === 'C'.charCodeAt(0)) {
                        e.preventDefault();
                        return false;
                    }
                }
            });

            // Vô hiệu hóa kéo thả
            document.addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
            });

            // Vô hiệu hóa cắt
            document.addEventListener('cut', function(e) {
                e.preventDefault();
                return false;
            });

            // Vô hiệu hóa lưu trang
            window.addEventListener('beforeunload', function(e) {
                e.preventDefault();
                return false;
            });

            // Vô hiệu hóa công cụ phát triển
            setInterval(function() {
                debugger;
            }, 100);

            // Kiểm tra và vô hiệu hóa devtools
            let devtools = function() {};
            devtools.toString = function() {
                this.opened = true;
                return '';
            };
            
            setInterval(function() {
                console.log(devtools);
                console.clear();
            }, 1000);

            // Vô hiệu hóa view-source
            if(window.location.href.indexOf('view-source:') !== -1) {
                window.location.href = window.location.href.replace('view-source:', '');
            }

            // Ngăn chặn inspect element
            document.addEventListener('keydown', function(e) {
                if(e.key === 'F12' || 
                   (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))) {
                    e.preventDefault();
                }
            });

            // Vô hiệu hóa phím Print Screen
            document.addEventListener('keyup', function(e) {
                if(e.key === 'PrintScreen') {
                    navigator.clipboard.writeText('');
                }
            });
            // Thêm watermark để ngăn chặn chụp màn hình (tùy chọn)
            function addWatermark() {
                const watermark = document.createElement('div');
                watermark.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 60px;
                    opacity: 0.1;
                    pointer-events: none;
                    z-index: 9999;
                    white-space: nowrap;
                `;
                watermark.textContent = 'BÀI KIỂM TRA - KHÔNG SAO CHÉP';
                document.body.appendChild(watermark);
            }
            addWatermark();
        })();
  
