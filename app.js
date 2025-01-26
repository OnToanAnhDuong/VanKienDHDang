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
let base64Image = '';

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

function displayProblem(index) {
    if (problems[index]) {
        const problemText = problems[index].problem;
        document.getElementById('problemText').innerHTML = problemText.replace(/\n/g, '<br>');
        MathJax.typesetPromise();
    } else {
        document.getElementById('problemText').textContent = 'Không tìm thấy bài tập.';
    }
}

document.getElementById('loginBtn').addEventListener('click', async () => {
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
});

document.getElementById('randomProblemBtn').addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * problems.length);
    displayProblem(randomIndex);
});

document.getElementById('selectProblemBtn').addEventListener('click', () => {
    const problemIndex = parseInt(document.getElementById('problemIndexInput').value, 10);
    if (!isNaN(problemIndex) && problemIndex >= 0 && problemIndex < problems.length) {
        displayProblem(problemIndex);
    } else {
        alert('Số thứ tự không hợp lệ.');
    }
});
