# NLP Tool - Công cụ Xử lý Ngôn ngữ Tự nhiên 

**NLP Tool** là một hệ thống xử lý ngôn ngữ tự nhiên (NLP) toàn diện, được thiết kế để phân tích, xử lý và khai thác dữ liệu văn bản tiếng Việt. Dự án này là bài tập cá nhân cho môn học Xử lý Ngôn ngữ Tự nhiên tại **Trường Đại học Sư Phạm Kỹ Thuật Thành Phố Hồ Chí Minh**.

**Tác giả**: Nguyễn Hoàng Vỹ (MSSV: 22110275)

## Tổng quan

NLP Tool cung cấp một bộ công cụ mạnh mẽ để xử lý văn bản tiếng Việt, từ làm sạch dữ liệu, phân tích cú pháp, vector hóa, đến các ứng dụng nâng cao như phân loại văn bản, hệ thống gợi ý và chatbot AI. Dự án được xây dựng với mục tiêu hỗ trợ các tác vụ NLP phức tạp, đồng thời dễ dàng sử dụng thông qua API và giao diện người dùng.

## Tính năng Chính

### 🔍 Phân tích Văn bản
- **Phân tách câu**: Tách văn bản thành các câu riêng biệt, tối ưu cho đặc điểm ngôn ngữ tiếng Việt.
- **Phân tách từ**: Tokenize văn bản thành các đơn vị từ, hỗ trợ spaCy và phương pháp tùy chỉnh.
- **Gán nhãn từ loại (POS Tagging)**: Nhận diện và gán nhãn danh từ, động từ, tính từ, v.v.
- **Nhận diện thực thể (NER)**: Phát hiện các thực thể như tên người, tổ chức, địa điểm.

### 🧹 Làm sạch Văn bản
- **Chuẩn hóa Unicode**: Chuyển đổi văn bản sang định dạng Unicode chuẩn.
- **Loại bỏ HTML/URLs/Emails**: Xóa các phần tử không mong muốn.
- **Xử lý dấu câu và ký tự đặc biệt**: Tùy chọn giữ hoặc loại bỏ.
- **Xử lý stopwords**: Loại bỏ các từ không mang ý nghĩa ngữ nghĩa.

### 📊 Vector hóa Văn bản
- **One-Hot Encoding**: Biểu diễn văn bản dưới dạng vector nhị phân.
- **Bag-of-Words (BoW)**: Biểu diễn tần suất từ.
- **TF-IDF**: Đánh giá tầm quan trọng của từ trong tập văn bản.
- **N-grams**: Phân tích chuỗi n từ liên tiếp (mặc định n=2-3).

### 🔄 Tăng cường Dữ liệu
- **Thay thế từ đồng nghĩa**: Tạo biến thể văn bản bằng từ đồng nghĩa.
- **Thêm/Xóa/Đổi chỗ từ**: Tạo biến thể ngẫu nhiên.
- **Dịch ngược (Back-translation)**: Tạo văn bản mới thông qua dịch thuật.
- **Thêm nhiễu**: Thêm lỗi chính tả hoặc biến đổi kiểu viết để tăng độ bền mô hình.

### 🏷️ Phân loại Văn bản
- **Phân loại đa lớp**: Hỗ trợ các mô hình như Naive Bayes, SVM, Neural Networks.
- **Phân tích độ tin cậy**: Cung cấp xác suất cho mỗi lớp dự đoán.
- **Huấn luyện tùy chỉnh**: Cho phép huấn luyện mô hình từ dữ liệu người dùng.

### 💬 Chatbot AI
- **Trò chuyện tương tác**: Hỗ trợ đối thoại tự nhiên, duy trì ngữ cảnh.
- **Tùy chỉnh bối cảnh**: Điều chỉnh phản hồi dựa trên ngữ cảnh.
- **Quản lý lịch sử**: Lưu trữ và quản lý lịch sử trò chuyện.

### 📚 Hệ thống Gợi ý
- **Gợi ý nội dung**: Tìm kiếm nội dung tương tự dựa trên độ tương đồng.
- **Phương pháp dựa trên nội dung**: Sử dụng vector hóa để phân tích tương đồng.

## Kiến trúc Dự án

```
nlp-tool/
├── backend/                       # Chứa mã nguồn backend và API
│   ├── app.py                     # Ứng dụng Flask chính, định nghĩa API endpoints
│   ├── text_cleaning.py           # Module làm sạch và chuẩn bị văn bản
│   ├── text_vectorization.py      # Module vector hóa văn bản
│   ├── data_augmentation.py       # Module tăng cường dữ liệu
│   ├── text_classification.py     # Module phân loại văn bản
│   ├── prediction_service.py      # Dịch vụ dự đoán và suy luận
│   ├── recommendation_system.py   # Hệ thống gợi ý
│   ├── chatbot.py                 # Module xử lý chatbot AI
│   ├── file_processor.py          # Module xử lý file đầu vào
│   └── requirements.txt           # Danh sách thư viện Python
├── frontend/                      # Giao diện người dùng truyền thống
│   ├── templates/                 # Tệp HTML
│   └── static/                    # CSS, JS, hình ảnh
├── frontend-react/                # Giao diện React (đang phát triển)
│   ├── src/                       # Mã nguồn React
│   │   ├── components/            # Thành phần UI tái sử dụng
│   │   ├── pages/                 # Các trang ứng dụng
│   │   └── services/              # Dịch vụ kết nối API
│   └── public/                    # Tài nguyên công khai
├── data/                          # Lưu trữ dữ liệu và mô hình
│   ├── models/                    # Mô hình NLP đã huấn luyện
│   └── datasets/                  # Tập dữ liệu mẫu
├── start.sh                       # Script khởi động (Linux/macOS)
└── start.bat                      # Script khởi động (Windows)
```

## Cài đặt và Triển khai

### Yêu cầu Hệ thống
- **Python**: 3.8 hoặc cao hơn

### Cài đặt
1. **Sao chép mã nguồn**


2. **Cài đặt thư viện backend**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Tải mô hình NLP**
   - Các mô hình spaCy tiếng Việt (hoặc tương tự) sẽ tự động tải khi chạy lần đầu.
   - Đảm bảo kết nối internet ổn định và đủ dung lượng ổ cứng.

### Khởi chạy Ứng dụng
1. Chạy backend:
   ```bash
   python backend/app.py
   ```
2. Truy cập API tại: `http://localhost:5000`

## API Endpoints

| **Endpoint**                     | **Phương thức** | **Mô tả**                                      |
|----------------------------------|-----------------|------------------------------------------------|
| `/api/process_text`              | POST            | Xử lý văn bản cơ bản                          |
| `/api/process_with_options`      | POST            | Xử lý văn bản với tùy chọn chi tiết           |
| `/api/clean_text`                | POST            | Làm sạch văn bản                              |
| `/api/tokenize_sentences`        | POST            | Phân tách câu                                 |
| `/api/vectorize`                 | POST            | Vector hóa văn bản                            |
| `/api/classify_text`             | POST            | Phân loại văn bản                             |
| `/api/train_model`               | POST            | Huấn luyện mô hình mới                        |
| `/api/predict`                   | POST            | Dự đoán với mô hình đã huấn luyện             |
| `/api/model_categories`          | GET             | Lấy danh sách loại mô hình                    |
| `/api/create_augmented_samples`  | POST            | Tạo mẫu văn bản tăng cường                    |
| `/api/find_synonyms`             | POST            | Tìm từ đồng nghĩa                             |
| `/api/batch_crawl`               | POST            | Crawl từ đồng nghĩa cho danh sách từ          |
| `/api/recommend`                 | POST            | Gợi ý nội dung dựa trên văn bản               |
| `/api/chat`                      | POST            | Gửi tin nhắn đến chatbot                      |
| `/api/chat/context`              | POST            | Thay đổi ngữ cảnh trò chuyện                  |
| `/api/upload`                    | POST            | Tải lên file để xử lý                         |
| `/api/process_file`              | POST            | Xử lý file đã tải lên                         |
| `/outputs/{filename}`            | GET             | Tải xuống kết quả xử lý                       |

**Tài liệu API chi tiết** sẽ được cung cấp trong thư mục `docs/` (dự kiến bổ sung).


## Liên hệ
- **Tác giả**: Nguyễn Hoàng Vỹ
- **MSSV**: 22110275
- **Email**: <vyxv113@gmail.com>
- **Trường**: Đại học Sư Phạm Kỹ Thuật TP.HCM
- **Khoa**: Công nghệ thông tin - Trí tuệ nhân tạo