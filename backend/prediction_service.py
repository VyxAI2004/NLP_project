import os
import joblib
import logging
import numpy as np
from datetime import datetime
from pathlib import Path
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join('backend', 'app.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('prediction_service')

# Định nghĩa các hằng số
MODEL_FOLDER = os.path.join('backend', 'data', 'models')

def find_latest_model(model_category=None):
    """
    Tìm model và vectorizer mới nhất trong thư mục MODEL_FOLDER
    
    Parameters:
    -----------
    model_category : str, optional
        Thể loại mô hình để tìm kiếm trong thư mục con cụ thể
    
    Returns:
    --------
    tuple:
        (model_path, vectorizer_path, model_type) hoặc (None, None, None) nếu không tìm thấy
    """
    try:
        # Đảm bảo thư mục mô hình tồn tại
        if not os.path.exists(MODEL_FOLDER):
            logger.warning(f"Thư mục model không tồn tại: {MODEL_FOLDER}")
            os.makedirs(MODEL_FOLDER, exist_ok=True)
            return None, None, None
        
        # Lấy tất cả các file model
        model_files = []
        
        if model_category:
            # Tìm trong thư mục con của thể loại
            category_folder = os.path.join(MODEL_FOLDER, model_category)
            if not os.path.exists(category_folder):
                logger.warning(f"Thư mục thể loại không tồn tại: {category_folder}")
                os.makedirs(category_folder, exist_ok=True)
                return None, None, None
            
            search_path = category_folder
            logger.info(f"Tìm kiếm mô hình trong thư mục thể loại: {category_folder}")
        else:
            # Tìm trong tất cả các thư mục con
            search_path = MODEL_FOLDER
            logger.info(f"Tìm kiếm mô hình trong thư mục gốc và tất cả thư mục con: {MODEL_FOLDER}")
            
        # Tìm kiếm mô hình
        for root, dirs, files in os.walk(search_path):
            for file in files:
                if file.endswith('_model'):
                    model_path = os.path.join(root, file)
                    model_files.append((model_path, os.path.getmtime(model_path)))
        
        if not model_files:
            if model_category:
                logger.warning(f"Không tìm thấy model nào trong thể loại {model_category}")
            else:
                logger.warning(f"Không tìm thấy model nào trong {MODEL_FOLDER}")
            return None, None, None
        
        # Sắp xếp theo thời gian sửa đổi (mới nhất sau cùng)
        model_files.sort(key=lambda x: x[1])
        latest_model_path = model_files[-1][0]
        
        # Tính toán đường dẫn vectorizer
        model_dir = os.path.dirname(latest_model_path)
        model_base = os.path.basename(latest_model_path).replace('_model', '')
        vectorizer_file = f"{model_base}_vectorizer"
        vectorizer_path = os.path.join(model_dir, vectorizer_file)
        
        if not os.path.exists(vectorizer_path):
            logger.warning(f"Không tìm thấy vectorizer cho model {latest_model_path}")
            return None, None, None
        
        # Xác định model_type từ tên file
        parts = model_base.split('_')
        model_type = parts[0] if parts else "unknown"
        
        # Chuyển đổi từ "naive" thành "naive_bayes" nếu cần
        if model_type == "naive":
            model_type = "naive_bayes"
        
        # Xác định model_category từ đường dẫn
        relative_path = os.path.relpath(latest_model_path, MODEL_FOLDER)
        detected_category = os.path.dirname(relative_path)
        if detected_category == ".":  # Nếu model nằm trực tiếp trong MODEL_FOLDER
            detected_category = "general"
        
        logger.info(f"Tìm thấy model mới nhất: {latest_model_path}")
        logger.info(f"Vectorizer tương ứng: {vectorizer_path}")
        logger.info(f"Loại model: {model_type}")
        logger.info(f"Thể loại model: {detected_category}")
        
        return latest_model_path, vectorizer_path, model_type
    
    except Exception as e:
        logger.error(f"Lỗi khi tìm model mới nhất: {str(e)}")
        return None, None, None

def load_model(model_path, vectorizer_path):
    """
    Tải model và vectorizer từ đường dẫn
    
    Parameters:
    -----------
    model_path : str
        Đường dẫn đến file model
    vectorizer_path : str
        Đường dẫn đến file vectorizer
    
    Returns:
    --------
    tuple:
        (model, vectorizer) hoặc (None, None) nếu xảy ra lỗi
    """
    try:
        # Kiểm tra file tồn tại
        if not os.path.exists(model_path):
            logger.error(f"File model không tồn tại: {model_path}")
            return None, None
        
        if not os.path.exists(vectorizer_path):
            logger.error(f"File vectorizer không tồn tại: {vectorizer_path}")
            return None, None
        
        # Tải model và vectorizer
        logger.info(f"Đang tải model: {model_path}")
        model = joblib.load(model_path)
        
        logger.info(f"Đang tải vectorizer: {vectorizer_path}")
        vectorizer = joblib.load(vectorizer_path)
        
        return model, vectorizer
    
    except Exception as e:
        logger.error(f"Lỗi khi tải model và vectorizer: {str(e)}")
        return None, None

def predict_text(text, model, vectorizer, clean_text_func=None):
    """
    Dự đoán nhãn cho văn bản
    
    Parameters:
    -----------
    text : str
        Văn bản cần dự đoán
    model : object
        Mô hình đã được huấn luyện
    vectorizer : object
        Vectorizer đã được huấn luyện
    clean_text_func : callable, optional
        Hàm làm sạch văn bản (nếu cần)
    
    Returns:
    --------
    dict:
        Kết quả dự đoán bao gồm nhãn và xác suất
    """
    try:
        start_time = datetime.now()
        
        # Làm sạch văn bản nếu cần
        if clean_text_func and callable(clean_text_func):
            text = clean_text_func(text)
            logger.info("Đã làm sạch văn bản trước khi dự đoán")
        
        # Vector hóa văn bản
        text_vector = vectorizer.transform([text])
        
        # Dự đoán nhãn
        predicted_label = model.predict(text_vector)[0]
        
        # Lấy xác suất cho từng nhãn (nếu model hỗ trợ)
        probabilities = {}
        try:
            # Lấy xác suất dự đoán cho từng lớp
            proba = model.predict_proba(text_vector)[0]
            for i, label in enumerate(model.classes_):
                probabilities[str(label)] = float(proba[i])
        except (AttributeError, NotImplementedError):
            logger.warning("Model không hỗ trợ dự đoán xác suất")
            # Nếu không dự đoán được xác suất, thiết lập 100% cho nhãn được dự đoán
            for label in model.classes_:
                probabilities[str(label)] = 1.0 if label == predicted_label else 0.0
        
        # Tính thời gian xử lý
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "predicted_label": str(predicted_label),
            "probabilities": probabilities,
            "processing_time": processing_time
        }
    
    except Exception as e:
        logger.error(f"Lỗi khi dự đoán văn bản: {str(e)}")
        raise

def predict_with_latest_model(text, clean_text_func=None, model_category=None):
    """
    Dự đoán nhãn cho văn bản bằng model mới nhất
    
    Parameters:
    -----------
    text : str
        Văn bản cần dự đoán
    clean_text_func : callable, optional
        Hàm làm sạch văn bản (nếu cần)
    model_category : str, optional
        Thể loại mô hình để sử dụng
    
    Returns:
    --------
    dict:
        Kết quả dự đoán hoặc thông báo lỗi
    """
    try:
        # Tìm model mới nhất
        model_path, vectorizer_path, model_type = find_latest_model(model_category)
        
        if not model_path or not vectorizer_path:
            return {
                'status': 'error',
                'message': f"Không tìm thấy model{'trong thể loại ' + model_category if model_category else ''}"
            }
        
        # Tải model và vectorizer
        model, vectorizer = load_model(model_path, vectorizer_path)
        
        if not model or not vectorizer:
            return {
                'status': 'error',
                'message': 'Không thể tải model hoặc vectorizer'
            }
        
        # Dự đoán nhãn
        result = predict_text(text, model, vectorizer, clean_text_func)
        
        # Lấy thể loại từ đường dẫn
        category = os.path.dirname(os.path.relpath(model_path, MODEL_FOLDER)) if model_path else "unknown"
        if category == ".":  # Nếu model nằm trực tiếp trong MODEL_FOLDER
            category = "general"
        
        return {
            'status': 'success',
            'original_text': text,
            'predicted_label': result["predicted_label"],
            'probabilities': result["probabilities"],
            'model_type': model_type,
            'model_category': category,
            'processing_time': result["processing_time"]
        }
    
    except Exception as e:
        logger.error(f"Lỗi khi dự đoán với model mới nhất: {str(e)}")
        return {
            'status': 'error',
            'message': f'Lỗi khi dự đoán: {str(e)}'
        } 