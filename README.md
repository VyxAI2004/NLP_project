# Chatbot AI - NLP Tool

## Giới thiệu
Dự án này là một ứng dụng web NLP có tích hợp chatbot AI 
## Các tính năng chính
- Giao diện chatbot thân thiện với người dùng
- Xử lý ngôn ngữ tự nhiên với mô hình blenderbot từ Facebook/Hugging Face
- API RESTful cho tích hợp với các ứng dụng khác
- Cải thiện độ chính xác của phản hồi thông qua các kỹ thuật xử lý văn bản
- Hỗ trợ lưu trữ và quản lý lịch sử cuộc trò chuyện

## Cài đặt
1. Cài đặt các thư viện phụ thuộc:
```bash
pip install -r backend/requirements.txt
```

3. Tải mô hình ngôn ngữ:
Mô hình sẽ được tự động tải xuống khi chạy ứng dụng lần đầu tiên.

## Chạy ứng dụng
```bash
python python run.py
```

Sau khi khởi chạy, ứng dụng sẽ được triển khai tại `http://localhost:5000`.

## Sử dụng API
API chatbot có thể được truy cập tại các endpoint sau:

- **POST /api/chat**: Gửi tin nhắn đến chatbot và nhận phản hồi
  
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
##Link youtube : https://www.youtube.com/watch?v=9kfPdKMlNHk