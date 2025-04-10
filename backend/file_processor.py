#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import logging
import csv
import json
from typing import Dict, Any, List, Union
import docx
import pandas as pd
from backend.text_cleaning import clean_text

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('file_processor')

class FileProcessor:
    """
    Lớp xử lý các file văn bản từ nhiều định dạng khác nhau.
    Hỗ trợ các định dạng: txt, csv, json, xlsx, docx.
    """
    
    # Danh sách các định dạng file được hỗ trợ
    ALLOWED_EXTENSIONS = {'txt', 'csv', 'json', 'xlsx', 'docx'}
    
    @staticmethod
    def allowed_file(filename: str) -> bool:
        """
        Kiểm tra xem định dạng file có được hỗ trợ không.
        
        Args:
            filename: Tên file cần kiểm tra
            
        Returns:
            True nếu file có định dạng được hỗ trợ, False nếu không
        """
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileProcessor.ALLOWED_EXTENSIONS
    
    @staticmethod
    def process_file(file_path: str) -> Dict[str, Any]:
        """
        Xử lý file và trích xuất nội dung.
        
        Args:
            file_path: Đường dẫn đến file cần xử lý
            
        Returns:
            Dict chứa thông tin và nội dung trích xuất từ file
        """
        try:
            file_ext = file_path.split('.')[-1].lower()
            file_size = os.path.getsize(file_path)
            file_name = os.path.basename(file_path)
            
            logger.info(f"Xử lý file {file_name} ({file_size} bytes)")
            
            # Chọn phương thức xử lý dựa trên định dạng file
            if file_ext == 'txt':
                content = FileProcessor.process_txt(file_path)
            elif file_ext == 'csv':
                content = FileProcessor.process_csv(file_path)
            elif file_ext == 'json':
                content = FileProcessor.process_json(file_path)
            elif file_ext == 'xlsx':
                content = FileProcessor.process_xlsx(file_path)
            elif file_ext == 'docx':
                content = FileProcessor.process_docx(file_path)
            else:
                return {
                    'success': False,
                    'error': f'Định dạng {file_ext} không được hỗ trợ'
                }
            
            # Làm sạch văn bản trích xuất
            if isinstance(content, str):
                cleaned_content = clean_text(
                    content,
                    normalize_unicode=True,
                    remove_html=True,
                    remove_urls=True,
                    remove_extra_whitespace=True
                )
            else:
                cleaned_content = content  # Giữ nguyên nếu không phải chuỗi
                
            # Chuẩn bị kết quả trả về
            result = {
                'success': True,
                'file_name': file_name,
                'file_size': file_size,
                'file_type': file_ext,
                'content': content,
                'cleaned_content': cleaned_content,
                'stats': FileProcessor.get_content_stats(content if isinstance(content, str) else json.dumps(content, ensure_ascii=False))
            }
            
            logger.info(f"Xử lý thành công file {file_name}")
            return result
            
        except Exception as e:
            logger.error(f"Lỗi khi xử lý file {file_path}: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': f'Lỗi khi xử lý file: {str(e)}'
            }
    
    @staticmethod
    def process_txt(file_path: str) -> str:
        """
        Xử lý file văn bản (.txt).
        
        Args:
            file_path: Đường dẫn đến file txt
            
        Returns:
            Nội dung văn bản
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except UnicodeDecodeError:
            # Thử lại với encoding khác nếu utf-8 không hoạt động
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
            return content
    
    @staticmethod
    def process_csv(file_path: str) -> List[Dict[str, str]]:
        """
        Xử lý file CSV.
        
        Args:
            file_path: Đường dẫn đến file CSV
            
        Returns:
            Danh sách các dòng trong file CSV dưới dạng dict
        """
        try:
            # Thử đọc với các delimiter khác nhau
            for delimiter in [',', ';', '\t']:
                try:
                    rows = []
                    with open(file_path, 'r', encoding='utf-8', newline='') as f:
                        reader = csv.DictReader(f, delimiter=delimiter)
                        for row in reader:
                            rows.append(row)
                    
                    if rows:  # Nếu đọc được dữ liệu thì trả về
                        return rows
                except:
                    continue
            
            # Nếu không thể đọc với các delimiter thông dụng, thử với pandas
            df = pd.read_csv(file_path)
            return df.to_dict('records')
            
        except Exception as e:
            logger.error(f"Lỗi khi xử lý file CSV: {str(e)}")
            raise
    
    @staticmethod
    def process_json(file_path: str) -> Union[Dict[str, Any], List[Any]]:
        """
        Xử lý file JSON.
        
        Args:
            file_path: Đường dẫn đến file JSON
            
        Returns:
            Nội dung JSON đã được parse
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    
    @staticmethod
    def process_xlsx(file_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Xử lý file Excel (.xlsx).
        
        Args:
            file_path: Đường dẫn đến file Excel
            
        Returns:
            Dict chứa dữ liệu từ mỗi sheet trong file Excel
        """
        # Đọc file Excel với pandas
        excel_data = {}
        try:
            xl = pd.ExcelFile(file_path)
            for sheet_name in xl.sheet_names:
                df = xl.parse(sheet_name)
                excel_data[sheet_name] = df.to_dict('records')
            return excel_data
        except Exception as e:
            logger.error(f"Lỗi khi xử lý file Excel: {str(e)}")
            raise
    
    @staticmethod
    def process_docx(file_path: str) -> str:
        """
        Xử lý file Word (.docx).
        
        Args:
            file_path: Đường dẫn đến file Word
            
        Returns:
            Nội dung văn bản trích xuất từ file Word
        """
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    
    @staticmethod
    def get_content_stats(content: str) -> Dict[str, Any]:
        """
        Tính toán các thống kê về nội dung văn bản.
        
        Args:
            content: Văn bản cần phân tích
            
        Returns:
            Dict chứa các thống kê về văn bản
        """
        if not content:
            return {
                'char_count': 0,
                'word_count': 0,
                'line_count': 0,
                'avg_word_length': 0
            }
        
        # Tính số ký tự
        char_count = len(content)
        
        # Tính số dòng
        line_count = content.count('\n') + 1
        
        # Tính số từ (đơn giản)
        words = content.split()
        word_count = len(words)
        
        # Tính độ dài trung bình của từ
        if word_count > 0:
            avg_word_length = sum(len(word) for word in words) / word_count
        else:
            avg_word_length = 0
        
        return {
            'char_count': char_count,
            'word_count': word_count,
            'line_count': line_count,
            'avg_word_length': round(avg_word_length, 2)
        } 