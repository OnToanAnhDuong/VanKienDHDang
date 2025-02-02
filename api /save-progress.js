const GITHUB_SAVE_PROGRESS_URL = 'https://api.github.com/repos/OnToanAnhDuong/WEBMOi/contents/progress.json';

// Kiểm tra xem biến môi trường có tồn tại không
if (!process.env.GITHUB_TOKEN) {
    console.error("❌ Lỗi: GITHUB_TOKEN không tồn tại!");
    throw new Error("GITHUB_TOKEN không tồn tại! Kiểm tra biến môi trường trên Vercel.");
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: "Method Not Allowed. Chỉ hỗ trợ POST." });
        }

        console.log("📥 API nhận request:", req.body);

        const { progressData } = req.body;
        if (!progressData || typeof progressData !== "object") {
            console.error("❌ Lỗi: Dữ liệu không hợp lệ:", progressData);
            return res.status(400).json({ error: "Dữ liệu không hợp lệ. Vui lòng gửi JSON hợp lệ." });
        }

        let sha = null;

        console.log("📥 [API] Đang lấy SHA của file JSON...");
        const shaResponse = await fetch(GITHUB_SAVE_PROGRESS_URL, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${GITHUB_TOKEN}`
            }
        });

        if (shaResponse.ok) {
            const shaData = await shaResponse.json();
            sha = shaData.sha || null;
            console.log("✅ SHA hiện tại:", sha);
        } else if (shaResponse.status === 404) {
            console.warn("⚠ File chưa tồn tại, sẽ tạo mới.");
        } else {
            const errorDetails = await shaResponse.json();
            console.error("❌ Lỗi khi lấy SHA từ GitHub:", errorDetails);
            return res.status(500).json({ error: "Lỗi khi lấy SHA từ GitHub.", details: errorDetails });
        }

        console.log("📤 [API] Đang ghi dữ liệu lên GitHub...");
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
                sha: sha || null
            })
        });

        const saveData = await saveResponse.json();
        console.log("📤 [API] Response từ GitHub:", saveData);

        if (!saveResponse.ok) {
            console.error("❌ Lỗi khi lưu tiến trình vào GitHub:", saveData);
            return res.status(500).json({ error: "Lỗi khi lưu tiến trình vào GitHub.", details: saveData });
        }

        return res.status(200).json({ message: "✅ Tiến trình đã lưu thành công!", data: saveData });

    } catch (error) {
        console.error("❌ Lỗi khi ghi dữ liệu lên GitHub:", error);
        return res.status(500).json({ error: "Lỗi khi ghi dữ liệu lên GitHub." });
    }
};
