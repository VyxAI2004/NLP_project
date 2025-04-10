#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Ứng dụng web đơn giản để xử lý văn bản tiếng Việt
"""

import os
import sys
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import traceback
import time
import nltk
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
import re
import pandas as pd
import numpy as np

# Import các module đã viết
from backend.crawler_synonyms import SynonymsCrawler
from backend.data_augmentation import (
    replace_with_synonyms, load_synonyms_cache, save_synonyms_cache,
    add_random_words, swap_words, delete_words, create_augmented_samples
)
from backend.text_cleaning import clean_text, process_text_as_json, process_request, tokenize_sentences, tokenize_words, tag_parts_of_speech, parse_syntax
from backend.text_vectorization import TextVectorizer, one_hot_encode, count_vectorize, tfidf_vectorize
from backend.file_processor import FileProcessor
from backend.text_classification import TextClassifier
from backend.prediction_service import find_latest_model

# Văn bản mẫu cho các danh mục
SAMPLE_TEXTS = {
    # Văn bản tích cực
    'tích_cực': """Tôi cảm thấy thật hạnh phúc và biết ơn vì những điều tuyệt vời trong cuộc sống. Hôm nay, tôi nhận được tin vui về việc đậu kỳ thi quan trọng. Đồng nghiệp và bạn bè đã gửi lời chúc mừng nồng nhiệt và tổ chức một buổi tiệc nhỏ để ăn mừng. Nụ cười của mọi người làm tôi cảm thấy được yêu thương và trân trọng. Tôi tin rằng với sự nỗ lực và quyết tâm, chúng ta có thể vượt qua mọi khó khăn và đạt được những điều mình mong muốn. Cuộc sống luôn tràn ngập cơ hội tốt đẹp nếu chúng ta biết trân trọng những gì mình có và luôn hướng về phía trước với niềm lạc quan.""",

    # Văn bản tiêu cực
    'tiêu_cực': """Tôi cảm thấy thật thất vọng và chán nản với tình hình hiện tại. Mọi thứ dường như không diễn ra theo kế hoạch, và tôi liên tục gặp phải những trở ngại không mong muốn. Thời tiết xấu kéo dài làm hỏng chuyến đi mà tôi đã lên kế hoạch từ lâu. Công việc ngày càng căng thẳng với áp lực từ cấp trên và deadline dồn dập. Tôi cảm thấy kiệt sức và không còn động lực để tiếp tục. Những nỗ lực của tôi không được ghi nhận đúng mức, và điều đó thật sự làm tôi buồn lòng. Tôi không biết khi nào tình hình sẽ cải thiện và liệu mọi thứ có tốt hơn không.""",

    # Văn bản công nghệ
    'công_nghệ': """Trí tuệ nhân tạo (AI) đang phát triển với tốc độ chóng mặt và mang lại những thay đổi đáng kể cho cuộc sống hàng ngày của chúng ta. Các mô hình ngôn ngữ lớn như GPT-4 và Claude có khả năng tạo ra nội dung, trả lời câu hỏi và thậm chí viết code với độ chính xác đáng kinh ngạc. Công nghệ điện toán đám mây đã cách mạng hóa cách doanh nghiệp lưu trữ và quản lý dữ liệu, giúp tiết kiệm chi phí và tăng tính linh hoạt. Đồng thời, Internet of Things (IoT) kết nối hàng tỷ thiết bị trên toàn cầu, tạo ra một mạng lưới thông minh có khả năng thu thập và phân tích dữ liệu theo thời gian thực. Tuy nhiên, sự phát triển nhanh chóng của công nghệ cũng đặt ra nhiều thách thức về bảo mật, quyền riêng tư và đạo đức.""",

    # Văn bản thể thao
    'thể_thao': """Trận chung kết giải bóng đá vô địch quốc gia vừa diễn ra với không khí vô cùng sôi động. Đội chủ nhà đã thể hiện phong độ xuất sắc với lối chơi tấn công đầy tốc độ và kỹ thuật. Tiền đạo ngôi sao đã ghi một cú hat-trick ấn tượng, đưa đội nhà vượt lên dẫn trước đối thủ. Dù đội khách có những phản công sắc bén và ghi được 2 bàn thắng, nhưng họ vẫn không thể san bằng tỷ số. Các cổ động viên đã cổ vũ nhiệt tình suốt 90 phút thi đấu, tạo nên bầu không khí cuồng nhiệt trên khán đài. Sau trận đấu, HLV trưởng của đội chiến thắng đã dành những lời khen ngợi cho tinh thần thi đấu và sự đoàn kết của các cầu thủ.""",

    # Văn bản kinh tế
    'kinh_tế': """Thị trường chứng khoán toàn cầu đang trải qua giai đoạn biến động mạnh do ảnh hưởng từ chính sách tiền tệ thắt chặt của các ngân hàng trung ương và lo ngại về lạm phát gia tăng. Chỉ số VN-Index giảm hơn 2% trong phiên giao dịch hôm qua, theo xu hướng chung của thị trường châu Á. Các chuyên gia kinh tế dự báo tăng trưởng GDP của Việt Nam năm nay có thể đạt 6.5%, thấp hơn mục tiêu đề ra nhưng vẫn là mức khả quan trong bối cảnh kinh tế toàn cầu đầy thách thức. Trong khi đó, ngành bán lẻ đang phục hồi tích cực với doanh số tăng 12% so với cùng kỳ năm ngoái, cho thấy sức mua của người tiêu dùng đang dần cải thiện. Các doanh nghiệp xuất khẩu cũng ghi nhận tín hiệu khả quan khi đơn đặt hàng từ các thị trường lớn như EU và Mỹ đang tăng trở lại."""
}

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('app')

# Cấu hình Flask app
app = Flask(__name__, static_folder='../frontend/static', template_folder='../frontend/templates')
CORS(app)
app.config['UPLOAD_FOLDER'] = os.path.join('backend', 'uploads')
app.config['OUTPUT_FOLDER'] = os.path.join('backend', 'data', 'outputs')
app.config['DATA_FOLDER'] = os.path.join('backend', 'data')
app.config['SYNONYMS_CACHE_FILE'] = os.path.join('backend', 'data', 'synonyms_cache.json')
app.config['MODEL_FOLDER'] = os.path.join('backend', 'data', 'models')
app.config['ALLOWED_EXTENSIONS'] = {'txt', 'pdf', 'docx', 'doc', 'csv', 'xlsx', 'xls'}

# Khởi tạo các thư mục cần thiết
for folder in [app.config['UPLOAD_FOLDER'], app.config['OUTPUT_FOLDER'], app.config['DATA_FOLDER'], app.config['MODEL_FOLDER']]:
    os.makedirs(folder, exist_ok=True)

# Khởi tạo crawler cho từ đồng nghĩa
synonyms_crawler = SynonymsCrawler()

# Cấu hình định dạng file cho phép
ALLOWED_EXTENSIONS = {'txt', 'csv', 'xlsx', 'docx', 'json'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')

@app.route('/recommendation')
def recommendation():
    """Trang hệ thống đề xuất"""
    return render_template('recommendation.html')

@app.route('/api/process_text', methods=['POST'])
def process_text():
    """API endpoint để xử lý văn bản"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'status': 'error', 'message': 'Không có văn bản đầu vào'})
        
        # Xử lý văn bản
        result = process_text_as_json(data['text'])
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/clean_text', methods=['POST'])
def api_clean_text():
    """API endpoint để làm sạch văn bản"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'status': 'error', 'message': 'Không có văn bản đầu vào'})
        
        # Làm sạch văn bản
        cleaned_text = clean_text(data['text'])
        return jsonify({
            'status': 'success',
            'original_text': data['text'],
            'cleaned_text': cleaned_text
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/tokenize_sentences', methods=['POST'])
def api_tokenize_sentences():
    """API endpoint để tách câu"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'status': 'error', 'message': 'Không có văn bản đầu vào'})
        
        # Tách câu
        sentences = tokenize_sentences(data['text'])
        return jsonify({
            'status': 'success',
            'original_text': data['text'],
            'sentences': sentences,
            'sentence_count': len(sentences)
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/process_with_options', methods=['POST'])
def process_with_options():
    """API endpoint để xử lý văn bản với các tùy chọn"""
    try:
        data = request.get_json()
        result = process_request(data)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# Thêm API endpoint mới cho vector hóa
@app.route('/api/vectorize', methods=['POST'])
def api_vectorize():
    """API endpoint for vectorizing text."""
    # Start measuring processing time
    start_time = time.time()
    
    # Get the request data
    try:
        data = request.get_json()
        text = data.get('text', '')
        vector_type = data.get('vector_type', '')
        
        # Validate inputs
        if not text:
            return jsonify({'status': 'error', 'message': 'Vui lòng cung cấp văn bản để vector hóa'}), 400
        
        if not vector_type or vector_type not in ['onehot', 'bow', 'tfidf', 'ngrams']:
            return jsonify({'status': 'error', 'message': 'Loại vector hóa không hợp lệ'}), 400
        
        # Process based on vector type
        if vector_type == 'onehot':
            # Clean the text
            cleaned_text = text.lower()  # Simple cleaning for example
            
            # Tokenize
            tokens = cleaned_text.split()
            
            # Create vocabulary
            vocabulary = sorted(set(tokens))
            
            # Create one-hot encoding
            matrix = []
            for token in tokens:
                one_hot = [1 if token == word else 0 for word in vocabulary]
                matrix.append(one_hot)
            
            # Calculate processing time
            processing_time = round(time.time() - start_time, 3)
            
            # Return results
            return jsonify({
                'status': 'success',
                'original_text': text,
                'words': tokens,
                'matrix': matrix,
                'feature_names': vocabulary,
                'processing_time': processing_time
            })
            
        elif vector_type == 'bow':
            # Clean the text
            cleaned_text = text.lower()  # Simple cleaning for example
            
            # Check if there are multiple sentences
            sentences = nltk.sent_tokenize(cleaned_text)
            
            if len(sentences) > 1:
                # Multiple sentences, create BOW for each sentence
                vectorizer = CountVectorizer(binary=False)
                bow_matrix = vectorizer.fit_transform(sentences).toarray()
                feature_names = vectorizer.get_feature_names_out()
                
                # Calculate processing time
                processing_time = round(time.time() - start_time, 3)
                
                # Return results with sentences
                return jsonify({
                    'status': 'success',
                    'original_text': text,
                    'sentences': sentences,
                    'matrix': bow_matrix.tolist(),
                    'feature_names': feature_names.tolist(),
                    'processing_time': processing_time
                })
            else:
                # Single text, create BOW
                vectorizer = CountVectorizer(binary=False)
                bow_matrix = vectorizer.fit_transform([cleaned_text]).toarray()
                feature_names = vectorizer.get_feature_names_out()
                
                # Calculate processing time
                processing_time = round(time.time() - start_time, 3)
                
                # Return results
                return jsonify({
                    'status': 'success',
                    'original_text': text,
                    'matrix': bow_matrix.tolist(),
                    'feature_names': feature_names.tolist(),
                    'processing_time': processing_time
                })
            
        elif vector_type == 'tfidf':
            # Clean the text
            cleaned_text = text.lower()  # Simple cleaning for example
            
            # Create TF-IDF
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([cleaned_text]).toarray()
            feature_names = vectorizer.get_feature_names_out()
            
            # Calculate processing time
            processing_time = round(time.time() - start_time, 3)
            
            # Return results
            return jsonify({
                'status': 'success',
                'original_text': text,
                'matrix': tfidf_matrix.tolist(),
                'feature_names': feature_names.tolist(),
                'processing_time': processing_time
            })
            
        elif vector_type == 'ngrams':
            # Clean the text
            cleaned_text = text.lower()
            
            # Get n-gram range (default 2-3)
            ngram_min = data.get('ngram_min', 2)
            ngram_max = data.get('ngram_max', 3)
            
            # Check that ngram values are integers
            try:
                ngram_min = int(ngram_min)
                ngram_max = int(ngram_max)
            except ValueError:
                ngram_min = 2
                ngram_max = 3
                
            # Ensure min <= max
            if ngram_min > ngram_max:
                ngram_min, ngram_max = ngram_max, ngram_min
            
            # Check if there are multiple sentences
            sentences = nltk.sent_tokenize(cleaned_text)
            
            # Create n-gram vectorizer
            vectorizer = CountVectorizer(
                ngram_range=(ngram_min, ngram_max),
                token_pattern=r'\b\w+\b',
                min_df=1
            )
            
            if len(sentences) > 1:
                # Multiple sentences, create n-grams for each sentence
                ngrams_matrix = vectorizer.fit_transform(sentences).toarray()
                feature_names = vectorizer.get_feature_names_out()
                
                # Calculate processing time
                processing_time = round(time.time() - start_time, 3)
                
                # Return results with sentences
                return jsonify({
                    'status': 'success',
                    'original_text': text,
                    'sentences': sentences,
                    'matrix': ngrams_matrix.tolist(),
                    'feature_names': feature_names.tolist(),
                    'ngram_range': [ngram_min, ngram_max],
                    'processing_time': processing_time
                })
            else:
                # Single text, create n-grams
                ngrams_matrix = vectorizer.fit_transform([cleaned_text]).toarray()
                feature_names = vectorizer.get_feature_names_out()
                
                # Calculate processing time
                processing_time = round(time.time() - start_time, 3)
                
                # Return results
                return jsonify({
                    'status': 'success',
                    'original_text': text,
                    'matrix': ngrams_matrix.tolist(),
                    'feature_names': feature_names.tolist(),
                    'ngram_range': [ngram_min, ngram_max],
                    'processing_time': processing_time
                })
            
    except Exception as e:
        # Log the error
        logging.error(f"Error in vectorize API: {str(e)}")
        traceback.print_exc()
        
        # Return error response
        return jsonify({
            'status': 'error', 
            'message': f'Lỗi khi vector hóa văn bản: {str(e)}'
        }), 500
        
    # Calculate processing time
    processing_time = round(time.time() - start_time, 3)
    
    # Return error if no valid vectorization type
    return jsonify({
        'status': 'error',
        'message': 'Không thể vector hóa văn bản',
        'processing_time': processing_time
    }), 400

# Route cho trang từ đồng nghĩa
@app.route('/synonyms')
def synonyms_page():
    return render_template('synonyms.html')

# Route xử lý văn bản
@app.route('/process_text', methods=['POST'])
def process_text_route():
    # Tính thời gian xử lý
    start_time = time.time()
    try:
        # Thiết lập giá trị mặc định cho các biến kết quả
        original_text = ""
        processed_text = ""
        augmented_texts = []
        additional_results = {}
        vector_data = None
        processing_steps = []
        
        # Kiểm tra và lấy dữ liệu JSON
        if not request.is_json:
            logger.error("Yêu cầu không chứa dữ liệu JSON")
            return jsonify({
                'success': False, 
                'error': 'Yêu cầu phải có dữ liệu JSON'
            }), 400
            
        data = request.json
        if not data:
            logger.error("Nhận được dữ liệu JSON rỗng")
            return jsonify({
                'success': False, 
                'error': 'Không nhận được dữ liệu JSON'
            }), 400
        
        text = data.get('text', '')
        processing_options = data.get('options', {})
        
        if not text:
            logger.error("Không có văn bản đầu vào")
            return jsonify({
                'success': False, 
                'error': 'Không có văn bản đầu vào'
            }), 400
        
        # Log dữ liệu đầu vào để debug
        logger.info(f"Đang xử lý văn bản: {text[:100]}...")
        logger.info(f"Tùy chọn xử lý: {json.dumps(processing_options, ensure_ascii=False)}")
        
        # Lưu văn bản ban đầu
        original_text = text
        processed_text = text  # Bản copy để theo dõi các thay đổi
        
        # Xử lý làm sạch văn bản
        if processing_options.get('cleaning', {}) and any(processing_options.get('cleaning', {}).values()):
            try:
                logger.info("Bắt đầu làm sạch văn bản...")
                
                # Lấy tùy chọn làm sạch từ frontend
                cleaning_options = processing_options.get('cleaning', {})
                logger.info(f"Tùy chọn làm sạch: {cleaning_options}")
                
                # Tạo dictionary tùy chọn làm sạch
                clean_options = {
                    # Tùy chọn cơ bản
                    'normalize_unicode': True,
                    'remove_html': True,
                    'remove_urls': True,
                    'remove_emails': True,
                    'remove_phone_numbers': True,
                    
                    # Tùy chọn từ UI
                    'remove_special_chars': cleaning_options.get('remove-special-chars', False),
                    'custom_special_chars': cleaning_options.get('custom-special-chars', None),
                    'remove_punctuation': cleaning_options.get('remove-punctuation', False),
                    'remove_digits': cleaning_options.get('remove-digits', False),
                    'lowercase': cleaning_options.get('lowercase', False),
                    'remove_extra_whitespace': cleaning_options.get('remove-extra-spaces', False),
                    
                    # Các tùy chọn mới
                    'abbreviation_correction': cleaning_options.get('abbreviation-correction', False),
                    'stopwords_removal': cleaning_options.get('stopwords-removal', False)
                }
                
                logger.info(f"Áp dụng tùy chọn làm sạch: {clean_options}")
                processed_text = clean_text(processed_text, **clean_options)
                
                logger.info("Đã hoàn thành làm sạch văn bản")
                logger.debug(f"Văn bản sau khi làm sạch: {processed_text[:100]}...")
                processing_steps.append("Làm sạch văn bản")
                
                # Xử lý phân tách câu nếu được yêu cầu
                if cleaning_options.get('sentence-tokenization', False):
                    sentences = tokenize_sentences(processed_text)
                    logger.info(f"Đã phân tách văn bản thành {len(sentences)} câu")
                    
                    # Thêm kết quả phân tách câu vào kết quả
                    additional_results['sentences'] = sentences
                    processing_steps.append("Phân tách câu")
                
                # Xử lý phân tách từ nếu được yêu cầu
                if cleaning_options.get('word-tokenization', False):
                    words = tokenize_words(processed_text)
                    logger.info(f"Đã phân tách văn bản thành {len(words)} từ")
                    
                    # Thêm kết quả phân tách từ vào kết quả
                    additional_results['words'] = words
                    processing_steps.append("Phân tách từ")
                
                # Xử lý gán nhãn từ loại nếu được yêu cầu
                if cleaning_options.get('pos-tagging', False):
                    pos_tags = tag_parts_of_speech(processed_text)
                    logger.info(f"Đã gán nhãn từ loại cho {len(pos_tags)} từ")
                    
                    # Chuyển đổi kết quả để có thể serialize thành JSON
                    pos_results = [{"word": word, "tag": tag} for word, tag in pos_tags]
                    
                    # Thêm kết quả gán nhãn từ loại vào kết quả
                    additional_results['pos_tags'] = pos_results
                    processing_steps.append("Gán nhãn từ loại")
                
                # Xử lý phân tích cú pháp nếu được yêu cầu
                if cleaning_options.get('syntax-parsing', False):
                    syntax_results = parse_syntax(processed_text)
                    logger.info(f"Đã phân tích cú pháp cho văn bản")
                    
                    # Thêm kết quả phân tích cú pháp vào kết quả
                    additional_results['syntax'] = syntax_results
                    processing_steps.append("Phân tích cú pháp")
                
            except Exception as clean_error:
                logger.error(f"Lỗi khi làm sạch văn bản: {str(clean_error)}", exc_info=True)
                # Tiếp tục xử lý mà không dừng toàn bộ quá trình
        
        # Tăng cường dữ liệu nếu được yêu cầu
        augment_options = processing_options.get('augmentation', {})
        if augment_options and any(augment_options.values()):
            try:
                logger.info("Bắt đầu tăng cường dữ liệu...")
                
                # Số lượng mẫu cần tạo - đúng cách lấy từ additionalParams
                num_samples = int(data.get('num_samples', 3))
                
                # Lấy các tùy chọn tăng cường từ frontend
                use_synonyms = augment_options.get('use-synonyms', False)
                add_words = augment_options.get('add-random-words', False)
                swap_word_order = augment_options.get('swap-random-words', False)
                delete_words_enabled = augment_options.get('delete-random-words', False)
                back_translation_enabled = augment_options.get('back-translation', False)
                
                # Tùy chọn nhiễu dữ liệu
                data_noise = augment_options.get('data-noise', False)
                add_typos_enabled = False
                random_case_enabled = False
                
                # Nếu bật tùy chọn nhiễu dữ liệu, thì kích hoạt các phương pháp nhiễu
                if data_noise:
                    add_typos_enabled = True
                    random_case_enabled = True
                    logger.info("Đã bật các phương pháp nhiễu dữ liệu")
                
                logger.info(f"Các tùy chọn tăng cường đã chọn: use_synonyms={use_synonyms}, add_words={add_words}, swap_words={swap_word_order}, delete_words={delete_words_enabled}, back_translation={back_translation_enabled}, add_typos={add_typos_enabled}, random_case={random_case_enabled}")
                
                # Tạo các mẫu tăng cường với các tùy chọn mới
                augmented_texts = create_augmented_samples(
                    processed_text,  # Sử dụng văn bản đã được xử lý
                    num_samples=num_samples,
                    use_synonyms=use_synonyms,
                    add_words=add_words,
                    swap_word_order=swap_word_order,
                    delete_words_enabled=delete_words_enabled,
                    add_typos_enabled=add_typos_enabled,
                    random_case_enabled=random_case_enabled,
                    back_translation_enabled=back_translation_enabled
                )
                
                logger.info(f"Đã tạo {len(augmented_texts)} mẫu tăng cường")
                processing_steps.append(f"Tăng cường dữ liệu ({len(augmented_texts)} mẫu)")
                
                # Log chi tiết kết quả tăng cường để debug
                for i, aug_text in enumerate(augmented_texts):
                    logger.debug(f"Mẫu tăng cường #{i+1}: {aug_text[:100]}...")
            except Exception as aug_error:
                logger.error(f"Lỗi khi tăng cường dữ liệu: {str(aug_error)}", exc_info=True)
                # Tiếp tục xử lý mà không dừng toàn bộ quá trình
        
        # Vector hóa văn bản nếu được yêu cầu
        vectorize_options = processing_options.get('vectorization', {})
        if vectorize_options and any(vectorize_options.values()):
            try:
                logger.info("Bắt đầu vector hóa văn bản...")
                # Xác định phương pháp vector hóa
                vectorization_type = 'bow'  # mặc định
                if vectorize_options.get('one-hot', False):
                    vectorization_type = 'onehot'
                
                # Chuẩn bị văn bản để vector hóa
                texts_to_vectorize = [processed_text]
                if augmented_texts:
                    texts_to_vectorize.extend(augmented_texts)
                
                # Khởi tạo bộ vector hóa
                vectorizer = TextVectorizer()
                vectorizer.fit(texts_to_vectorize)
                
                # Vector hóa dựa trên loại đã chọn
                if vectorization_type == 'onehot':
                    vectors = [vectorizer.get_onehot_vector(t) for t in texts_to_vectorize]
                    logger.info("Đã tạo vector one-hot")
                else:  # mặc định là bow
                    vectors = [vectorizer.get_bow_vector(t) for t in texts_to_vectorize]
                    logger.info("Đã tạo vector bag-of-words")
                    
                # Chuẩn bị dữ liệu vector trả về
                vector_data = {
                    'vocabulary': vectorizer.vocab,
                    'vocabulary_size': len(vectorizer.vocab),
                    'vectors': vectors
                }
                processing_steps.append(f"Vector hóa ({vectorization_type})")
            except Exception as vec_error:
                logger.error(f"Lỗi khi vector hóa văn bản: {str(vec_error)}", exc_info=True)
                # Tiếp tục xử lý mà không dừng toàn bộ quá trình
        
        # Tính thời gian xử lý
        processing_time = round(time.time() - start_time, 2)
        
        # Chuẩn bị kết quả trả về
        result = {
            'success': True,
            'original_text': original_text,
            'processed_text': processed_text,
            'augmented_texts': augmented_texts,
            'processing_time': processing_time,
            'steps': processing_steps
        }
        
        # Thêm kết quả phân tích bổ sung nếu có
        if additional_results:
            for key, value in additional_results.items():
                result[key] = value
        
        if vector_data:
            result['vector_data'] = vector_data
        
        logger.info(f"Xử lý văn bản thành công trong {processing_time} giây")
        return jsonify(result), 200
        
    except Exception as e:
        # Tính thời gian xử lý
        processing_time = round(time.time() - start_time, 2)
        
        error_message = f"Lỗi khi xử lý văn bản: {str(e)}"
        logger.error(error_message, exc_info=True)
        return jsonify({
            'success': False,
            'error': error_message,
            'processing_time': processing_time,
            'traceback': traceback.format_exc()
        }), 500

# Route cho xử lý file
@app.route('/process_file', methods=['POST'])
def process_file():
    try:
        # Kiểm tra xem có file nào được gửi lên không
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Không có file nào được chọn'})
            
        file = request.files['file']
        
        # Kiểm tra tên file
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Không có file nào được chọn'})
            
        # Kiểm tra định dạng file
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Định dạng file không được hỗ trợ'})
            
        # Lưu file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        file.save(file_path)
        
        logger.info(f"Đã lưu file: {file_path}")
        
        # Xử lý file
        processing_result = FileProcessor.process_file(file_path)
        
        # Trả về kết quả
        return jsonify(processing_result)
        
    except Exception as e:
        logger.error(f"Lỗi khi xử lý file: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi xử lý file: {str(e)}',
            'traceback': traceback.format_exc()
        })

# Thêm endpoint API mới cho upload file
@app.route('/api/upload', methods=['POST'])
def api_upload_file():
    """API endpoint cho việc tải lên file."""
    try:
        # Kiểm tra xem có file nào được gửi lên không
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Không có file nào được chọn'})
            
        file = request.files['file']
        
        # Kiểm tra tên file
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Không có file nào được chọn'})
            
        # Kiểm tra định dạng file
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Định dạng file không được hỗ trợ'})
            
        # Lưu file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        file.save(file_path)
        
        logger.info(f"API: Đã lưu file: {file_path}")
        
        # Xử lý file
        processing_result = FileProcessor.process_file(file_path)
        
        # Trả về kết quả
        return jsonify(processing_result)
        
    except Exception as e:
        logger.error(f"API: Lỗi khi xử lý file: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi xử lý file: {str(e)}',
            'traceback': traceback.format_exc()
        })

# Route cho lấy từ đồng nghĩa
@app.route('/find_synonyms', methods=['POST'])
def find_synonyms():
    try:
        data = request.json
        word = data.get('word', '').strip()
        
        if not word:
            return jsonify({'success': False, 'error': 'Không có từ đầu vào'})
            
        logger.info(f"Tìm từ đồng nghĩa cho: {word}")
        
        # Kiểm tra cache
        cache = load_synonyms_cache()
        if word in cache:
            logger.info(f"Đã tìm thấy từ '{word}' trong cache")
            return jsonify({
                'success': True,
                'word': word,
                'synonyms': cache[word],
                'source': 'cache'
            })
        
        # Nếu không có trong cache, tìm trực tuyến
        logger.info(f"Không tìm thấy từ '{word}' trong cache, tìm trực tuyến")
        synonyms = synonyms_crawler.get_synonyms(word)
        
        # Lưu vào cache
        if synonyms:
            cache[word] = synonyms
            save_synonyms_cache(cache)
            logger.info(f"Đã lưu từ đồng nghĩa cho '{word}' vào cache ({len(synonyms)} từ)")
        else:
            # Lưu danh sách rỗng để tránh tìm kiếm lại
            cache[word] = []
            save_synonyms_cache(cache)
            logger.info(f"Không tìm thấy từ đồng nghĩa cho '{word}', lưu danh sách rỗng vào cache")
        
        return jsonify({
            'success': True,
            'word': word,
            'synonyms': synonyms,
            'source': 'online'
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi tìm từ đồng nghĩa: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi tìm từ đồng nghĩa: {str(e)}',
            'traceback': traceback.format_exc()
        })

# Route thay thế từ bằng từ đồng nghĩa
@app.route('/replace_with_synonyms', methods=['POST'])
def replace_synonyms():
    try:
        data = request.json
        text = data.get('text', '')
        percentage = float(data.get('percentage', 0.3))
        
        if not text:
            return jsonify({'success': False, 'error': 'Không có văn bản đầu vào'})
            
        logger.info(f"Thay thế từ bằng từ đồng nghĩa với tỷ lệ {percentage}")
        
        # Thực hiện thay thế
        augmented_text, replacements = replace_with_synonyms(text, percentage)
        
        return jsonify({
            'success': True,
            'original_text': text,
            'augmented_text': augmented_text,
            'replacements': replacements
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi thay thế từ đồng nghĩa: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi thay thế từ đồng nghĩa: {str(e)}',
            'traceback': traceback.format_exc()
        })

# Route để lấy nhiều từ đồng nghĩa một lúc
@app.route('/batch_crawl_synonyms', methods=['POST'])
def batch_crawl_synonyms():
    try:
        data = request.json
        words = data.get('words', [])
        
        if not words:
            return jsonify({'success': False, 'error': 'Không có danh sách từ đầu vào'})
            
        logger.info(f"Tìm từ đồng nghĩa cho {len(words)} từ")
        
        # Tải cache hiện có
        cache = load_synonyms_cache()
        cache_updated = False
        
        results = {}
        for word in words:
            word = word.strip()
            if not word:
                continue
                
            # Kiểm tra trong cache
            if word in cache:
                logger.info(f"Đã tìm thấy từ '{word}' trong cache")
                results[word] = cache[word]
            else:
                # Nếu không có trong cache, tìm trực tuyến
                logger.info(f"Không tìm thấy từ '{word}' trong cache, tìm trực tuyến")
                synonyms = synonyms_crawler.get_synonyms(word)
                
                # Cập nhật cache
                cache[word] = synonyms
                cache_updated = True
                
                # Thêm vào kết quả
                results[word] = synonyms
                
                logger.info(f"Đã tìm được {len(synonyms)} từ đồng nghĩa cho '{word}'")
        
        # Lưu cache nếu có cập nhật
        if cache_updated:
            save_synonyms_cache(cache)
            logger.info("Đã cập nhật cache từ đồng nghĩa")
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi tìm hàng loạt từ đồng nghĩa: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi tìm hàng loạt từ đồng nghĩa: {str(e)}',
            'traceback': traceback.format_exc()
        })

# Route để xóa cache từ đồng nghĩa
@app.route('/clear_synonyms_cache', methods=['POST'])
def clear_synonyms_cache():
    try:
        # Xóa cache trong bộ nhớ
        synonyms_crawler.clear_cache()
        
        # Xóa file cache
        cache_file = app.config['SYNONYMS_CACHE_FILE']
        if os.path.exists(cache_file):
            os.remove(cache_file)
            logger.info(f"Đã xóa file cache: {cache_file}")
        
        # Tạo file cache mới
        empty_cache = {}
        save_synonyms_cache(empty_cache)
        
        return jsonify({
            'success': True,
            'message': 'Đã xóa cache từ đồng nghĩa'
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi xóa cache từ đồng nghĩa: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi xóa cache từ đồng nghĩa: {str(e)}',
            'traceback': traceback.format_exc()
        })

# Route trả về file từ thư mục output
@app.route('/outputs/<filename>')
def download_file(filename):
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename)

# API cho tìm từ đồng nghĩa (phục vụ trang synonyms.html)
@app.route('/api/find_synonyms', methods=['POST'])
def api_find_synonyms():
    try:
        data = request.json
        word = data.get('word', '').strip()
        
        if not word:
            return jsonify({'success': False, 'error': 'Không có từ đầu vào'})
            
        logger.info(f"API: Tìm từ đồng nghĩa cho: {word}")
        
        start_time = time.time()
        
        # Kiểm tra cache
        cache = load_synonyms_cache()
        if word in cache:
            logger.info(f"Đã tìm thấy từ '{word}' trong cache")
            processing_time = round(time.time() - start_time, 2)
            return jsonify({
                'success': True,
                'word': word,
                'synonyms': cache[word],
                'source': 'cache',
                'processing_time': processing_time
            })
        
        # Nếu không có trong cache, tìm trực tuyến
        logger.info(f"Không tìm thấy từ '{word}' trong cache, tìm trực tuyến")
        synonyms = synonyms_crawler.get_synonyms(word)
        
        # Lưu vào cache
        if synonyms:
            cache[word] = synonyms
            save_synonyms_cache(cache)
            logger.info(f"Đã lưu từ đồng nghĩa cho '{word}' vào cache ({len(synonyms)} từ)")
        else:
            # Lưu danh sách rỗng để tránh tìm kiếm lại
            cache[word] = []
            save_synonyms_cache(cache)
            logger.info(f"Không tìm thấy từ đồng nghĩa cho '{word}', lưu danh sách rỗng vào cache")
        
        processing_time = round(time.time() - start_time, 2)
        
        return jsonify({
            'success': True,
            'word': word,
            'synonyms': synonyms,
            'source': 'online',
            'processing_time': processing_time
        })
        
    except Exception as e:
        logger.error(f"Lỗi API khi tìm từ đồng nghĩa: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi tìm từ đồng nghĩa: {str(e)}',
            'traceback': traceback.format_exc()
        })

# API cho tìm nhiều từ đồng nghĩa cùng lúc
@app.route('/api/batch_crawl', methods=['POST'])
def api_batch_crawl():
    try:
        data = request.json
        words = data.get('words', [])
        
        if not words:
            return jsonify({'success': False, 'error': 'Không có danh sách từ đầu vào'})
            
        logger.info(f"API: Tìm từ đồng nghĩa cho {len(words)} từ")
        
        start_time = time.time()
        
        # Tải cache hiện có
        cache = load_synonyms_cache()
        cache_updated = False
        
        results = {}
        for word in words:
            word = word.strip()
            if not word:
                continue
                
            # Kiểm tra trong cache
            if word in cache:
                logger.info(f"Đã tìm thấy từ '{word}' trong cache")
                results[word] = cache[word]
            else:
                # Nếu không có trong cache, tìm trực tuyến
                logger.info(f"Không tìm thấy từ '{word}' trong cache, tìm trực tuyến")
                synonyms = synonyms_crawler.get_synonyms(word)
                
                # Cập nhật cache
                cache[word] = synonyms
                cache_updated = True
                
                # Thêm vào kết quả
                results[word] = synonyms
                
                logger.info(f"Đã tìm được {len(synonyms)} từ đồng nghĩa cho '{word}'")
        
        # Lưu cache nếu có cập nhật
        if cache_updated:
            save_synonyms_cache(cache)
            logger.info("Đã cập nhật cache từ đồng nghĩa")
        
        processing_time = round(time.time() - start_time, 2)
        
        return jsonify({
            'success': True,
            'results': results,
            'processing_time': processing_time
        })
        
    except Exception as e:
        logger.error(f"Lỗi API khi tìm hàng loạt từ đồng nghĩa: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi tìm hàng loạt từ đồng nghĩa: {str(e)}',
            'traceback': traceback.format_exc()
        })

# API endpoint để lấy văn bản mẫu
@app.route('/api/sample_text', methods=['GET'])
def get_sample_text():
    """API endpoint để lấy văn bản mẫu theo danh mục."""
    try:
        # Lấy tham số danh mục từ request
        category = request.args.get('category', 'tích_cực')
        
        # Lấy văn bản mẫu tương ứng với danh mục
        if category in SAMPLE_TEXTS:
            sample_text = SAMPLE_TEXTS[category]
        else:
            # Nếu không tìm thấy danh mục, trả về văn bản mẫu mặc định
            sample_text = SAMPLE_TEXTS['tích_cực']
            category = 'tích_cực'
        
        logger.info(f"Đã cung cấp văn bản mẫu cho danh mục: {category}")
        
        # Trả về văn bản mẫu
        return jsonify({
            'success': True,
            'category': category,
            'text': sample_text
        })
        
    except Exception as e:
        logger.error(f"Lỗi khi lấy văn bản mẫu: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Lỗi khi lấy văn bản mẫu: {str(e)}'
        })

@app.route('/api/classify_text', methods=['POST'])
def api_classify_text():
    """API endpoint để phân loại văn bản"""
    try:
        start_time = time.time()
        data = request.get_json()
        
        if not data or 'text' not in data or 'model_type' not in data:
            return jsonify({
                'status': 'error', 
                'message': 'Thiếu thông tin văn bản hoặc loại mô hình'
            })
        
        text = data['text']
        model_type = data.get('model_type', 'naive_bayes')
        use_saved_model = data.get('use_saved_model', False)
        
        # Xử lý dữ liệu đầu vào nếu cần
        # Ví dụ: làm sạch văn bản
        if data.get('clean_text', True):
            text = clean_text(text)
        
        # Khởi tạo bộ phân loại
        classifier = TextClassifier(model_type=model_type)
        
        # Nếu dùng mô hình đã lưu
        if use_saved_model:
            try:
                model_path = data.get('model_path', 'model')
                vectorizer_path = data.get('vectorizer_path', 'vectorizer')
                classifier.load_model(model_path, vectorizer_path)
                
                # Dự đoán
                result = classifier.predict(text)
                
                processing_time = round(time.time() - start_time, 3)
                
                return jsonify({
                    'status': 'success',
                    'original_text': data['text'],
                    'clean_text': text,
                    'model_type': model_type,
                    'prediction': result,
                    'processing_time': processing_time
                })
                
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': f'Lỗi khi tải mô hình: {str(e)}'
                })
        else:
            # Nếu huấn luyện mô hình mới
            if 'train_data' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Thiếu dữ liệu huấn luyện'
                })
            
            # Xử lý dữ liệu đầu vào
            train_data = data['train_data']
            text_column = data.get('text_column', 'review')
            label_column = data.get('label_column', 'sentiment')
            test_size = data.get('test_size', 0.2)
            
            # Huấn luyện từ file
            if isinstance(train_data, str) and train_data.endswith('.csv'):
                try:
                    # Kiểm tra xem file có chứa dữ liệu NaN hay không
                    df = pd.read_csv(train_data)
                    if df[text_column].isna().any() or df[label_column].isna().any():
                        logger.warning(f"Dataset có {df[text_column].isna().sum()} giá trị NaN trong cột {text_column} và {df[label_column].isna().sum()} giá trị NaN trong cột {label_column}")
                    
                    # Thêm xử lý cho tham số knn_neighbors
                    n_neighbors = 5  # Giá trị mặc định
                    if model_type == 'knn':
                        n_neighbors = int(data.get('knn_neighbors', 5))
                        logger.info(f"Sử dụng KNN với n_neighbors={n_neighbors}")
                        
                    # Khởi tạo bộ phân loại
                    classifier = TextClassifier(
                        model_type=model_type,
                        max_features=data.get('max_features', 5000),
                        n_neighbors=n_neighbors
                    )
                    
                    # Huấn luyện mô hình
                    training_result = classifier.train_from_file(
                        train_data, 
                        text_column=text_column, 
                        label_column=label_column,
                        test_size=test_size
                    )
                    
                    # Dự đoán
                    prediction = classifier.predict(text)
                    
                    # Lưu mô hình nếu cần
                    if data.get('save_model', False):
                        model_path = data.get('model_path', 'model')
                        vectorizer_path = data.get('vectorizer_path', 'vectorizer')
                        classifier.save_model(model_path, vectorizer_path)
                    
                    processing_time = round(time.time() - start_time, 3)
                    
                    return jsonify({
                        'status': 'success',
                        'original_text': data['text'],
                        'clean_text': text,
                        'model_type': model_type,
                        'training_result': training_result,
                        'prediction': prediction,
                        'processing_time': processing_time
                    })
                    
                except Exception as e:
                    return jsonify({
                        'status': 'error',
                        'message': f'Lỗi khi huấn luyện mô hình: {str(e)}'
                    })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Định dạng dữ liệu huấn luyện không hợp lệ'
                })
    
    except Exception as e:
        logger.error(f"Lỗi khi phân loại văn bản: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/train_model')
def train_model_page():
    """Trang đào tạo mô hình phân loại văn bản"""
    return render_template('train_model.html')

@app.route('/recommendation')
def recommendation_page():
    """Trang hệ thống gợi ý thông minh"""
    return render_template('recommendation.html')

@app.route('/api/train_model', methods=['POST'])
def api_train_model():
    """API endpoint để đào tạo mô hình phân loại văn bản"""
    try:
        # Kiểm tra file đã được tải lên
        if 'dataset' not in request.files:
            return jsonify({'status': 'error', 'message': 'Không tìm thấy file dataset'})
        
        file = request.files['dataset']
        
        # Kiểm tra tên file
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'Không có file nào được chọn'})
        
        # Kiểm tra loại file
        if not file.filename.endswith('.csv'):
            return jsonify({'status': 'error', 'message': 'Chỉ hỗ trợ file CSV'})
        
        # Lấy các tham số
        text_column = request.form.get('text_column', 'review')
        label_column = request.form.get('label_column', 'sentiment')
        vectorization_method = request.form.get('vectorization_method', 'bow')
        classification_method = request.form.get('classification_method', 'naive_bayes')
        max_features = int(request.form.get('max_features', 5000))
        test_size = float(request.form.get('test_size', 0.2))
        random_state = int(request.form.get('random_state', 42))
        model_name = request.form.get('model_name', '')
        model_category = request.form.get('model_category', 'general')
        
        # Lấy ngram_range nếu vectorization_method là 'ngrams'
        ngram_range = None
        if vectorization_method == 'ngrams':
            ngram_min = int(request.form.get('ngram_min', 1))
            ngram_max = int(request.form.get('ngram_max', 3))
            ngram_range = (ngram_min, ngram_max)
        
        # Tạo thư mục models chính nếu chưa tồn tại
        models_dir = os.path.join('backend', 'data', 'models')
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)
        
        # Tạo thư mục con cho thể loại
        category_dir = os.path.join(models_dir, model_category)
        if not os.path.exists(category_dir):
            os.makedirs(category_dir)
        
        # Lưu file tạm thời
        temp_file_path = os.path.join('backend', 'temp', file.filename)
        os.makedirs(os.path.join('backend', 'temp'), exist_ok=True)
        file.save(temp_file_path)
        
        # Tạo tên mô hình nếu không cung cấp
        if not model_name:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            model_name = f"{classification_method}_{vectorization_method}_{timestamp}"
        
        # Tạo đường dẫn lưu mô hình trong thư mục thể loại
        model_path = os.path.join(category_dir, f"{model_name}_model")
        vectorizer_path = os.path.join(category_dir, f"{model_name}_vectorizer")
        
        # Ghi log
        logger.info(f"Đào tạo mô hình {classification_method} với vectorization {vectorization_method} cho thể loại {model_category}")
        logger.info(f"Dataset: {file.filename}, text_column: {text_column}, label_column: {label_column}")
        
        start_time = time.time()
        
        try:
            # Kiểm tra xem file có chứa dữ liệu NaN hay không
            df = pd.read_csv(temp_file_path)
            if df[text_column].isna().any() or df[label_column].isna().any():
                logger.warning(f"Dataset có {df[text_column].isna().sum()} giá trị NaN trong cột {text_column} và {df[label_column].isna().sum()} giá trị NaN trong cột {label_column}")
            
            # Thêm xử lý cho tham số knn_neighbors
            n_neighbors = 5  # Giá trị mặc định
            if classification_method == 'knn' and 'knn_neighbors' in request.form:
                n_neighbors = int(request.form.get('knn_neighbors', 5))
                logger.info(f"Sử dụng KNN với n_neighbors={n_neighbors}")
                
            # Khởi tạo bộ phân loại
            classifier = TextClassifier(
                model_type=classification_method,
                max_features=max_features,
                n_neighbors=n_neighbors
            )
            
            # Huấn luyện mô hình
            training_result = classifier.train_from_file(
                temp_file_path, 
                text_column=text_column, 
                label_column=label_column,
                test_size=test_size,
                random_state=random_state,
                vectorization_method=vectorization_method,
                ngram_range=ngram_range
            )
            
            # Lưu mô hình
            classifier.save_model(model_path, vectorizer_path)
            
            # Tính thời gian xử lý
            processing_time = round(time.time() - start_time, 2)
            
            # Xóa file tạm
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
            # Tạo thông tin mô hình để trả về
            model_info = {
                'model_name': model_name,
                'classification_method': classification_method,
                'vectorization_method': vectorization_method,
                'model_path': model_path,
                'vectorizer_path': vectorizer_path,
                'model_category': model_category,
                'model_id': f"{model_category}/{model_name}"
            }
            
            return jsonify({
                'status': 'success',
                'message': 'Đã đào tạo mô hình thành công',
                'processing_time': processing_time,
                'model_info': model_info,
                'training_result': training_result
            })
            
        except Exception as model_error:
            logger.error(f"Lỗi khi đào tạo mô hình: {str(model_error)}")
            # Xóa file tạm nếu có lỗi
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return jsonify({
                'status': 'error',
                'message': f'Lỗi khi đào tạo mô hình: {str(model_error)}. Vui lòng kiểm tra lại dataset của bạn không có giá trị NaN hoặc dữ liệu không hợp lệ.'
            })
            
    except Exception as e:
        logger.error(f"Lỗi: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint để dự đoán phân loại văn bản sử dụng mô hình mới nhất"""
    try:
        start_time = time.time()
        
        # Nhận dữ liệu từ request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'status': 'error', 'message': 'Không có văn bản đầu vào'}), 400
        
        text = data.get('text', '')
        clean_text_option = data.get('clean_text', True)
        model_category = data.get('model_category', None)
        
        # Hàm làm sạch văn bản nếu được yêu cầu
        clean_func = None
        if clean_text_option:
            from backend.text_cleaning import clean_text
            clean_func = clean_text
        
        # Sử dụng hàm dự đoán từ prediction_service
        from backend.prediction_service import predict_with_latest_model
        result = predict_with_latest_model(text, clean_func, model_category)
        
        # Kiểm tra kết quả
        if result['status'] == 'error':
            return jsonify(result), 400
        
        # Trả về kết quả thành công
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Lỗi khi dự đoán phân loại văn bản: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Lỗi khi dự đoán phân loại văn bản: {str(e)}'
        }), 500

@app.route('/api/model_categories', methods=['GET'])
def api_model_categories():
    """API endpoint để lấy danh sách các thư mục thể loại mô hình"""
    try:
        # Thư mục chứa các mô hình
        models_dir = os.path.join('backend', 'data', 'models')
        
        # Đảm bảo thư mục tồn tại
        if not os.path.exists(models_dir):
            os.makedirs(models_dir, exist_ok=True)
            return jsonify({
                'status': 'success',
                'categories': []
            })
        
        # Lấy danh sách các thư mục con (thể loại)
        categories = []
        for item in os.listdir(models_dir):
            item_path = os.path.join(models_dir, item)
            if os.path.isdir(item_path):
                # Đếm số lượng mô hình trong thư mục
                model_count = 0
                for file in os.listdir(item_path):
                    if file.endswith('_model'):
                        model_count += 1
                
                categories.append({
                    'name': item,
                    'model_count': model_count
                })
        
        # Sắp xếp theo tên
        categories.sort(key=lambda x: x['name'])
        
        return jsonify({
            'status': 'success',
            'categories': categories
        })
    
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách thể loại mô hình: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Lỗi khi lấy danh sách thể loại mô hình: {str(e)}'
        }), 500

# Khởi động app
if __name__ == '__main__':
    logger.info("Ứng dụng đang khởi động...")
    
    # Đảm bảo thư mục data tồn tại
    os.makedirs(app.config['DATA_FOLDER'], exist_ok=True)
    
    # Khởi tạo file cache nếu chưa tồn tại
    cache_file = app.config['SYNONYMS_CACHE_FILE']
    if not os.path.exists(cache_file):
        empty_cache = {}
        save_synonyms_cache(empty_cache)
        logger.info(f"Đã tạo file cache mới: {cache_file}")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 