<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Tài Liệu</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 0;
            padding: 0;
            background: url('background-image.jpg') no-repeat center center fixed;
            background-size: cover;
            color: white;
        }
        .header {
            background-color: rgba(0, 0, 0, 0.6);
            padding: 20px;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .header h1 {
            margin: 0;
            font-size: 2em;
            font-weight: bold;
        }
        .qr-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
            margin: 20px;
        }
        .qr-item {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
            text-align: center;
            background-color: rgba(255, 255, 255, 0.8);
            color: black;
        }
        .qr-item canvas {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ĐẠI HỘI LẦN THỨ XII NHIỆM KỲ 2025 - 2027</h1>
    </div>
    <div class="qr-container" id="qrContainer">
        <!-- QR Codes will be generated here -->
    </div>

    <script>
        // Danh sách tài liệu (thay thế URL bằng tài liệu của bạn)
        const documents = [
            { name: "Tài liệu 1", url: "https://example.com/document1.pdf" },
            { name: "Tài liệu 2", url: "https://example.com/document2.pdf" },
            { name: "Tài liệu 3", url: "https://example.com/document3.pdf" },
        ];

        // Container để chứa QR Codes
        const qrContainer = document.getElementById("qrContainer");

        // Hàm tạo QR Code
        documents.forEach(doc => {
            const qrItem = document.createElement("div");
            qrItem.className = "qr-item";

            const qrCanvas = document.createElement("canvas");
            const title = document.createElement("p");
            title.textContent = doc.name;

            // Tạo QR Code
            QRCode.toCanvas(qrCanvas, doc.url, {
                width: 150,
            }, (error) => {
                if (error) console.error(error);
            });

            qrItem.appendChild(qrCanvas);
            qrItem.appendChild(title);
            qrContainer.appendChild(qrItem);
        });
    </script>
</body>
</html>
