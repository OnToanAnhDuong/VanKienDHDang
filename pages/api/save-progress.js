export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;  // Lấy token từ biến môi trường Vercel
    const GITHUB_SAVE_PROGRESS_URL = 'https://api.github.com/repos/OnToanAnhDuong/WEBMOi/contents/progress.json';

    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: '❌ GITHUB_TOKEN không tồn tại! Kiểm tra biến môi trường trên Vercel.' });
    }

    const { progressData } = req.body;  // Nhận dữ liệu từ request body

    if (!progressData) {
        return res.status(400).json({ error: '❌ progressData là bắt buộc.' });
    }

    try {
        // Lấy SHA của file (nếu có)
        const shaResponse = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            }
        });

        let sha = null;
        if (shaResponse.ok) {
            const shaData = await shaResponse.json();
            sha = shaData.sha || null;
        }

        // Mã hóa dữ liệu JSON thành Base64
        const content = Buffer.from(JSON.stringify(progressData, null, 2)).toString('base64');

        // Gửi dữ liệu lên GitHub
        const response = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            },
            body: JSON.stringify({
                message: 'Cập nhật tiến trình học sinh',
                content: content,
                ...(sha ? { sha } : {})  // Nếu file tồn tại, cập nhật bằng SHA
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Lỗi khi lưu tiến trình:", errorData);
            return res.status(500).json({ error: errorData });
        }

        res.status(200).json({ message: '✅ Tiến trình đã được lưu lên GitHub!' });
    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình:", error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lưu tiến trình.' });
    }
}

