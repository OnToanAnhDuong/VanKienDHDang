export default async function handler(req, res) {
    if (req.method === 'POST') {
        // Lưu tiến trình lên GitHub
        return await saveProgressToGitHub(req, res);
    } else if (req.method === 'GET') {
        // Đọc tiến trình từ GitHub
        return await loadProgressFromGitHub(req, res);
    } else {
        res.status(405).json({ error: '❌ Method Not Allowed' });
    }
}

// Hàm tải tiến trình từ GitHub
async function loadProgressFromGitHub(req, res) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: '❌ GITHUB_TOKEN không tồn tại! Kiểm tra biến môi trường trên Vercel.' });
    }

    try {
        console.log("📥 Đang tải tiến trình từ GitHub...");

        const response = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.content) {
            const decodedContent = atob(data.content);
            return res.status(200).json(JSON.parse(decodedContent));
        } else {
            return res.status(200).json({});
        }
    } catch (error) {
        console.error("❌ Lỗi khi tải tiến trình:", error);
        return res.status(500).json({ error: 'Lỗi khi tải tiến trình.' });
    }
}

// Hàm lưu tiến trình lên GitHub
async function saveProgressToGitHub(req, res) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: '❌ GITHUB_TOKEN không tồn tại! Kiểm tra biến môi trường trên Vercel.' });
    }

    const { progressData } = req.body;

    if (!progressData || typeof progressData !== "object") {
        return res.status(400).json({ error: '❌ progressData không hợp lệ.' });
    }

    try {
        console.log("📥 Đang lấy SHA của file JSON...");

        let sha = null;
        const shaResponse = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            }
        });

        if (shaResponse.ok) {
            const shaData = await shaResponse.json();
            sha = shaData.sha || null;
            console.log("✅ SHA lấy được:", sha);
        } else if (shaResponse.status === 404) {
            console.warn("⚠ File chưa tồn tại, sẽ tạo mới.");
        } else {
            throw new Error("❌ Lỗi khi lấy SHA file từ GitHub.");
        }

        console.log("📤 Đang lưu tiến trình lên GitHub...");

        const content = Buffer.from(JSON.stringify(progressData, null, 2)).toString('base64');

        const response = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            },
            body: JSON.stringify
