# Ứng dụng Xử lý Văn bản Tiếng Việt

Đây là ứng dụng web cho phép xử lý văn bản tiếng Việt với nhiều tính năng khác nhau.

## Cấu trúc dự án

### Frontend
- Chứa các template HTML, CSS và JavaScript
- Nằm trong thư mục `frontend/`
  - `frontend/templates/`: Chứa các file HTML
  - `frontend/static/css/`: Chứa các file CSS
  - `frontend/static/js/`: Chứa các file JavaScript

### Backend
- Chứa các file Python xử lý logic của ứng dụng
- Nằm trong thư mục `backend/`
  - `backend/app.py`: File chính khởi động Flask server
  - `backend/text_cleaning.py`: Module xử lý và làm sạch văn bản
  - `backend/text_vectorization.py`: Module vector hóa văn bản
  - `backend/text_classification.py`: Module phân loại văn bản
  - `backend/data_augmentation.py`: Module tăng cường dữ liệu
  - `backend/crawler_synonyms.py`: Module tìm từ đồng nghĩa
  - `backend/prediction_service.py`: Module dự đoán sử dụng mô hình
  - `backend/file_processor.py`: Module xử lý các loại file
  - `backend/data/`: Thư mục chứa dữ liệu và mô hình
  - `backend/uploads/`: Thư mục lưu trữ file tải lên
  - `backend/temp/`: Thư mục chứa file tạm thời

## Các tính năng chính

- **Làm sạch văn bản** - Loại bỏ HTML, URL, email, số điện thoại, ký tự đặc biệt...
- **Tách câu** - Phân tách văn bản thành các câu riêng biệt
- **Tách từ** - Phân tách văn bản thành các từ
- **Gán nhãn từ loại** - Xác định từ loại cho các từ trong văn bản
- **Tìm từ đồng nghĩa** - Tìm kiếm từ đồng nghĩa tiếng Việt
- **Tăng cường dữ liệu** - Tạo thêm mẫu dữ liệu từ văn bản gốc
- **Vector hóa văn bản** - Chuyển đổi văn bản thành dạng vector 
- **Phân loại văn bản** - Đào tạo và sử dụng mô hình phân loại văn bản

## Cách chạy ứng dụng

1. Clone repository về máy
2. Cài đặt các gói phụ thuộc:
```
pip install -r requirements.txt
```
3. Chạy ứng dụng:
```
python run.py
```

Ứng dụng sẽ chạy tại địa chỉ http://localhost:5000/

## API Endpoints

- `GET /`: Trang chủ
- `POST /api/process_text`: Xử lý văn bản
- `POST /api/clean_text`: Làm sạch văn bản
- `POST /api/tokenize_sentences`: Tách câu
- `POST /api/process_with_options`: Xử lý văn bản với các tùy chọn
- `POST /api/vectorize`: Vector hóa văn bản
- `POST /api/predict`: Dự đoán phân loại văn bản
- `POST /api/train_model`: Đào tạo mô hình phân loại
- `GET /train_model`: Trang đào tạo mô hình
- `GET /synonyms`: Trang tìm từ đồng nghĩa

## Tài liệu API

### POST /api/process_text
Xử lý văn bản cơ bản

**Body Request:**
```json
{
  "text": "Văn bản tiếng Việt cần xử lý"
}
```

### POST /api/clean_text
Làm sạch văn bản

**Body Request:**
```json
{
  "text": "Văn bản tiếng Việt cần làm sạch"
}
```

### POST /api/process_with_options
Xử lý văn bản với nhiều tùy chọn

**Body Request:**
```json
{
  "text": "Văn bản tiếng Việt cần xử lý",
  "options": {
    "cleaning": {
      "lowercase": true,
      "remove-special-chars": true
    },
    "augmentation": {
      "use-synonyms": true
    },
    "vectorization": {
      "bow": true
    },
    "classification": {}
  }
}
```

## Tạo môi trường riêng (tuỳ chọn)

```
python -m venv env
source env/bin/activate  # Trên Linux/Mac
env\Scripts\activate     # Trên Windows
pip install -r requirements.txt
```
