export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GITHUB_SAVE_PROGRESS_URL = 'https://api.github.com/repos/OnToanAnhDuong/WEBMOi/contents/progress.json';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GITHUB_TOKEN) {
        console.error("❌ Lỗi: GITHUB_TOKEN không tồn tại!");
        return res.status(500).json({ error: 'GITHUB_TOKEN không tồn tại' });
    }

    const { progressData } = req.body;
    
    if (!progressData || typeof progressData !== "object" || Object.keys(progressData).length === 0) {
        return res.status(400).json({ error: '❌ progressData không hợp lệ hoặc trống.' });
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
            throw new Error(`❌ Lỗi khi lấy SHA file từ GitHub: ${shaResponse.statusText}`);
        }

        console.log("📤 Đang lưu tiến trình lên GitHub...");
        const content = Buffer.from(JSON.stringify(progressData, null, 2)).toString('base64');

        const saveResponse = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            },
            body: JSON.stringify({
                message: 'Cập nhật tiến trình học sinh',
                content: content,
                sha: sha // Nếu file tồn tại, cập nhật; nếu không, tạo mới
            })
        });

        const saveData = await saveResponse.json();
        
        if (!saveResponse.ok) {
            throw new Error(`❌ Lỗi khi lưu tiến trình lên GitHub: ${JSON.stringify(saveData, null, 2)}`);
        }

        console.log("✅ Tiến trình đã được lưu thành công!");
        return res.status(200).json({ message: "✅ Tiến trình đã được lưu thành công!", data: saveData });

    } catch (error) {
        console.error("❌ Lỗi khi lưu tiến trình lên GitHub:", error);
        return res.status(500).json({ error: "Lỗi khi lưu tiến trình lên GitHub." });
    }
}
console.log("🔍 Kiểm tra GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "✅ Có tồn tại" : "❌ Không tồn tại");
