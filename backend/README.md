# Xử Lý Văn Bản Tiếng Việt

Thư viện này cung cấp các công cụ để xử lý văn bản tiếng Việt, bao gồm làm sạch văn bản, tách câu, tách từ, gán nhãn từ loại và nhận diện thực thể có tên sử dụng spaCy.

## Cài đặt

1. Clone repository:
```
git clone <repository_url>
cd <repository_folder>
```

2. Cài đặt các thư viện phụ thuộc:
```
pip install -r requirements.txt
```

3. **Lưu ý về mô hình tiếng Việt**:
   
   Nếu gặp lỗi "No compatible package found for 'vi_core_news_sm' (spaCy v3.8.x)", hãy cài đặt một trong các mô hình tiếng Việt thay thế:

   ```
   # Mô hình tiếng Việt lớn (được khuyến nghị)
   pip install https://github.com/trungtv/vi_spacy/raw/master/packages/vi_core_news_lg-3.8.0/dist/vi_core_news_lg-3.8.0-py3-none-any.whl
   
   # Hoặc mô hình tiếng Việt trung bình
   pip install https://github.com/trungtv/vi_spacy/raw/master/packages/vi_core_news_md-3.8.0/dist/vi_core_news_md-3.8.0-py3-none-any.whl
   ```

## Tính năng

- Làm sạch văn bản (loại bỏ HTML, URL, email, số điện thoại,...)
- Tách câu (sentence segmentation) với thuật toán tùy chỉnh cho tiếng Việt
- Tách từ (word tokenization)
- Gán nhãn từ loại (part-of-speech tagging)
- Nhận diện thực thể có tên (named entity recognition)
- Phân tích cú pháp phụ thuộc (dependency parsing)
- Sửa lỗi từ viết tắt tiếng Việt
- Loại bỏ stopwords tiếng Việt

## Cách sử dụng

### Chạy demo

Để chạy ứng dụng demo:

```
python example_nlp.py
```

Hoặc bạn cũng có thể chạy trực tiếp tệp text_cleaning.py:

```
python text_cleaning.py
```

### Sử dụng trong code

```python
from text_cleaning import (
    clean_text,
    tokenize_sentences,
    spacy_tokenize_words,
    spacy_tag_parts_of_speech,
    spacy_get_entities,
    spacy_dependency_parse
)

# Văn bản mẫu
text = "Hôm nay trời đẹp quá. Tôi muốn đi dạo trong công viên."

# Làm sạch văn bản
cleaned_text = clean_text(text)

# Tách câu
sentences = tokenize_sentences(cleaned_text)
print(f"Số câu: {len(sentences)}")
print(f"Các câu: {sentences}")

# Tách từ
words = spacy_tokenize_words(cleaned_text)
print(f"Số từ: {len(words)}")
print(f"Các từ: {words}")

# Gán nhãn từ loại
pos_tags = spacy_tag_parts_of_speech(cleaned_text)
print(f"Gán nhãn từ loại: {pos_tags}")

# Nhận diện thực thể có tên
entities = spacy_get_entities(cleaned_text)
print(f"Các thực thể: {entities}")

# Phân tích cú pháp phụ thuộc
dependency_parse = spacy_dependency_parse(cleaned_text)
print(f"Phân tích cú pháp: {dependency_parse}")
```

## Xử lý lỗi

Thư viện được thiết kế để hoạt động ngay cả khi không có mô hình tiếng Việt của spaCy. Trong trường hợp không tìm thấy mô hình, các chức năng sẽ sử dụng các phương pháp xử lý cơ bản thay thế.

### Sự cố phổ biến và cách giải quyết:

1. **"No compatible package found for vi_core_news_sm"**:
   - Cài đặt mô hình thay thế như hướng dẫn trong phần Cài đặt.

2. **"OSError: [E050] Can't find model 'vi_core_news_sm'"**:
   - Một số phiên bản spaCy không tương thích với mô hình vi_core_news_sm. Hãy sử dụng mô hình từ kho lưu trữ của trungtv.

3. **"ValueError: [E003] Model 'vi_core_news_sm' not found"**:
   - Thử cài đặt thủ công: `pip install https://github.com/trungtv/vi_spacy/raw/master/packages/vi_core_news_lg-3.8.0/dist/vi_core_news_lg-3.8.0-py3-none-any.whl`

## API

### `clean_text(text, ...)`

Làm sạch văn bản với nhiều tùy chọn.

**Tham số:**
- `text`: Văn bản cần làm sạch
- `normalize_unicode`: Chuyển đổi Unicode sang dạng chuẩn hóa (mặc định: True)
- `remove_html`: Xóa các thẻ HTML (mặc định: True)
- `remove_urls`: Xóa các đường dẫn URL (mặc định: True)
- `remove_emails`: Xóa các địa chỉ email (mặc định: True)
- `remove_phone_numbers`: Xóa các số điện thoại (mặc định: True)
- `remove_special_chars`: Xóa các ký tự đặc biệt (mặc định: False)
- `custom_special_chars`: Chuỗi các ký tự đặc biệt cần xóa
- `remove_punctuation`: Xóa dấu câu (mặc định: False)
- `remove_digits`: Xóa các chữ số (mặc định: False)
- `lowercase`: Chuyển về chữ thường (mặc định: True)
- `remove_extra_whitespace`: Loại bỏ khoảng trắng thừa (mặc định: True)
- `abbreviation_correction`: Sửa các từ viết tắt (mặc định: False)
- `stopwords_removal`: Loại bỏ các từ dừng (mặc định: False)

**Trả về:**
- Văn bản đã được làm sạch

### `tokenize_sentences(text)`

Phân tách văn bản thành các câu sử dụng thuật toán dựa trên quy tắc đặc biệt cho tiếng Việt.

**Tham số:**
- `text`: Văn bản cần phân tách

**Trả về:**
- Danh sách các câu

**Đặc điểm:**
- Xử lý từ viết tắt tiếng Việt (ví dụ: GS., TS., PGS.,...) để tránh phân tách sai
- Xử lý các đoạn văn có nhiều dấu câu liên tiếp
- Kết hợp các câu ngắn không có dấu kết thúc
- Phát hiện đúng cấu trúc câu tiếng Việt

### `spacy_tokenize_words(text)`

Phân tách văn bản thành các từ sử dụng spaCy.

**Tham số:**
- `text`: Văn bản cần phân tách

**Trả về:**
- Danh sách các từ

### `spacy_tag_parts_of_speech(text)`

Gán nhãn từ loại cho các từ trong văn bản tiếng Việt sử dụng spaCy.

**Tham số:**
- `text`: Văn bản cần gán nhãn

**Trả về:**
- Danh sách các cặp (từ, nhãn từ loại)

### `spacy_get_entities(text)`

Nhận diện thực thể có tên trong văn bản tiếng Việt sử dụng spaCy.

**Tham số:**
- `text`: Văn bản cần nhận diện thực thể

**Trả về:**
- Danh sách các cặp (thực thể, loại thực thể)

### `spacy_dependency_parse(text)`

Phân tích cú pháp phụ thuộc trong văn bản tiếng Việt sử dụng spaCy.

**Tham số:**
- `text`: Văn bản cần phân tích

**Trả về:**
- Cấu trúc cú pháp phụ thuộc

## Thuật toán tách câu

Thuật toán tách câu mới sử dụng phương pháp dựa trên quy tắc với các bước chính:

1. **Xử lý từ viết tắt**: Danh sách từ viết tắt tiếng Việt phổ biến được đánh dấu đặc biệt để tránh nhầm lẫn với dấu kết thúc câu.
2. **Tách câu ban đầu**: Sử dụng biểu thức chính quy để nhận diện dấu kết thúc câu.
3. **Hậu xử lý**: Kết hợp các câu ngắn, phân tích ngữ cảnh để xác định ranh giới câu thực sự.
4. **Xử lý đặc biệt cho tiếng Việt**: Áp dụng các quy tắc phù hợp với cấu trúc ngôn ngữ tiếng Việt.

## Lưu ý

- Chức năng tách câu đã được thay thế bằng thuật toán thuần không sử dụng spaCy, đảm bảo hoạt động tốt ngay cả khi không có mô hình tiếng Việt.
- Các chức năng phân tích khác vẫn sử dụng spaCy khi có thể và tự động chuyển sang phương pháp thay thế khi không có mô hình.
- Mô hình `vi_core_news_lg` có kích thước lớn nhưng độ chính xác cao hơn, phù hợp cho các ứng dụng cần độ chính xác cao.

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo Pull Request hoặc mở Issue nếu bạn có ý tưởng cải thiện thư viện. # NLP
