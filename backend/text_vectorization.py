import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from tabulate import tabulate
import logging
import re
from typing import Dict, List, Any, Tuple, Optional
from sklearn.preprocessing import OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer

# Import từ module text_cleaning để sử dụng các hàm làm sạch và chuẩn bị văn bản
from backend.text_cleaning import (
    clean_text, tokenize_words, spacy_tokenize_words, 
    remove_stopwords, logger as cleaning_logger
)

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/vectorization.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('text_vectorization')

# Thêm class TextVectorizer để giữ tương thích với app.py
class TextVectorizer:
    
    def __init__(self):
        """Khởi tạo vectorizer"""
        self.vocab = {}  # Từ điển ánh xạ từ -> index
        self.index_to_word = {}  # Từ điển ánh xạ index -> từ
        self.vocab_size = 0
        self.word_pattern = re.compile(r'\b\w+\b|[^\w\s]')
        self._encoder = None
        self._count_vectorizer = None
        self._tfidf_vectorizer = None
    
    def fit(self, texts: List[str], min_word_count: int = 1):

        self.vocab = {}
        self.index_to_word = {}
        
        # Đếm tần suất xuất hiện của mỗi từ
        word_counts = {}
        
        for text in texts:
            # Chuẩn hóa và tách từ
            tokens = self._tokenize(text)
            for token in tokens:
                word_counts[token] = word_counts.get(token, 0) + 1
        
        # Xây dựng từ điển từ các từ đủ điều kiện
        idx = 0
        for word, count in word_counts.items():
            if count >= min_word_count:
                self.vocab[word] = idx
                self.index_to_word[idx] = word
                idx += 1
        
        self.vocab_size = len(self.vocab)
        logger.info(f"Đã xây dựng từ điển với {self.vocab_size} từ")
        
        # Khởi tạo và huấn luyện các vectorizer nếu cần
        self._initialize_vectorizers(texts)
    
    def _initialize_vectorizers(self, texts: List[str]):

        # Chuẩn bị dữ liệu
        clean_texts = [clean_text(text, remove_special_chars=True, lowercase=True) for text in texts]
        
        # Khởi tạo CountVectorizer
        self._count_vectorizer = CountVectorizer()
        self._count_vectorizer.fit(clean_texts)
        
        # Khởi tạo TfidfVectorizer
        self._tfidf_vectorizer = TfidfVectorizer()
        self._tfidf_vectorizer.fit(clean_texts)
    
    def _tokenize(self, text: str) -> List[str]:

        if not text:
            return []
        
        # Chuẩn hóa văn bản
        text = text.lower()
        
        # Tách từ
        tokens = self.word_pattern.findall(text)
        return [token for token in tokens if token.strip()]
    
    def get_onehot_vector(self, text: str) -> List[List[int]]:

        # Sử dụng hàm one_hot_encode bên ngoài
        result = one_hot_encode(text, display_table=False)
        return result["one_hot_matrix"].tolist()
    
    def get_bow_vector(self, text: str) -> List[int]:

        # Sử dụng hàm count_vectorize bên ngoài
        result = count_vectorize(text, display_table=False)
        return result["count_matrix"].tolist()[0]
    
    def get_binary_bow_vector(self, text: str) -> List[int]:

        # Lấy vector BoW và chuyển thành dạng binary (0 hoặc 1)
        bow_vector = self.get_bow_vector(text)
        return [1 if count > 0 else 0 for count in bow_vector]
    
    def get_tfidf_vector(self, text: str) -> List[float]:

        # Sử dụng hàm tfidf_vectorize bên ngoài
        result = tfidf_vectorize(text, display_table=False)
        return result["tfidf_matrix"].tolist()[0]
    
    def visualize_vectors(self, text: str, vector_type: str = "onehot"):

        if vector_type == "onehot":
            visualize_one_hot_encoding(text, custom_sentence=True)
        elif vector_type == "bow":
            count_vectorize(text, display_table=True)
        elif vector_type == "tfidf":
            tfidf_vectorize(text, display_table=True)
        elif vector_type == "binary_bow":
            binary_vector = self.get_binary_bow_vector(text)
            print("\n===== BINARY BAG OF WORDS =====")
            print(binary_vector)
            print("==============================\n")
        else:
            logger.warning(f"Không hỗ trợ loại vector: {vector_type}")

def one_hot_encode(text: str, display_table: bool = True) -> Dict[str, Any]:
    try:
        # Làm sạch văn bản và tách từ
        cleaned_text = clean_text(text, remove_special_chars=True, lowercase=True)
        words = tokenize_words(cleaned_text)
        
        # Chuẩn bị dữ liệu cho one-hot encoding
        # Mỗi từ là một mẫu
        X = np.array(words).reshape(-1, 1)
        
        # Tạo và huấn luyện OneHotEncoder
        encoder = OneHotEncoder(sparse_output=False)
        one_hot_matrix = encoder.fit_transform(X)
        
        # Lấy danh sách các đặc trưng (feature names)
        feature_names = encoder.get_feature_names_out()
        
        # Tạo DataFrame để hiển thị kết quả
        df = pd.DataFrame(one_hot_matrix, columns=feature_names)
        df.insert(0, 'Word', words)  # Thêm cột từ vào đầu DataFrame
        
        # Hiển thị bảng kết quả
        if display_table:
            # Hiển thị bảng bằng tabulate
            table = tabulate(df, headers='keys', tablefmt='pretty', showindex=False)
            print("\n===== ONE-HOT ENCODING =====")
            print(table)
            print("============================\n")
            
            # Hiển thị bảng bằng matplotlib (tương tự như trong hình)
            plt.figure(figsize=(10, 6))
            plt.imshow(one_hot_matrix, aspect='auto', cmap='Blues')
            plt.colorbar()
            plt.title('One Hot Encoding')
            plt.xlabel('Feature Index')
            plt.ylabel('Word Index')
            plt.tight_layout()
            plt.show()
        
        # Trả về kết quả
        return {
            "original_text": text,
            "words": words,
            "one_hot_matrix": one_hot_matrix,
            "feature_names": feature_names,
            "dataframe": df
        }
    
    except Exception as e:
        logger.error(f"Lỗi khi thực hiện one-hot encoding: {str(e)}")
        return {
            "status": "error",
            "error_message": str(e),
            "original_text": text
        }

def visualize_one_hot_encoding(text: str, custom_sentence: bool = False) -> None:
    try:
        if custom_sentence:
            # Sử dụng văn bản người dùng nhập vào
            result = one_hot_encode(text, display_table=False)
            
            # Hiển thị bảng
            df = result["dataframe"]
            
            # Hiển thị bảng trong cửa sổ mới
            plt.figure(figsize=(12, 6))
            ax = plt.subplot(111, frame_on=False)
            ax.xaxis.set_visible(False)
            ax.yaxis.set_visible(False)
            
            # Tạo bảng với matplotlib
            table = plt.table(
                cellText=df.values,
                colLabels=df.columns,
                cellLoc='center',
                loc='center',
                cellColours=plt.cm.Blues(np.ones((len(df), len(df.columns)))*0.1)
            )
            
            # Tùy chỉnh bảng
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            table.scale(1.2, 1.2)
            
            plt.title('One Hot Encoding')
            plt.tight_layout()
            plt.show()
        else:
            # Tạo một ví dụ đơn giản như trong hình
            example = "Hello, I'm Ironman. I have Friday AI"
            words = ["AI", "Ironman", "Friday", "have", "Hello", "I", "I'm"]
            
            # Tạo ma trận one-hot encoding mẫu
            matrix = np.zeros((len(words), len(words)))
            for i in range(len(words)):
                matrix[i, i] = 1
                
            # Tạo DataFrame
            df = pd.DataFrame(matrix, columns=words)
            df.insert(0, 'Word', words)
            
            # Hiển thị bảng trong cửa sổ mới
            plt.figure(figsize=(12, 6))
            ax = plt.subplot(111, frame_on=False)
            ax.xaxis.set_visible(False)
            ax.yaxis.set_visible(False)
            
            # Tạo bảng với matplotlib
            table = plt.table(
                cellText=df.values,
                colLabels=df.columns,
                cellLoc='center',
                loc='center',
                cellColours=plt.cm.Blues(np.ones((len(df), len(df.columns)))*0.1)
            )
            
            # Tùy chỉnh bảng
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            table.scale(1.2, 1.2)
            
            # Thêm mũi tên và văn bản vào hình
            plt.figtext(0.1, 0.4, "Hello, I'm Ironman. I have Friday AI", fontsize=10, ha='left')
            plt.figtext(0.38, 0.4, "→", fontsize=20, ha='center')
            plt.figtext(0.4, 0.4, "One Hot Encoding", fontsize=10, ha='left')
            
            plt.title('One Hot Encoding Example')
            plt.tight_layout()
            plt.show()
    
    except Exception as e:
        logger.error(f"Lỗi khi hiển thị one-hot encoding: {str(e)}")
        print(f"Lỗi: {str(e)}")

def count_vectorize(text: str, display_table: bool = True) -> Dict[str, Any]:

    try:
        # Làm sạch văn bản
        cleaned_text = clean_text(text, remove_special_chars=True, lowercase=True)
        
        # Tách câu để tạo corpus
        sentences = [cleaned_text]  # Với một văn bản, corpus chỉ có một phần tử
        
        # Tạo và huấn luyện CountVectorizer
        vectorizer = CountVectorizer()
        count_matrix = vectorizer.fit_transform(sentences)
        
        # Lấy danh sách các đặc trưng (feature names)
        feature_names = vectorizer.get_feature_names_out()
        
        # Chuyển đổi ma trận thưa thành mảng numpy
        count_array = count_matrix.toarray()
        
        # Tạo DataFrame để hiển thị kết quả
        df = pd.DataFrame(count_array, columns=feature_names)
        
        # Hiển thị bảng kết quả
        if display_table:
            # Hiển thị bảng bằng tabulate
            table = tabulate(df, headers='keys', tablefmt='pretty', showindex=False)
            print("\n===== COUNT VECTORIZATION (BAG OF WORDS) =====")
            print(table)
            print("============================================\n")
            
            # Hiển thị bảng bằng matplotlib
            plt.figure(figsize=(10, 6))
            plt.imshow(count_array, aspect='auto', cmap='Oranges')
            plt.colorbar()
            plt.title('Count Vectorization (Bag of Words)')
            plt.xlabel('Feature Index')
            plt.ylabel('Document Index')
            plt.xticks(range(len(feature_names)), feature_names, rotation=90)
            plt.tight_layout()
            plt.show()
        
        # Trả về kết quả
        return {
            "original_text": text,
            "count_matrix": count_array,
            "feature_names": feature_names,
            "dataframe": df
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi thực hiện count vectorization: {str(e)}")
        return {
            "status": "error",
            "error_message": str(e),
            "original_text": text
        }

def tfidf_vectorize(text: str, display_table: bool = True) -> Dict[str, Any]:

    try:
        # Làm sạch văn bản
        cleaned_text = clean_text(text, remove_special_chars=True, lowercase=True)
        
        # Tách câu để tạo corpus
        sentences = [cleaned_text]  # Với một văn bản, corpus chỉ có một phần tử
        
        # Tạo và huấn luyện TfidfVectorizer
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(sentences)
        
        # Lấy danh sách các đặc trưng (feature names)
        feature_names = vectorizer.get_feature_names_out()
        
        # Chuyển đổi ma trận thưa thành mảng numpy
        tfidf_array = tfidf_matrix.toarray()
        
        # Tạo DataFrame để hiển thị kết quả
        df = pd.DataFrame(tfidf_array, columns=feature_names)
        
        # Hiển thị bảng kết quả
        if display_table:
            # Hiển thị bảng bằng tabulate
            table = tabulate(df, headers='keys', tablefmt='pretty', showindex=False)
            print("\n===== TF-IDF VECTORIZATION =====")
            print(table)
            print("==============================\n")
            
            # Hiển thị bảng bằng matplotlib
            plt.figure(figsize=(10, 6))
            plt.imshow(tfidf_array, aspect='auto', cmap='Greens')
            plt.colorbar()
            plt.title('TF-IDF Vectorization')
            plt.xlabel('Feature Index')
            plt.ylabel('Document Index')
            plt.xticks(range(len(feature_names)), feature_names, rotation=90)
            plt.tight_layout()
            plt.show()
        
        # Trả về kết quả
        return {
            "original_text": text,
            "tfidf_matrix": tfidf_array,
            "feature_names": feature_names,
            "dataframe": df
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi thực hiện TF-IDF vectorization: {str(e)}")
        return {
            "status": "error",
            "error_message": str(e),
            "original_text": text
        }

# Thêm mã thực thi khi file được chạy trực tiếp
if __name__ == "__main__":
    # Ví dụ văn bản để demo
    example_text = "Hello, I'm Ironman. I have Friday AI"
    
    print("\n=== DEMO VECTOR HÓA VĂN BẢN ===\n")
    
    # Demo One-Hot Encoding
    print("\n--- Demo One-Hot Encoding ---")
    visualize_one_hot_encoding("", custom_sentence=False)
    
    # Cho phép người dùng nhập văn bản để xử lý
    print("\n\nNhập văn bản để vector hóa (nhập 'exit' để thoát):")
    while True:
        user_input = input("\nVăn bản: ")
        if user_input.lower() == 'exit':
            break
        
        if not user_input.strip():
            print("Vui lòng nhập văn bản!")
            continue
        
        # Hiển thị menu lựa chọn phương pháp vector hóa
        print("\nChọn phương pháp vector hóa:")
        print("1. One-Hot Encoding")
        print("2. Count Vectorization (Bag of Words)")
        print("3. TF-IDF Vectorization")
        print("4. Tất cả các phương pháp")
        
        choice = input("Lựa chọn (1-4): ")
        
        if choice == '1':
            one_hot_encode(user_input, display_table=True)
        elif choice == '2':
            count_vectorize(user_input, display_table=True)
        elif choice == '3':
            tfidf_vectorize(user_input, display_table=True)
        elif choice == '4':
            print("\n--- One-Hot Encoding ---")
            one_hot_encode(user_input, display_table=True)
            print("\n--- Count Vectorization ---")
            count_vectorize(user_input, display_table=True)
            print("\n--- TF-IDF Vectorization ---")
            tfidf_vectorize(user_input, display_table=True)
        else:
            print("Lựa chọn không hợp lệ!")
