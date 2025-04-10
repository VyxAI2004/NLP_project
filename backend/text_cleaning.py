#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re
import unicodedata
import logging
import json
import os
from typing import Optional, List, Dict, Tuple, Any

# Thêm import spacy
import spacy
import sys

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('text_cleaning')

nlp = None
model_loaded = False


# Regular expressions cho việc làm sạch văn bản
HTML_TAG_PATTERN = re.compile(r'<.*?>')
URL_PATTERN = re.compile(r'https?://\S+|www\.\S+')
EMAIL_PATTERN = re.compile(r'\S+@\S+\.\S+')
PHONE_PATTERN = re.compile(r'(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3,4}[- ]?\d{4}')
SPECIAL_CHARS_PATTERN = re.compile(r'[^\w\s\.,;:!?\-]')
PUNCTUATION_PATTERN = re.compile(r'[^\w\s]')
DIGITS_PATTERN = re.compile(r'\d+')
EXTRA_WHITESPACE_PATTERN = re.compile(r'\s+')
SENTENCE_PATTERN = re.compile(r'([.!?])\s*')
WORD_PATTERN = re.compile(r'\b(\w+)\b')

# Từ viết tắt phổ biến trong tiếng Việt
VIETNAMESE_ABBREVIATIONS = {
    'ko': 'không',
    'k': 'không',
    'kh': 'không',
    'đc': 'được',
    'dc': 'được',
    'vs': 'với',
    'vn': 'Việt Nam',
    'tq': 'Trung Quốc',
    'hq': 'Hàn Quốc',
    'nq': 'Nhật Bản',
    'tl': 'thảo luận',
    'vv': 'vân vân',
    'nvv': 'này vân vân',
    'cvv': 'cùng vân vân',
    'đvv': 'đại vân vân',
    'nvđ': 'người vô địch',
    'tlsp': 'thảo luận sản phẩm',
    'tpb': 'thành phố',
    'tp': 'thành phố',
    'hcm': 'Hồ Chí Minh',
    'hn': 'Hà Nội',
    'đn': 'Đà Nẵng',
    'sg': 'Sài Gòn',
    'nt': 'nhắn tin',
    'ib': 'inbox',
    'đt': 'điện thoại',
    'sđt': 'số điện thoại',
    'ms': 'mới',
    'tgdd': 'Thế giới di động',
    'fpt': 'FPT',
    'cty': 'công ty',
    'ctcp': 'công ty cổ phần',
    'tnhh': 'trách nhiệm hữu hạn',
    'sxkd': 'sản xuất kinh doanh',
    'đvvc': 'đơn vị vận chuyển',
    'tknh': 'tài khoản ngân hàng',
    'tttt': 'thanh toán trực tiếp',
    'ck': 'chuyển khoản',
    'vcb': 'Vietcombank',
    'acb': 'ACB',
    'tcb': 'Techcombank',
    'tpb': 'TPBank',
    'bidv': 'BIDV',
    'atm': 'ATM',
    'ql': 'quản lý',
    'tv': 'thành viên',
    'kh': 'khách hàng',
    'nv': 'nhân viên',
    'nb': 'người bán',
    'nm': 'người mua',
    'bgd': 'ban giám đốc',
    'tgđ': 'tổng giám đốc',
    'pgđ': 'phó giám đốc',
    'kt': 'kế toán',
    'ns': 'nhân sự',
    'hc': 'hành chính',
    'cn': 'chi nhánh',
    'ttcn': 'thông tin cá nhân',
    'đvt': 'đơn vị tính',
    'sl': 'số lượng',
    'đg': 'đơn giá',
    'đjề': 'để',
    'đjêu': 'điều',
    'đjnh': 'định',
    'đjịa': 'địa',
    'sphẩm': 'sản phẩm',
    'sp': 'sản phẩm',
    'kq': 'kết quả',
    'vđ': 'vấn đề',
    'vđề': 'vấn đề',
    'trc': 'trước',
    'cảm ơn': 'cảm ơn',
    'c.o': 'cảm ơn',
    'co': 'cảm ơn',
    'thanks': 'cảm ơn',
    'thank': 'cảm ơn',
    'tks': 'cảm ơn',
    'tk': 'cảm ơn',
    'thks': 'cảm ơn',
}

# Stopwords tiếng Việt
VIETNAMESE_STOPWORDS = set([
    "và", "hoặc", "là", "của", "cho", "trong", "với", "về", "từ", "bởi", "mà", "như", "từng",
    "các", "những", "cũng", "thì", "để", "nên", "vì", "khi", "nếu", "tới", "theo", "đến",
    "được", "tại", "trên", "ra", "vào", "nhưng", "có", "không", "này", "kia", "một", "hai",
    "ba", "bốn", "năm", "mười", "mươi", "chục", "trăm", "nghìn", "triệu", "tỷ", "rằng", "thế",
    "đây", "đó", "ở", "đang", "sẽ", "đã", "sự", "việc", "rất", "nhiều", "phải", "lại", "sau",
    "trước", "nữa", "thêm", "vậy", "nhất", "cùng", "chỉ", "tất", "cả", "thường", "vẫn", "mỗi",
    "đều", "mọi", "ai", "tôi", "anh", "chị", "em", "ta", "chúng", "họ", "bạn", "bà", "ông",
    "hơn", "đó", "mình", "làm", "hãy", "nào", "sao", "thấy", "biết", "sao", "vừa", "lên",
    "xuống", "quá", "đang", "mới", "hết", "luôn", "lại", "vẫn", "đấy", "vẫn", "đi", "làm",
    "thấy", "biết", "nói", "chỉ", "mới"
])

# Định nghĩa các mẫu và chuỗi đặc biệt cho việc tách câu
SENTENCE_ENDING_CHARS = '.!?'
VIETNAMESE_ABBREVIATIONS_LIST = [
    'TS.', 'PGS.', 'GS.', 'ThS.', 'BS.', 'KS.', 'ĐH.', 'Th.S', 'T.S', 'P.GS', 'G.S',
    'TT.', 'TBT.', 'UBND.', 'HĐND.', 'MTTQ.', 'TP.', 'P.', 'Q.', 'T.', 'H.', 'X.',
    'CT.', 'PCT.', 'BTK.', 'VD.', 'TL.', 'KTT.', 'MS.', 'NB.',
    'Tp.', 'Fr.', 'St.', 'Mt.', 'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Ltd.', 'Co.', 'Inc.',
    'T.Ư', 'U.B', 'v.v.', 'v.v',
    # Thêm các từ viết tắt khác mà có dấu chấm
]

# Pattern mở rộng để tìm các dấu câu kết thúc nhưng không phải từ viết tắt
SENTENCE_PATTERN_IMPROVED = re.compile(r'([.!?]+)(?:\s+|$)')

# Pattern để nhận diện câu sau khi tách
CLEAN_SENTENCE_PATTERN = re.compile(r'^\s*[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸA-zàáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]')

def clean_text(
    text: str,
    normalize_unicode: bool = True,
    remove_html: bool = True,
    remove_urls: bool = True,
    remove_emails: bool = True,
    remove_phone_numbers: bool = True,
    remove_special_chars: bool = False,
    custom_special_chars: str = None,
    remove_punctuation: bool = False,
    remove_digits: bool = False,
    lowercase: bool = True,
    remove_extra_whitespace: bool = True,
    abbreviation_correction: bool = False,
    stopwords_removal: bool = False
) -> str:
    """
    Làm sạch văn bản với nhiều tùy chọn.
    
    Args:
        text: Văn bản cần làm sạch
        normalize_unicode: Chuyển đổi Unicode sang dạng chuẩn hóa
        remove_html: Xóa các thẻ HTML
        remove_urls: Xóa các đường dẫn URL
        remove_emails: Xóa các địa chỉ email
        remove_phone_numbers: Xóa các số điện thoại
        remove_special_chars: Xóa các ký tự đặc biệt
        custom_special_chars: Chuỗi các ký tự đặc biệt cần xóa (nếu None thì xóa tất cả)
        remove_punctuation: Xóa dấu câu
        remove_digits: Xóa các chữ số
        lowercase: Chuyển về chữ thường
        remove_extra_whitespace: Loại bỏ khoảng trắng thừa
        abbreviation_correction: Sửa các từ viết tắt
        stopwords_removal: Loại bỏ các từ dừng
        
    Returns:
        Văn bản đã được làm sạch
    """
    if not text or not isinstance(text, str):
        logger.warning(f"Văn bản đầu vào trống hoặc không phải chuỗi: {text}")
        return ""
    
    logger.debug(f"Văn bản ban đầu: '{text[:100]}...'")
    
    # Chuẩn hóa Unicode
    if normalize_unicode:
        text = unicodedata.normalize('NFC', text)
        logger.debug("Đã chuẩn hóa Unicode")
    
    # Xóa các thẻ HTML
    if remove_html:
        text = HTML_TAG_PATTERN.sub(' ', text)
        logger.debug("Đã xóa các thẻ HTML")
    
    # Xóa các đường dẫn URL
    if remove_urls:
        text = URL_PATTERN.sub(' ', text)
        logger.debug("Đã xóa các đường dẫn URL")
    
    # Xóa các địa chỉ email
    if remove_emails:
        text = EMAIL_PATTERN.sub(' ', text)
        logger.debug("Đã xóa các địa chỉ email")
    
    # Xóa các số điện thoại
    if remove_phone_numbers:
        text = PHONE_PATTERN.sub(' ', text)
        logger.debug("Đã xóa các số điện thoại")
    
    # Sửa từ viết tắt (trước khi làm sạch các ký tự đặc biệt)
    if abbreviation_correction:
        text = correct_abbreviations(text)
        logger.debug("Đã sửa các từ viết tắt")
    
    # Chuyển về chữ thường (trước khi xử lý các từ dừng)
    if lowercase:
        text = text.lower()
        logger.debug("Đã chuyển về chữ thường")
    
    # Xóa các ký tự đặc biệt
    if remove_special_chars:
        logger.debug("Đang xóa các ký tự đặc biệt")
        if custom_special_chars:
            # Tạo pattern từ các ký tự tùy chỉnh
            escaped_chars = re.escape(custom_special_chars)
            pattern = re.compile(f'[{escaped_chars}]')
            text = pattern.sub(' ', text)
            logger.debug(f"Đã xóa các ký tự đặc biệt tùy chỉnh: {custom_special_chars}")
        else:
            text = SPECIAL_CHARS_PATTERN.sub(' ', text)
            logger.debug("Đã xóa tất cả các ký tự đặc biệt")
        logger.debug(f"Văn bản sau khi xóa ký tự đặc biệt: '{text[:100]}...'")
    
    # Xóa dấu câu
    if remove_punctuation:
        text = PUNCTUATION_PATTERN.sub(' ', text)
        logger.debug("Đã xóa dấu câu")
    
    # Xóa các chữ số
    if remove_digits:
        text = DIGITS_PATTERN.sub(' ', text)
        logger.debug("Đã xóa các chữ số")
    
    # Loại bỏ khoảng trắng thừa
    if remove_extra_whitespace:
        text = EXTRA_WHITESPACE_PATTERN.sub(' ', text).strip()
        logger.debug("Đã loại bỏ khoảng trắng thừa")
    
    # Loại bỏ các từ dừng
    if stopwords_removal:
        text = remove_stopwords(text)
        logger.debug("Đã loại bỏ các từ dừng")
    
    logger.debug(f"Văn bản sau khi làm sạch: '{text[:100]}...'")
    return text

def correct_abbreviations(text: str) -> str:
    """
    Sửa các từ viết tắt trong văn bản tiếng Việt.
    
    Args:
        text: Văn bản cần sửa
        
    Returns:
        Văn bản sau khi sửa các từ viết tắt
    """
    words = text.split()
    corrected_words = []
    
    for word in words:
        # Kiểm tra từ có phải là từ viết tắt không
        lower_word = word.lower()
        if lower_word in VIETNAMESE_ABBREVIATIONS:
            corrected_words.append(VIETNAMESE_ABBREVIATIONS[lower_word])
            logger.debug(f"Đã sửa từ viết tắt '{word}' thành '{VIETNAMESE_ABBREVIATIONS[lower_word]}'")
        else:
            corrected_words.append(word)
    
    return ' '.join(corrected_words)

def remove_stopwords(text: str) -> str:
    """
    Loại bỏ các từ dừng trong văn bản tiếng Việt.
    
    Args:
        text: Văn bản cần xử lý
        
    Returns:
        Văn bản sau khi loại bỏ các từ dừng
    """
    words = text.split()
    filtered_words = [word for word in words if word.lower() not in VIETNAMESE_STOPWORDS]
    return ' '.join(filtered_words)

def tokenize_sentences(text: str) -> List[str]:
    """
    Phân tách văn bản tiếng Việt thành các câu sử dụng phương pháp dựa trên quy tắc.
    Cải tiến với việc xử lý từ viết tắt và các trường hợp đặc biệt trong tiếng Việt.
    
    Args:
        text: Văn bản cần phân tách
        
    Returns:
        Danh sách các câu
    """
    if not text or not isinstance(text, str):
        logger.warning("Văn bản trống hoặc không phải chuỗi ký tự")
        return []
    
    logger.debug("Bắt đầu phân tách câu với phương pháp nâng cao")
    
    # Chuẩn bị văn bản
    text = text.strip()
    
    # Tách văn bản thành đoạn văn
    paragraphs = text.split('\n')
    sentences = []
    
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        
        # Đánh dấu các từ viết tắt để tránh nhầm với dấu kết thúc câu
        for abbr in VIETNAMESE_ABBREVIATIONS_LIST:
            # Thay thế từ viết tắt với một đánh dấu đặc biệt
            pattern = re.compile(r'\b' + re.escape(abbr) + r'(?=\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ])')
            paragraph = pattern.sub(abbr.replace('.', '<punkt>'), paragraph)
        
        # Thêm dấu cách sau dấu câu (để dễ tách câu)
        for char in SENTENCE_ENDING_CHARS:
            paragraph = paragraph.replace(char, char + ' ')
        
        # Phân tách câu dựa trên dấu kết thúc câu và kiểm tra chữ cái đầu tiên của câu mới
        # (Một câu mới thường bắt đầu bằng chữ hoa hoặc chữ số)
        potential_sentences = []
        start = 0
        
        for match in SENTENCE_PATTERN_IMPROVED.finditer(paragraph):
            end = match.end()
            # Lấy văn bản từ vị trí bắt đầu đến dấu kết thúc
            potential_sent = paragraph[start:end].strip()
            
            # Kiểm tra nếu câu không rỗng
            if potential_sent:
                # Khôi phục các dấu chấm trong từ viết tắt
                potential_sent = potential_sent.replace('<punkt>', '.')
                potential_sentences.append(potential_sent)
            
            start = end
        
        # Xử lý phần văn bản còn lại (nếu có)
        if start < len(paragraph):
            rest = paragraph[start:].strip()
            if rest:
                rest = rest.replace('<punkt>', '.')
                potential_sentences.append(rest)
        
        # Xử lý các câu tiềm năng
        current_sentence = ""
        for i, pot_sent in enumerate(potential_sentences):
            is_sentence_start = True
            
            # Nếu câu quá ngắn hoặc không có chữ cái đầu tiên ở đầu, có thể là phần của câu trước
            if len(pot_sent.strip()) < 3 or (i > 0 and not CLEAN_SENTENCE_PATTERN.match(pot_sent)):
                if current_sentence:
                    # Gộp với câu trước
                    current_sentence += " " + pot_sent
                else:
                    current_sentence = pot_sent
                is_sentence_start = False
            else:
                # Nếu đã có câu hiện tại, lưu lại và bắt đầu câu mới
                if current_sentence:
                    sentences.append(current_sentence.strip())
                current_sentence = pot_sent
        
        # Đảm bảo câu cuối cùng được thêm vào
        if current_sentence:
            sentences.append(current_sentence.strip())
    
    # Loại bỏ các câu trống
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Kết hợp các câu quá ngắn (có thể là phần của câu trước)
    combined_sentences = []
    current = ""
    
    for s in sentences:
        if len(s) < 10 and not s[-1] in SENTENCE_ENDING_CHARS and combined_sentences:
            # Nếu câu quá ngắn và không kết thúc bằng dấu câu, kết hợp với câu trước
            combined_sentences[-1] = combined_sentences[-1] + " " + s
        else:
            combined_sentences.append(s)
    
    logger.debug(f"Đã phân tách văn bản thành {len(combined_sentences)} câu với phương pháp nâng cao")
    return combined_sentences

def spacy_tokenize_words(text: str) -> List[str]:
    """
    Phân tách văn bản thành các từ sử dụng spaCy.
    
    Args:
        text: Văn bản cần phân tách
        
    Returns:
        Danh sách các từ
    """
    if nlp is None:
        logger.warning("Mô hình spaCy chưa được tải. Sử dụng phương pháp phân tách từ thông thường.")
        return tokenize_words(text)
    
    try:
        doc = nlp(text)
        # Lấy các token, loại bỏ dấu câu và khoảng trắng
        words = [token.text for token in doc if not token.is_punct and not token.is_space]
        
        logger.debug(f"Đã phân tách văn bản thành {len(words)} từ sử dụng spaCy")
        return words
    except Exception as e:
        logger.error(f"Lỗi khi tách từ với spaCy: {str(e)}")
        return tokenize_words(text)

def spacy_tag_parts_of_speech(text: str) -> List[Tuple[str, str]]:
    """
    Gán nhãn từ loại cho các từ trong văn bản tiếng Việt sử dụng spaCy.
    
    Args:
        text: Văn bản cần gán nhãn
        
    Returns:
        Danh sách các cặp (từ, nhãn từ loại)
    """
    if nlp is None:
        logger.warning("Mô hình spaCy chưa được tải. Sử dụng phương pháp gán nhãn từ loại đơn giản.")
        return tag_parts_of_speech(text)
    
    # Kiểm tra xem mô hình có hỗ trợ gán nhãn từ loại không
    if "tagger" in nlp.pipe_names:
        try:
            doc = nlp(text)
            pos_tags = [(token.text, token.pos_) for token in doc]
            
            logger.debug(f"Đã gán nhãn từ loại cho {len(pos_tags)} từ sử dụng spaCy")
            return pos_tags
        except Exception as e:
            logger.error(f"Lỗi khi gán nhãn từ loại với spaCy: {str(e)}")
            return tag_parts_of_speech(text)
    else:
        logger.warning("Mô hình không hỗ trợ gán nhãn từ loại. Sử dụng phương pháp gán nhãn từ loại đơn giản.")
        return tag_parts_of_speech(text)

def spacy_get_entities(text: str) -> List[Tuple[str, str]]:
    """
    Nhận diện thực thể có tên (Named Entity Recognition) trong văn bản tiếng Việt sử dụng spaCy.
    
    Args:
        text: Văn bản cần nhận diện thực thể
        
    Returns:
        Danh sách các cặp (thực thể, loại thực thể)
    """
    if nlp is None:
        logger.warning("Mô hình spaCy chưa được tải. Không thể nhận diện thực thể.")
        return []
    
    # Kiểm tra xem mô hình có hỗ trợ nhận diện thực thể không
    if "ner" in nlp.pipe_names:
        try:
            doc = nlp(text)
            entities = [(ent.text, ent.label_) for ent in doc.ents]
            
            logger.debug(f"Đã nhận diện {len(entities)} thực thể sử dụng spaCy")
            return entities
        except Exception as e:
            logger.error(f"Lỗi khi nhận diện thực thể với spaCy: {str(e)}")
            return []
    else:
        logger.warning("Mô hình không hỗ trợ nhận diện thực thể.")
        return []

def spacy_dependency_parse(text: str) -> Dict[str, Any]:
    """
    Phân tích cú pháp phụ thuộc (dependency parsing) trong văn bản tiếng Việt sử dụng spaCy.
    
    Args:
        text: Văn bản cần phân tích
        
    Returns:
        Cấu trúc cú pháp phụ thuộc
    """
    if nlp is None:
        logger.warning("Mô hình spaCy chưa được tải. Sử dụng phương pháp phân tích cú pháp đơn giản.")
        return parse_syntax(text)
    
    # Kiểm tra xem mô hình có hỗ trợ phân tích cú pháp phụ thuộc không
    if "parser" in nlp.pipe_names:
        try:
            doc = nlp(text)
            sentences = []
            
            for sent in doc.sents:
                tokens = []
                for token in sent:
                    token_info = {
                        "text": token.text,
                        "pos": token.pos_,
                    }
                    
                    # Thêm các thuộc tính khác nếu có
                    if hasattr(token, "tag_"):
                        token_info["tag"] = token.tag_
                    if hasattr(token, "dep_"):
                        token_info["dep"] = token.dep_
                    if hasattr(token, "head") and hasattr(token.head, "text"):
                        token_info["head"] = token.head.text
                    if hasattr(token.head, "pos_"):
                        token_info["head_pos"] = token.head.pos_
                    if hasattr(token, "children"):
                        token_info["children"] = [child.text for child in token.children]
                    
                    tokens.append(token_info)
                
                sentences.append({
                    "text": sent.text,
                    "tokens": tokens,
                    "length": len(tokens)
                })
            
            logger.debug(f"Đã phân tích cú pháp phụ thuộc cho {len(sentences)} câu sử dụng spaCy")
            return {"sentences": sentences}
        except Exception as e:
            logger.error(f"Lỗi khi phân tích cú pháp phụ thuộc với spaCy: {str(e)}")
            return parse_syntax(text)
    else:
        logger.warning("Mô hình không hỗ trợ phân tích cú pháp phụ thuộc. Sử dụng phương pháp phân tích cú pháp đơn giản.")
        return parse_syntax(text)

def tokenize_words(text: str) -> List[str]:
    """
    Phân tách văn bản thành các từ.
    
    Args:
        text: Văn bản cần phân tách
        
    Returns:
        Danh sách các từ
    """
    # Phân tách theo khoảng trắng và giữ lại các từ có ít nhất 1 ký tự
    words = [word for word in text.split() if word]
    
    logger.debug(f"Đã phân tách văn bản thành {len(words)} từ")
    return words

def tag_parts_of_speech(text: str) -> List[Tuple[str, str]]:
    """
    Gán nhãn từ loại cho các từ trong văn bản tiếng Việt.
    Đây là phiên bản đơn giản, không sử dụng các thư viện chuyên dụng.
    
    Args:
        text: Văn bản cần gán nhãn
        
    Returns:
        Danh sách các cặp (từ, nhãn từ loại)
    """
    logger.warning("Gán nhãn từ loại đơn giản - không chính xác cho ứng dụng thực tế")
    words = tokenize_words(text)
    
    # Từ điển nhãn từ loại đơn giản
    pos_tags = []
    for word in words:
        # Đây là phiên bản đơn giản chỉ để minh họa
        # Trong thực tế, cần sử dụng các thư viện NLP chuyên dụng như underthesea
        if word in ["và", "hoặc", "nhưng", "tuy", "song", "hay", "vì", "bởi"]:
            pos_tags.append((word, "CC"))  # Liên từ
        elif word in ["của", "cho", "với", "từ", "đến", "về", "trong"]:
            pos_tags.append((word, "IN"))  # Giới từ
        elif word in ["tôi", "bạn", "anh", "chị", "họ", "chúng ta", "nó"]:
            pos_tags.append((word, "PN"))  # Đại từ
        elif word in ["là", "được", "bị", "có", "không"]:
            pos_tags.append((word, "VB"))  # Động từ
        elif word in ["rất", "khá", "hơi", "quá", "lắm"]:
            pos_tags.append((word, "RB"))  # Trạng từ
        elif re.match(r'^\d+$', word):
            pos_tags.append((word, "CD"))  # Số
        else:
            pos_tags.append((word, "NN"))  # Mặc định là danh từ
    
    logger.debug(f"Đã gán nhãn từ loại cho {len(pos_tags)} từ")
    return pos_tags

def parse_syntax(text: str) -> Dict[str, Any]:
    """
    Phân tích cú pháp văn bản tiếng Việt.
    Đây là phiên bản đơn giản, không sử dụng các thư viện chuyên dụng.
    
    Args:
        text: Văn bản cần phân tích
        
    Returns:
        Cấu trúc cú pháp đơn giản
    """
    logger.warning("Phân tích cú pháp đơn giản - không chính xác cho ứng dụng thực tế")
    sentences = tokenize_sentences(text)
    
    result = []
    for sentence in sentences:
        pos_tags = tag_parts_of_speech(sentence)
        
        # Phân tích cú pháp đơn giản
        sentence_structure = {
            "text": sentence,
            "tokens": [token for token, _ in pos_tags],
            "pos_tags": pos_tags,
            "length": len(pos_tags)
        }
        
        result.append(sentence_structure)
    
    logger.debug(f"Đã phân tích cú pháp cho {len(result)} câu")
    return {"sentences": result}

def demo_spacy_processing(text: str) -> Dict[str, Any]:
    """
    Hàm demo xử lý văn bản bằng spaCy, giúp hiển thị kết quả của các
    chức năng như tách câu, tách từ và gán nhãn từ loại.
    
    Args:
        text: Văn bản cần xử lý
        
    Returns:
        Dict chứa kết quả xử lý
    """
    # Làm sạch văn bản đầu vào
    cleaned_text = clean_text(
        text,
        normalize_unicode=True,
        remove_html=True,
        remove_urls=True,
        remove_emails=True,
        remove_extra_whitespace=True
    )
    
    # Phân tách câu
    sentences = tokenize_sentences(cleaned_text)
    
    # Phân tách từ
    words = spacy_tokenize_words(cleaned_text)
    
    # Gán nhãn từ loại
    pos_tags = spacy_tag_parts_of_speech(cleaned_text)
    
    # Nhận diện thực thể
    entities = spacy_get_entities(cleaned_text)
    
    # Tạo kết quả đầu ra
    result = {
        "original_text": text,
        "cleaned_text": cleaned_text,
        "sentences": sentences,
        "word_count": len(words),
        "words": words,
        "pos_tags": pos_tags,
        "entities": entities
    }
    
    # In kết quả
    print("\n===== KẾT QUẢ XỬ LÝ VĂN BẢN =====")
    print(f"Văn bản gốc: {text}")
    print(f"Văn bản đã làm sạch: {cleaned_text}")
    print(f"\nSố câu: {len(sentences)}")
    for i, sentence in enumerate(sentences, 1):
        print(f"Câu {i}: {sentence}")
    
    print(f"\nSố từ: {len(words)}")
    print(f"Các từ: {', '.join(words[:20])}...")
    
    print(f"\nGán nhãn từ loại (20 từ đầu tiên):")
    for word, pos in pos_tags[:20]:
        print(f"{word} ({pos})", end=" | ")
    
    print(f"\n\nCác thực thể được nhận diện:")
    for entity, label in entities:
        print(f"{entity} ({label})", end=" | ")
    
    print("\n==========================================\n")
    
    return result

def process_text_as_json(text: str) -> Dict[str, Any]:
    """
    Xử lý văn bản và trả về kết quả ở định dạng JSON để hiển thị trên giao diện.
    
    Args:
        text: Văn bản cần xử lý
        
    Returns:
        Dict chứa kết quả xử lý có thể chuyển thành JSON
    """
    try:
        # Bắt đầu đo thời gian
        import time
        start_time = time.time()
        
        # Làm sạch văn bản đầu vào
        cleaned_text = clean_text(
            text,
            normalize_unicode=True,
            remove_html=True,
            remove_urls=True,
            remove_emails=True,
            remove_extra_whitespace=True
        )
        
        # Phân tách câu
        sentences = tokenize_sentences(cleaned_text)
        
        # Phân tách từ
        words = spacy_tokenize_words(cleaned_text)
        
        # Gán nhãn từ loại
        pos_tags = spacy_tag_parts_of_speech(cleaned_text)
        pos_tags_dict = [{"word": word, "pos": pos} for word, pos in pos_tags]
        
        # Nhận diện thực thể
        entities = spacy_get_entities(cleaned_text)
        entities_dict = [{"entity": entity, "label": label} for entity, label in entities]
        
        # Kết thúc đo thời gian
        processing_time = time.time() - start_time
        
        # Tạo kết quả đầu ra
        result = {
            "status": "success",
            "original_text": text,
            "cleaned_text": cleaned_text,
            "sentences": sentences,
            "word_count": len(words),
            "words": words,
            "pos_tags": pos_tags_dict,
            "entities": entities_dict,
            "processing_time": round(processing_time, 3)
        }
        
        logger.info(f"Đã xử lý văn bản thành công trong {processing_time:.3f} giây")
        return result
    
    except Exception as e:
        logger.error(f"Lỗi khi xử lý văn bản: {str(e)}")
        return {
            "status": "error",
            "error_message": str(e),
            "original_text": text
        }

# Cập nhật hàm process_request để sử dụng vector encoding từ module mới
def process_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Xử lý yêu cầu từ giao diện web và trả về kết quả.
    
    Args:
        request_data: Dữ liệu yêu cầu, bao gồm văn bản và các tùy chọn
        
    Returns:
        Dict chứa kết quả xử lý
    """
    try:
        text = request_data.get("text", "")
        if not text.strip():
            return {"status": "error", "error_message": "Văn bản trống"}
        
        # Lấy các tùy chọn nếu có
        options = request_data.get("options", {})
        
        # Thực hiện xử lý với các tùy chọn
        if options:
            cleaned_text = clean_text(
                text,
                normalize_unicode=options.get("normalize_unicode", True),
                remove_html=options.get("remove_html", True),
                remove_urls=options.get("remove_urls", True),
                remove_emails=options.get("remove_emails", True),
                remove_phone_numbers=options.get("remove_phone_numbers", True),
                remove_special_chars=options.get("remove_special_chars", False),
                remove_punctuation=options.get("remove_punctuation", False),
                remove_digits=options.get("remove_digits", False),
                lowercase=options.get("lowercase", True),
                remove_extra_whitespace=options.get("remove_extra_whitespace", True),
                abbreviation_correction=options.get("abbreviation_correction", False),
                stopwords_removal=options.get("stopwords_removal", False)
            )
        else:
            # Sử dụng các giá trị mặc định
            cleaned_text = clean_text(text)
        
        # Xử lý theo yêu cầu
        result = {}
        
        # Luôn thêm văn bản gốc và đã làm sạch
        result["original_text"] = text
        result["cleaned_text"] = cleaned_text
        
        # Tách câu nếu được yêu cầu
        if options.get("sentence_segmentation", True):
            result["sentences"] = tokenize_sentences(cleaned_text)
        
        # Tách từ nếu được yêu cầu
        if options.get("word_tokenization", True):
            words = spacy_tokenize_words(cleaned_text)
            result["words"] = words
            result["word_count"] = len(words)
        
        # Gán nhãn từ loại nếu được yêu cầu
        if options.get("pos_tagging", False):
            pos_tags = spacy_tag_parts_of_speech(cleaned_text)
            result["pos_tags"] = [{"word": word, "pos": pos} for word, pos in pos_tags]
        
        # Nhận diện thực thể nếu được yêu cầu
        if options.get("ner", False):
            entities = spacy_get_entities(cleaned_text)
            result["entities"] = [{"entity": entity, "label": label} for entity, label in entities]
            
        # Mã hóa one-hot nếu được yêu cầu
        if options.get("one_hot_encoding", False):
            # Import động để tránh import cycle
            from text_vectorization import one_hot_encode
            one_hot_result = one_hot_encode(cleaned_text, display_table=False)
            result["one_hot_encoding"] = {
                "words": one_hot_result["words"],
                "matrix": one_hot_result["one_hot_matrix"].tolist(),
                "features": one_hot_result["feature_names"].tolist()
            }
        
        result["status"] = "success"
        return result
        
    except Exception as e:
        logger.error(f"Lỗi khi xử lý yêu cầu: {str(e)}")
        return {
            "status": "error", 
            "error_message": str(e),
            "original_text": request_data.get("text", "")
        }

# Thêm mã thực thi khi file được chạy trực tiếp
if __name__ == "__main__":
    # Các ví dụ văn bản tiếng Việt để demo
    example_texts = [
        "Hôm nay trời đẹp quá. Tôi muốn đi dạo trong công viên.",
        "Việt Nam là một quốc gia nằm ở khu vực Đông Nam Á. Thủ đô là Hà Nội.",
        "Chúng tôi đang phát triển một hệ thống xử lý ngôn ngữ tự nhiên cho tiếng Việt. Hệ thống này sẽ hỗ trợ tách câu và tách từ tốt hơn."
    ]
    
    print("\n=== DEMO XỬ LÝ VĂN BẢN TIẾNG VIỆT BẰNG SPACY ===\n")
    
    # Demo vectorization được chuyển sang module text_vectorization
    # Hiển thị thông tin về module vectorization có sẵn
    print("\nChú ý: Các chức năng vector hóa đã được chuyển sang module text_vectorization.")
    print("Để sử dụng các chức năng vector hóa, vui lòng chạy: python text_vectorization.py\n")
    
    # Xử lý các văn bản ví dụ
    for i, text in enumerate(example_texts, 1):
        print(f"\n--- Ví dụ {i} ---")
        result = demo_spacy_processing(text)
    
    # Cho phép người dùng nhập văn bản để xử lý
    print("\n\nNhập văn bản tiếng Việt để xử lý (nhập 'exit' để thoát):")
    while True:
        user_input = input("\nVăn bản: ")
        if user_input.lower() == 'exit':
            break
        
        if not user_input.strip():
            print("Vui lòng nhập văn bản!")
            continue
        
        # Xử lý văn bản người dùng nhập
        result = demo_spacy_processing(user_input)
        
        # Hỏi người dùng có muốn thực hiện vector hóa không
        vector_input = input("\nBạn có muốn thực hiện vector hóa cho văn bản này không? (y/n): ")
        if vector_input.lower() == 'y':
            try:
                # Import động các chức năng vector hóa
                from text_vectorization import one_hot_encode, count_vectorize, tfidf_vectorize
                
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
            except ImportError:
                print("Module vectorization không có sẵn. Đảm bảo file text_vectorization.py tồn tại.") 