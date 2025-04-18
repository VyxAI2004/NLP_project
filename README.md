# Chatbot AI - NLP Tool

## Giới thiệu
Dự án này là một ứng dụng web NLP có tích hợp chatbot AI sử dụng mô hình ngôn ngữ từ Hugging Face. Chatbot có khả năng trả lời các câu hỏi và duy trì cuộc hội thoại với người dùng.

## Các tính năng chính
- Giao diện chatbot thân thiện với người dùng
- Xử lý ngôn ngữ tự nhiên với mô hình blenderbot từ Facebook/Hugging Face
- API RESTful cho tích hợp với các ứng dụng khác
- Cải thiện độ chính xác của phản hồi thông qua các kỹ thuật xử lý văn bản
- Hỗ trợ lưu trữ và quản lý lịch sử cuộc trò chuyện

## Cài đặt
1. Clone repository này về máy local:
```bash
git clone <repository-url>
cd <repository-folder>
```

2. Cài đặt các thư viện phụ thuộc:
```bash
pip install -r backend/requirements.txt
```

3. Tải mô hình ngôn ngữ:
Mô hình sẽ được tự động tải xuống khi chạy ứng dụng lần đầu tiên.

## Chạy ứng dụng
```bash
python backend/app.py
```

Sau khi khởi chạy, ứng dụng sẽ được triển khai tại `http://localhost:5000`.

## Sử dụng API
API chatbot có thể được truy cập tại các endpoint sau:

- **POST /api/chat**: Gửi tin nhắn đến chatbot và nhận phản hồi
  ```json
  {
    "message": "Xin chào, bạn khỏe không?"
  }
  ```
  Phản hồi:
  ```json
  {
    "reply": "Chào bạn! Tôi khỏe, cảm ơn bạn đã hỏi. Tôi có thể giúp gì cho bạn không?"
  }
  ```

- **GET /api/chatbot/health**: Kiểm tra trạng thái hoạt động của chatbot
  Phản hồi:
  ```json
  {
    "status": "healthy",
    "model": "facebook/blenderbot-400M-distill"
  }
  ```

## Cấu trúc dự án
```
project/
├── backend/
│   ├── chatbot.py         # Module xử lý chatbot
│   ├── app.py             # Ứng dụng Flask chính
│   ├── requirements.txt   # Các thư viện cần thiết
│   └── ...                # Các module khác
├── frontend/
│   ├── templates/         # Các file HTML
│   │   └── chatbot.html   # Giao diện chatbot
│   └── static/            # Các file tĩnh (CSS, JS, images)
│       └── js/
│           └── chatbot.js # JavaScript cho chatbot
└── README.md              # Tài liệu hướng dẫn
```

## Tùy chỉnh mô hình
Bạn có thể thay đổi mô hình mặc định trong file `backend/chatbot.py` bằng cách chỉnh sửa biến `model_name`.

## Đóng góp
Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue trước khi gửi pull request.
