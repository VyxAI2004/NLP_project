#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import json
import time
import random
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import logging
import codecs

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("crawler_synonyms")

# Các biểu thức chính quy để lấy từ đồng nghĩa
# Mẫu 1: Đồng nghĩa theo loại từ
PATTERN_SYNONYM1 = re.compile(r"(Danh từ|Động từ|Đại từ|Trợ từ|Tính từ|Trạng từ).+?(?:Đồng nghĩa:)(.*?$)", re.UNICODE | re.DOTALL | re.MULTILINE)

# Mẫu 2: Đồng nghĩa chung
PATTERN_SYNONYM2 = re.compile(r"(?:Đồng nghĩa:)(.*?$)", re.UNICODE | re.DOTALL | re.MULTILINE)

# Mẫu 3: Từ đồng nghĩa
PATTERN_SYNONYM3 = re.compile(r"(?:Từ đồng nghĩa:|Từ đồng nghĩa với)(.*?)(?:\n|$)", re.UNICODE | re.DOTALL)

# Mẫu 4: Synonym tiếng Anh
PATTERN_SYNONYM4 = re.compile(r"(?:Synonyms?:|Synonym:)(.*?)(?:\n|$)", re.UNICODE | re.DOTALL)

# Mẫu 5: Từ tương tự/gần nghĩa
PATTERN_SYNONYM5 = re.compile(r"(?:Từ (?:tương tự|gần nghĩa):?)(.*?)(?:\n|$)", re.UNICODE | re.DOTALL)

# Mẫu 6: Từ liên quan
PATTERN_SYNONYM6 = re.compile(r"(?:Từ liên quan|Liên quan|Cùng họ từ:?)(.*?)(?:\n|$)", re.UNICODE | re.DOTALL)

# Mẫu 7: Danh sách đánh số/gạch đầu dòng
PATTERN_SYNONYM7 = re.compile(r"(?:Đồng nghĩa)[^\n\d\-•]*((?:\d+\.|\-|•)[^\n]*)", re.UNICODE | re.DOTALL)

# Mẫu 8: Từ thường được dùng thay thế
PATTERN_SYNONYM8 = re.compile(r"(?:thay thế bằng|được thay bằng|có thể dùng)(.*?)(?:\n|$)", re.UNICODE | re.DOTALL)

# Mẫu 9: Cùng nghĩa với
PATTERN_SYNONYM9 = re.compile(r"(?:cùng nghĩa với|tương đương với)(.*?)(?:\n|$)", re.UNICODE | re.DOTALL)

# Mẫu 10: Tìm trong thẻ HTML có chứa từ "đồng nghĩa"
PATTERN_SYNONYM_HTML = re.compile(r'<\w+[^>]*>\s*(?:đồng nghĩa|từ đồng nghĩa)[^<>]*</\w+>\s*(?:<[^>]*>\s*)*(.*?)(?:<)', re.UNICODE | re.DOTALL | re.IGNORECASE)

class SynonymsCrawler:
    def __init__(self):
        """Khởi tạo crawler với cache và các thông số cơ bản"""
        self.cache_file = 'backend/data/synonyms_cache.json'
        self.crawl_delay = 1  # Thời gian chờ giữa các yêu cầu (giây)
        self._ensure_data_dir()
        self.cache = self._load_cache()
        
        # Từ đồng nghĩa mẫu để đảm bảo luôn có dữ liệu
        self.sample_synonyms = {
            "tốt": ["hay", "khá", "đẹp", "xuất sắc", "giỏi"],
            "đẹp": ["xinh", "duyên dáng", "lộng lẫy", "kiều diễm", "mỹ lệ"],
            "chạy": ["đi", "di chuyển", "vận động", "chạy trốn", "tháo chạy"],
            "xe": ["ô tô", "xe hơi", "xe cộ", "phương tiện", "đồ đi lại"],
            "nhà": ["gia đình", "tổ ấm", "nơi ở", "chốn về", "mái ấm"],
            "học": ["nghiên cứu", "tìm hiểu", "thu thập kiến thức", "trau dồi"],
            "làm": ["thực hiện", "tạo ra", "hoạt động", "hành động", "tiến hành"],
            "ăn": ["ẩm thực", "dùng bữa", "nạp năng lượng", "dùng cơm", "thưởng thức"],
            "nói": ["phát biểu", "trò chuyện", "trao đổi", "đàm thoại", "thuyết trình"],
            "vui": ["hạnh phúc", "sung sướng", "thỏa mãn", "hoan hỉ", "phấn khởi"]
        }
        
        # Đảm bảo cache có sẵn dữ liệu mẫu
        self._ensure_sample_data()
    
    def _ensure_data_dir(self):
        """Đảm bảo thư mục data tồn tại"""
        data_dir = os.path.dirname(self.cache_file)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            logger.info(f"Đã tạo thư mục {data_dir}")
    
    def _ensure_sample_data(self):
        """Đảm bảo cache có dữ liệu mẫu"""
        if not self.cache or len(self.cache) == 0:
            logger.info("Cache trống, thêm dữ liệu mẫu")
            self.cache.update(self.sample_synonyms)
            self._save_cache()
    
    def _load_cache(self):
        """Tải cache từ đồng nghĩa nếu có"""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    cache = json.load(f)
                    logger.info(f"Đã tải {len(cache)} từ từ cache")
                    return cache
            except Exception as e:
                logger.error(f"Lỗi khi đọc file cache: {str(e)}")
                return {}
        return {}
    
    def _save_cache(self):
        """Lưu cache từ đồng nghĩa"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, ensure_ascii=False, indent=2)
            logger.info(f"Đã lưu cache có {len(self.cache)} từ vào file")
        except Exception as e:
            logger.error(f"Lỗi khi lưu file cache: {str(e)}")
    
    def clear_cache(self):
        """Xóa cache từ đồng nghĩa"""
        self.cache = {}
        self._save_cache()
        logger.info("Đã xóa cache từ đồng nghĩa")
        # Thêm lại dữ liệu mẫu
        self._ensure_sample_data()
    
    def get_synonyms(self, word):
        """Lấy từ đồng nghĩa cho một từ cụ thể"""
        word_lower = word.lower()
        
        # Kiểm tra cache trước
        if word_lower in self.cache:
            logger.info(f"Đã tìm thấy cache cho từ '{word}'")
            return self.cache[word_lower]
        
        # Thử crawl từ web
        logger.info(f"Không tìm thấy '{word}' trong cache, đang tìm từ web...")
        
        try:
            # Lấy từ đồng nghĩa từ web
            synonyms = self._fetch_synonyms_from_web(word)
            
            # Lưu vào cache
            self.cache[word_lower] = synonyms
            self._save_cache()
            
            if synonyms:
                logger.info(f"Đã tìm thấy {len(synonyms)} từ đồng nghĩa cho '{word}': {synonyms}")
            else:
                logger.warning(f"Không tìm thấy từ đồng nghĩa cho '{word}'")
                
            return synonyms
                
        except Exception as e:
            logger.error(f"Lỗi khi tìm từ đồng nghĩa cho '{word}': {str(e)}", exc_info=True)
            
            # Thử dùng từ đồng nghĩa mẫu nếu có
            if word_lower in self.sample_synonyms:
                logger.info(f"Sử dụng từ đồng nghĩa mẫu cho '{word}'")
                self.cache[word_lower] = self.sample_synonyms[word_lower]
                return self.sample_synonyms[word_lower]
            
            # Nếu không có từ đồng nghĩa thì lưu danh sách trống
            self.cache[word_lower] = []
            self._save_cache()
            return []
    
    def _fetch_synonyms_from_web(self, word):
        """Hàm riêng để lấy từ đồng nghĩa từ web"""
        # Chuẩn bị URL tìm kiếm
        encoded_word = urllib.parse.quote(word)
        search_url = f"http://tratu.soha.vn/dict/vn_vn/{encoded_word}"
        logger.info(f"Tìm từ đồng nghĩa cho '{word}' từ URL: {search_url}")
        
        # Thiết lập headers để giả lập trình duyệt
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        }
        
        # Tạo request với headers
        req = urllib.request.Request(search_url, headers=headers)
        
        try:
            # Lấy nội dung trang
            response = urllib.request.urlopen(req, timeout=10)
            source = response.read()
            
            # Log code response
            logger.info(f"Response code: {response.getcode()}")
            
            # Kiểm tra nếu trang chuyển hướng
            if response.geturl() != search_url:
                logger.info(f"Đã chuyển hướng từ '{search_url}' tới '{response.geturl()}'")
                
            soup = BeautifulSoup(source, "html.parser")
            
            # Lấy từ gốc chính xác từ trang (có thể khác với từ tìm kiếm do chuyển hướng)
            the_input = soup.find('input', id='search')
            tu_goc = the_input['value'].lower() if the_input else word.lower()
            
            # Lấy nội dung văn bản
            content = soup.get_text()
            
            # Kiểm tra xem từ có tồn tại trên từ điển không
            if "Không tìm thấy" in content and "trong từ điển" in content:
                logger.warning(f"Từ '{word}' không tồn tại trong từ điển")
                return []
            
            # Thử URL thứ hai nếu cần
            if "Không tìm thấy" in content:
                try:
                    # Thử tìm trên một từ điển khác
                    second_url = f"https://vtudien.com/viet-viet/dictionary/nghia-cua-tu-{encoded_word}"
                    logger.info(f"Thử tìm trên URL thứ hai: {second_url}")
                    
                    req2 = urllib.request.Request(second_url, headers=headers)
                    response2 = urllib.request.urlopen(req2, timeout=10)
                    source2 = response2.read()
                    
                    soup2 = BeautifulSoup(source2, "html.parser")
                    content2 = soup2.get_text()
                    content += "\n" + content2  # Gộp nội dung để tìm kiếm
                    
                    logger.info("Đã thêm nội dung từ nguồn thứ hai")
                except Exception as e:
                    logger.warning(f"Không thể lấy dữ liệu từ nguồn thứ hai: {e}")
            
            synonyms = []
            
            # Áp dụng tất cả các mẫu biểu thức chính quy
            patterns = [
                PATTERN_SYNONYM1, PATTERN_SYNONYM2, PATTERN_SYNONYM3, 
                PATTERN_SYNONYM4, PATTERN_SYNONYM5, PATTERN_SYNONYM6, 
                PATTERN_SYNONYM7, PATTERN_SYNONYM8, PATTERN_SYNONYM9
            ]
            
            # Xử lý từng mẫu biểu thức chính quy
            for i, pattern in enumerate(patterns):
                matches = pattern.findall(content)
                logger.debug(f"Mẫu {i+1}: Tìm thấy {len(matches)} kết quả")
                
                if matches:
                    for match in matches:
                        # Xử lý kết quả theo từng mẫu
                        if isinstance(match, tuple):
                            # Đối với patterns trả về tuples (như PATTERN_SYNONYM1)
                            synonyms_text = match[-1].strip()  # Lấy phần cuối cùng chứa synonyms
                        else:
                            # Đối với patterns trả về strings
                            synonyms_text = match.strip()
                        
                        # Tách các từ đồng nghĩa
                        for syn in re.split(r',|;|\n|\.', synonyms_text):
                            syn = syn.strip()
                            # Loại bỏ các từ không hợp lệ
                            if syn and syn.lower() != tu_goc and len(syn) > 1:
                                synonyms.append(syn)
            
            # Thử tìm từ đồng nghĩa qua HTML
            html_matches = PATTERN_SYNONYM_HTML.findall(str(soup))
            for match in html_matches:
                match_text = match.strip()
                for syn in re.split(r',|;|\n|\.', match_text):
                    syn = syn.strip()
                    if syn and syn.lower() != tu_goc and len(syn) > 1:
                        synonyms.append(syn)
            
            # Tìm trong các thẻ đặc biệt
            synonym_sections = soup.find_all(['div', 'span', 'p'], 
                                          string=lambda s: s and any(term in s.lower() for term in ['đồng nghĩa', 'từ đồng nghĩa', 'tương tự', 'cùng nghĩa']))
            
            for section in synonym_sections:
                next_el = section.find_next(['p', 'div', 'span', 'ul', 'li'])
                if next_el:
                    text = next_el.get_text().strip()
                    for syn in re.split(r',|;|\n|\.', text):
                        syn = syn.strip()
                        if syn and syn.lower() != tu_goc and len(syn) > 1:
                            synonyms.append(syn)
            
            # Loại bỏ trùng lặp và giữ thứ tự
            unique_synonyms = []
            seen = set()
            for syn in synonyms:
                if syn.lower() not in seen:
                    # Loại bỏ các từ không hợp lệ
                    if len(syn) > 1 and not any(c.isdigit() for c in syn) and syn.lower() != tu_goc:
                        seen.add(syn.lower())
                        unique_synonyms.append(syn)
            
            logger.info(f"Đã tìm được {len(unique_synonyms)} từ đồng nghĩa duy nhất")
            
            # Nếu vẫn không tìm thấy từ đồng nghĩa, thử sử dụng từ đồng nghĩa mẫu
            if not unique_synonyms and tu_goc in self.sample_synonyms:
                logger.info(f"Không tìm thấy từ đồng nghĩa cho '{tu_goc}', sử dụng từ đồng nghĩa mẫu")
                return self.sample_synonyms[tu_goc]
            
            return unique_synonyms
            
        except Exception as e:
            logger.error(f"Lỗi khi truy cập web để tìm từ đồng nghĩa: {str(e)}", exc_info=True)
            
            # Nếu có từ đồng nghĩa mẫu, trả về từ đồng nghĩa mẫu
            if word.lower() in self.sample_synonyms:
                logger.info(f"Sử dụng từ đồng nghĩa mẫu cho '{word}' do lỗi khi truy cập web")
                return self.sample_synonyms[word.lower()]
            
            return []
    
    def batch_get_synonyms(self, words):
        """Lấy từ đồng nghĩa cho một danh sách từ"""
        results = {}
        for word in words:
            word = word.strip().lower()
            if word:
                results[word] = self.get_synonyms(word)
                # Tạm dừng để tránh tải quá nhiều request
                time.sleep(self.crawl_delay)
        return results

# Khởi tạo crawler
synonyms_crawler = SynonymsCrawler() 