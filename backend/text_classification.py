from __future__ import print_function
import os
import joblib
import logging
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, precision_score, recall_score, f1_score
from sklearn import metrics
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import GradientBoostingClassifier

from backend.text_cleaning import clean_text

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/classification.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('text_classification')

class TextClassifier:
    """
    Lớp xử lý phân loại văn bản sử dụng các thuật toán khác nhau
    """
    
    def __init__(self, model_type='naive_bayes', max_features=5000, n_neighbors=5, 
                 nn_hidden_layers=1, nn_neurons_per_layer=32,
                 gb_n_estimators=100, gb_learning_rate=0.1,
                 svm_kernel='linear', svm_c=1.0):
        """
        Khởi tạo bộ phân loại văn bản
        
        Parameters:
        -----------
        model_type : str
            Loại mô hình phân loại ('naive_bayes', 'logistic_regression', 'svm', etc.)
        max_features : int
            Số lượng đặc trưng tối đa khi vector hóa văn bản
        n_neighbors : int
            Số lượng láng giềng gần nhất cho KNeighborsClassifier
        nn_hidden_layers : int
            Số lớp ẩn cho Neural Network
        nn_neurons_per_layer : int
            Số nơ-ron trên mỗi lớp ẩn của Neural Network
        gb_n_estimators : int
            Số ước lượng cho Gradient Boosting
        gb_learning_rate : float
            Tốc độ học cho Gradient Boosting
        svm_kernel : str
            Loại kernel cho SVM ('linear', 'rbf', 'poly')
        svm_c : float
            Hệ số C cho SVM (điều chỉnh mức độ phạt lỗi)
        """
        self.model_type = model_type
        self.max_features = max_features
        self.vectorizer = None
        self.model = None
        
        # Khởi tạo mô hình dựa trên loại
        if model_type == 'naive_bayes':
            self.model = MultinomialNB()
        elif model_type == 'logistic_regression':
            self.model = LogisticRegression(max_iter=1000, solver='liblinear')
        elif model_type == 'svm':
            self.model = SVC(kernel=svm_kernel, C=svm_c, probability=True)
        elif model_type == 'knn':
            self.model = KNeighborsClassifier(n_neighbors=n_neighbors)
        elif model_type == 'decision_tree':
            self.model = DecisionTreeClassifier()
        elif model_type == 'neural_network':
            # Tạo cấu trúc lớp ẩn dựa trên tham số đầu vào
            hidden_layer_sizes = tuple([nn_neurons_per_layer] * nn_hidden_layers)
            self.model = MLPClassifier(hidden_layer_sizes=hidden_layer_sizes, max_iter=1000, random_state=42)
        elif model_type == 'gradient_boosting':
            self.model = GradientBoostingClassifier(
                n_estimators=gb_n_estimators, 
                learning_rate=gb_learning_rate, 
                random_state=42
            )
        else:
            # Mặc định là Naive Bayes nếu loại không hợp lệ
            logger.warning(f"Loại mô hình {model_type} không được hỗ trợ. Sử dụng Naive Bayes.")
            self.model = MultinomialNB()
    
    def _create_vectorizer(self, vectorization_method='bow', ngram_range=None):
        """
        Tạo đối tượng vector hóa dựa trên phương pháp
        
        Parameters:
        -----------
        vectorization_method : str
            Phương pháp vector hóa ('onehot', 'bow', 'tfidf', 'ngrams')
        ngram_range : tuple
            Phạm vi n-gram, ví dụ (1, 3) cho unigram đến trigram
        
        Returns:
        --------
        vectorizer : object
            Đối tượng vector hóa
        """
        if ngram_range is None:
            ngram_range = (1, 1)
        
        if vectorization_method == 'tfidf':
            return TfidfVectorizer(max_features=self.max_features, ngram_range=ngram_range)
        elif vectorization_method == 'ngrams':
            return CountVectorizer(max_features=self.max_features, ngram_range=ngram_range)
        elif vectorization_method == 'onehot':
            return CountVectorizer(max_features=self.max_features, binary=True)
        else:  # mặc định là 'bow'
            return CountVectorizer(max_features=self.max_features)
    
    def train_from_file(self, file_path, text_column='review', label_column='sentiment', test_size=0.2, random_state=42, vectorization_method='bow', ngram_range=None, progress_callback=None):
        """
        Huấn luyện mô hình từ file
        
        Parameters:
        -----------
        file_path : str
            Đường dẫn đến file dữ liệu (CSV)
        text_column : str
            Tên cột chứa văn bản
        label_column : str
            Tên cột chứa nhãn
        test_size : float
            Tỷ lệ dữ liệu dành cho tập kiểm thử (0-1)
        random_state : int
            Giá trị để tái tạo kết quả phân chia dữ liệu
        vectorization_method : str
            Phương pháp vector hóa ('bow', 'tfidf', 'ngrams')
        ngram_range : tuple
            Phạm vi n-gram, ví dụ (1, 3) cho unigram đến trigram
        progress_callback : function
            Callback để cập nhật tiến trình, nhận 3 tham số: status, message, progress_pct (0-100)
            
        Returns:
        --------
        dict
            Kết quả huấn luyện bao gồm các chỉ số đánh giá
        """
        try:
            # Đọc dữ liệu
            start_time = datetime.now()
            
            if progress_callback:
                progress_callback("processing", "Đang đọc dữ liệu từ file...", 0)
            
            df = pd.read_csv(file_path)
            
            if text_column not in df.columns:
                raise ValueError(f"Không tìm thấy cột '{text_column}' trong dữ liệu")
            
            if label_column not in df.columns:
                raise ValueError(f"Không tìm thấy cột '{label_column}' trong dữ liệu")
            
            # Chuẩn bị dữ liệu
            logger.info(f"Chuẩn bị dữ liệu từ {file_path}...")
            if progress_callback:
                progress_callback("processing", "Đang chuẩn bị dữ liệu...", 20)
                
            X = df[text_column].values
            y = df[label_column].values
            
            # Lọc bỏ các giá trị NaN trong dữ liệu
            valid_indices = []
            for i, (text, label) in enumerate(zip(X, y)):
                if pd.notna(text) and pd.notna(label) and isinstance(text, str):
                    valid_indices.append(i)
            
            if len(valid_indices) < len(X):
                logger.warning(f"Đã lọc bỏ {len(X) - len(valid_indices)} dòng có giá trị NaN hoặc không hợp lệ")
                X = X[valid_indices]
                y = y[valid_indices]
                
                if progress_callback:
                    progress_callback("processing", f"Đã lọc bỏ {len(X) - len(valid_indices)} dòng có giá trị NaN hoặc không hợp lệ", 30)
            
            if len(X) == 0:
                raise ValueError("Không có dữ liệu hợp lệ sau khi lọc các giá trị NaN")
            
            # Chia dữ liệu thành tập huấn luyện và kiểm thử
            if progress_callback:
                progress_callback("processing", "Đang chia dữ liệu thành tập huấn luyện và kiểm thử...", 40)
                
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
            
            # Tạo bộ vector hóa
            self.vectorizer = self._create_vectorizer(vectorization_method, ngram_range)
            
            # Chuyển đổi văn bản thành vectơ đặc trưng
            logger.info(f"Vector hóa văn bản với phương pháp {vectorization_method}...")
            if progress_callback:
                progress_callback("processing", f"Đang vector hóa văn bản với phương pháp {vectorization_method}...", 50)
                
            X_train_vec = self.vectorizer.fit_transform(X_train)
            X_test_vec = self.vectorizer.transform(X_test)
            
            # Huấn luyện mô hình
            logger.info(f"Huấn luyện mô hình {self.model_type}...")
            if progress_callback:
                progress_callback("processing", f"Đang huấn luyện mô hình {self.model_type}...", 70)
                
            self.model.fit(X_train_vec, y_train)
            
            # Dự đoán trên tập kiểm thử
            if progress_callback:
                progress_callback("processing", "Đang đánh giá mô hình trên tập kiểm thử...", 80)
                
            y_pred = self.model.predict(X_test_vec)
            
            # Tính xác suất dự đoán nếu mô hình hỗ trợ
            probabilities = None
            try:
                y_prob = self.model.predict_proba(X_test_vec)
                probabilities = y_prob
            except:
                logger.warning(f"Mô hình {self.model_type} không hỗ trợ predict_proba")
            
            # Đánh giá mô hình
            if progress_callback:
                progress_callback("processing", "Đang tính toán các chỉ số đánh giá...", 90)
                
            accuracy = metrics.accuracy_score(y_test, y_pred)
            precision = metrics.precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = metrics.recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = metrics.f1_score(y_test, y_pred, average='weighted', zero_division=0)
            
            # Tính ma trận nhầm lẫn
            conf_matrix = metrics.confusion_matrix(y_test, y_pred)
            
            # Lấy danh sách nhãn duy nhất
            unique_labels = np.unique(y)
            
            # Tổng thời gian huấn luyện
            training_time = (datetime.now() - start_time).total_seconds()
            
            if progress_callback:
                progress_callback("completed", "Huấn luyện mô hình hoàn tất!", 100)
                
            # Trả về kết quả
            return {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'confusion_matrix': conf_matrix.tolist(),
                'labels': unique_labels.tolist(),
                'train_samples': X_train.shape[0],
                'test_samples': X_test.shape[0],
                'feature_count': X_train_vec.shape[1],
                'training_time': training_time
            }
            
        except Exception as e:
            logger.error(f"Lỗi khi huấn luyện mô hình từ file: {str(e)}")
            if progress_callback:
                progress_callback("error", f"Lỗi: {str(e)}", 0)
            raise
    
    def predict(self, text):
        """
        Dự đoán nhãn cho văn bản
        
        Parameters:
        -----------
        text : str hoặc list
            Văn bản cần dự đoán hoặc danh sách các văn bản
        
        Returns:
        --------
        dict
            Kết quả dự đoán bao gồm nhãn và xác suất
        """
        if self.model is None or self.vectorizer is None:
            raise ValueError("Mô hình chưa được huấn luyện hoặc tải")
        
        # Xử lý đầu vào là một văn bản hoặc danh sách văn bản
        single_input = False
        if isinstance(text, str):
            text = [text]
            single_input = True
        
        # Chuyển đổi văn bản thành vectơ đặc trưng
        X_vec = self.vectorizer.transform(text)
        
        # Dự đoán
        y_pred = self.model.predict(X_vec)
        
        # Lấy xác suất dự đoán nếu mô hình hỗ trợ
        probabilities = {}
        try:
            y_prob = self.model.predict_proba(X_vec)
            
            # Lấy tên các lớp
            classes = self.model.classes_
            
            # Chuyển đổi xác suất thành từ điển
            if single_input:
                for i, cls in enumerate(classes):
                    probabilities[cls] = float(y_prob[0][i])
            else:
                probabilities = [
                    {cls: float(prob[i]) for i, cls in enumerate(classes)}
                    for prob in y_prob
                ]
        except:
            logger.warning(f"Mô hình {self.model_type} không hỗ trợ predict_proba")
        
        # Trả về kết quả
        if single_input:
            return {
                'predicted_label': y_pred[0],
                'probabilities': probabilities
            }
        else:
            return [{
                'predicted_label': label,
                'probabilities': probs if probabilities else {}
            } for label, probs in zip(y_pred, probabilities if probabilities else [{}] * len(y_pred))]
    
    def save_model(self, model_path='model', vectorizer_path='vectorizer'):
        """
        Lưu mô hình và vector hóa
        
        Parameters:
        -----------
        model_path : str
            Đường dẫn để lưu mô hình
        vectorizer_path : str
            Đường dẫn để lưu vector hóa
        """
        if self.model is None or self.vectorizer is None:
            raise ValueError("Mô hình chưa được huấn luyện")
        
        try:
            # Tạo thư mục nếu chưa tồn tại
            model_dir = os.path.dirname(model_path)
            if model_dir and not os.path.exists(model_dir):
                os.makedirs(model_dir)
                
            vectorizer_dir = os.path.dirname(vectorizer_path)
            if vectorizer_dir and not os.path.exists(vectorizer_dir):
                os.makedirs(vectorizer_dir)
            
            # Lưu mô hình và vector hóa
            joblib.dump(self.model, model_path)
            joblib.dump(self.vectorizer, vectorizer_path)
            
            logger.info(f"Đã lưu mô hình: {model_path}")
            logger.info(f"Đã lưu vector hóa: {vectorizer_path}")
            
            return True
        except Exception as e:
            logger.error(f"Lỗi khi lưu mô hình: {str(e)}")
            raise
    
    def load_model(self, model_path='model', vectorizer_path='vectorizer'):
        """
        Tải mô hình và vector hóa
        
        Parameters:
        -----------
        model_path : str
            Đường dẫn đến mô hình
        vectorizer_path : str
            Đường dẫn đến vector hóa
        
        Returns:
        --------
        bool
            True nếu tải thành công
        """
        try:
            # Kiểm tra sự tồn tại của các file
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Không tìm thấy file mô hình: {model_path}")
            
            if not os.path.exists(vectorizer_path):
                raise FileNotFoundError(f"Không tìm thấy file vector hóa: {vectorizer_path}")
            
            # Tải mô hình và vector hóa
            self.model = joblib.load(model_path)
            self.vectorizer = joblib.load(vectorizer_path)
            
            logger.info(f"Đã tải mô hình: {model_path}")
            logger.info(f"Đã tải vector hóa: {vectorizer_path}")
            
            return True
        except Exception as e:
            logger.error(f"Lỗi khi tải mô hình: {str(e)}")
            raise 