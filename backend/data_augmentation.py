#!/usr/bin/env python
# -*- coding: utf-8 -*-

import random
import re
import os
import json
import logging
import string
import unicodedata
import time
from typing import List, Dict, Tuple, Union, Optional, Callable, Any

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend/app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('data_augmentation')

# Đường dẫn đến file cache từ đồng nghĩa
SYNONYMS_CACHE_FILE = os.path.join('backend', 'data', 'synonyms_cache.json')

# Danh sách từ phổ biến trong tiếng Việt để thêm vào văn bản
COMMON_VIETNAMESE_WORDS = [
    # Liên từ
    "và", "hoặc", "nhưng", "vì", "nên", "mà", "thì", "là", "với", "cùng",
    "tuy", "dù", "tuy nhiên", "tuy vậy", "mặc dù", "bởi vì", "do đó", "vì vậy",
    
    # Trợ từ
    "đã", "đang", "sẽ", "rồi", "rất", "khá", "hơi", "cực kỳ", "thực sự", "quá",
    "được", "bị", "có", "không", "vẫn", "còn", "lại", "nữa", "đều", "cũng",
    
    # Đại từ chỉ định
    "này", "kia", "ấy", "đó", "đấy", "đây", "thế này", "thế kia", "như vậy",
    
    # Từ kết thúc câu
    "nhé", "ạ", "à", "nha", "đấy", "nhỉ", "chứ", "sao", "vậy"
]

# Từ đồng nghĩa mẫu
SAMPLE_SYNONYMS = {
    "tốt": ["hay", "khá", "đẹp", "xuất sắc", "giỏi", "ưu tú", "chất lượng"],
    "đẹp": ["xinh", "duyên dáng", "lộng lẫy", "kiều diễm", "mỹ lệ", "xinh đẹp", "đẹp đẽ"],
    "chạy": ["đi", "di chuyển", "vận động", "chạy trốn", "tháo chạy", "lao đi", "phóng đi"],
    "xe": ["ô tô", "xe hơi", "xe cộ", "phương tiện", "đồ đi lại", "chiếc xe"],
    "nhà": ["gia đình", "tổ ấm", "nơi ở", "chốn về", "mái ấm", "nơi sinh sống", "căn nhà"],
    "học": ["nghiên cứu", "tìm hiểu", "thu thập kiến thức", "trau dồi", "học tập", "học hỏi"],
    "làm": ["thực hiện", "tạo ra", "hoạt động", "hành động", "tiến hành", "làm việc"],
    "ăn": ["ẩm thực", "dùng bữa", "nạp năng lượng", "dùng cơm", "thưởng thức", "ăn uống"],
    "nói": ["phát biểu", "trò chuyện", "trao đổi", "đàm thoại", "thuyết trình", "bàn luận"],
    "vui": ["hạnh phúc", "sung sướng", "thỏa mãn", "hoan hỉ", "phấn khởi", "vui vẻ"],
    "buồn": ["đau khổ", "bi thương", "sầu não", "đau buồn", "u sầu", "não lòng"],
    "lớn": ["to", "vĩ đại", "khổng lồ", "bự", "đồ sộ", "rộng lớn", "kếch xù"],
    "nhỏ": ["bé", "tí", "nhỏ bé", "nhỏ nhắn", "bé nhỏ", "bé tí", "tí hon"],
    "nhanh": ["mau", "lẹ", "vội vàng", "gấp gáp", "mau lẹ", "tốc độ", "nhanh chóng"],
    "chậm": ["từ từ", "chậm chạp", "chầm chậm", "thong thả", "ung dung", "không vội vàng"]
}

# Các mẫu regex để tách từ, câu
WORD_PATTERN = re.compile(r'\b\w+\b|[^\w\s]')
SENTENCE_PATTERN = re.compile(r'[^.!?]+[.!?]')
PUNCTUATION_SET = set('.,:;?!\'"-+=()[]{}\\|/<>*&^%$#@~`')

# Nhiễu tiếng Việt và lỗi chính tả phổ biến
COMMON_TYPOS = {
    'a': 'ă ắ ằ ẳ ẵ ặ â ấ ầ ẩ ẫ ậ',
    'e': 'é è ẻ ẽ ẹ ê ế ề ể ễ ệ',
    'i': 'í ì ỉ ĩ ị',
    'o': 'ó ò ỏ õ ọ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ',
    'u': 'ú ù ủ ũ ụ ư ứ ừ ử ữ ự',
    'y': 'ý ỳ ỷ ỹ ỵ',
    'd': 'đ',
    's': 'x',
    'x': 's',
    'n': 'ng',
    'l': 'n',
    'c': 'k',
    'k': 'c',
    'ch': 'tr',
    'tr': 'ch'
}

def ensure_data_dir() -> None:
    """Đảm bảo thư mục data tồn tại"""
    data_dir = os.path.join('backend', 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        logger.info(f"Đã tạo thư mục {data_dir}")

def load_synonyms_cache() -> Dict[str, List[str]]:
    """
    Tải cache từ đồng nghĩa từ file
    
    Returns:
        Dict[str, List[str]]: Từ điển các từ đồng nghĩa đã được cache
    """
    cache = {}
    cache_file = os.path.join('backend', 'data', 'synonyms_cache.json')
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache = json.load(f)
            logger.info(f"Đã tải {len(cache)} từ từ cache")
        except Exception as e:
            logger.error(f"Lỗi khi tải cache từ đồng nghĩa: {str(e)}")
    
    return cache

def save_synonyms_cache(cache: Dict[str, List[str]]) -> bool:
    """
    Lưu cache từ đồng nghĩa vào file
    
    Args:
        cache (Dict[str, List[str]]): Từ điển các từ đồng nghĩa cần lưu
        
    Returns:
        bool: True nếu lưu thành công, False nếu có lỗi
    """
    try:
        cache_file = os.path.join('backend', 'data', 'synonyms_cache.json')
        cache_dir = os.path.dirname(cache_file)
        
        # Tạo thư mục nếu chưa tồn tại
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=4)
        
        logger.info(f"Đã lưu {len(cache)} từ vào cache")
        return True
    except Exception as e:
        logger.error(f"Lỗi khi lưu cache từ đồng nghĩa: {str(e)}")
        return False

def ensure_sample_synonyms() -> None:
    """
    Đảm bảo có dữ liệu mẫu trong cache từ đồng nghĩa
    Hàm này sẽ kiểm tra cache và thêm dữ liệu mẫu nếu cache trống
    """
    cache = load_synonyms_cache()
    
    # Nếu cache không trống, không cần làm gì
    if cache and len(cache) > 0:
        return
        
    logger.info("Cache từ đồng nghĩa trống, thêm dữ liệu mẫu")
    
    # Cập nhật cache với dữ liệu mẫu
    cache.update(SAMPLE_SYNONYMS)
    save_synonyms_cache(cache)
    logger.info(f"Đã thêm {len(SAMPLE_SYNONYMS)} từ đồng nghĩa mẫu vào cache")

def tokenize_vietnamese(text: str) -> List[str]:
    """
    Tách từ tiếng Việt dựa trên khoảng trắng và dấu câu.
    
    Args:
        text: Văn bản cần tách từ
        
    Returns:
        Danh sách các từ đã tách
    """
    if not text:
        return []
    
    # Chuẩn hóa Unicode
    text = unicodedata.normalize('NFC', text)
    
    # Tách theo khoảng trắng và giữ lại dấu câu
    words = WORD_PATTERN.findall(text)
    return [w for w in words if w.strip()]

def split_sentences(text: str) -> List[str]:
    """
    Tách văn bản thành các câu.
    
    Args:
        text: Văn bản cần tách câu
        
    Returns:
        Danh sách các câu đã tách
    """
    if not text:
        return []
        
    # Chuẩn hóa Unicode
    text = unicodedata.normalize('NFC', text)
    
    # Tách câu dựa vào dấu câu kết thúc
    sentences = SENTENCE_PATTERN.findall(text)
    
    # Nếu không tìm thấy câu nào, trả về toàn bộ văn bản như một câu
    if not sentences and text.strip():
        return [text.strip()]
        
    # Loại bỏ khoảng trắng thừa đầu/cuối câu
    return [s.strip() for s in sentences if s.strip()]

def add_random_words(text: str, num_words: int = None, probability: float = 0.2) -> str:
    """
    Thêm ngẫu nhiên một số từ vào văn bản.
    
    Args:
        text: Văn bản gốc
        num_words: Số từ muốn thêm vào, nếu None thì sẽ thêm ngẫu nhiên 10-30% số từ ban đầu
        probability: Xác suất thêm từ tại mỗi vị trí (mặc định: 0.2)
    
    Returns:
        Văn bản sau khi thêm từ
    """
    words = tokenize_vietnamese(text)
    if not words:
        return text
        
    if num_words is None:
        # Thêm khoảng 10-30% số từ
        num_words = max(1, int(random.uniform(0.1, 0.3) * len(words)))
    
    # Đảm bảo số từ thêm vào không quá lớn
    num_words = min(num_words, len(words) // 2)
    
    # Đảm bảo thêm vào ít nhất 1 từ
    num_words = max(1, num_words)
    
    # Chọn các vị trí để thêm từ
    positions = sorted(random.sample(range(len(words) + 1), num_words))
    
    # Thêm từ vào các vị trí đã chọn
    for i, pos in enumerate(positions):
        # Vị trí thực tế sẽ tăng dần do chúng ta đã thêm từ trước đó
        actual_pos = pos + i
        # Chọn từ ngẫu nhiên để thêm
        word_to_add = random.choice(COMMON_VIETNAMESE_WORDS)
        words.insert(actual_pos, word_to_add)
    
    result = ' '.join(words)
    logger.debug(f"Đã thêm {num_words} từ ngẫu nhiên vào văn bản")
    return result

def swap_words(text: str, num_swaps: int = None, probability: float = 0.2) -> str:
    """
    Đổi chỗ ngẫu nhiên một số cặp từ trong văn bản.
    
    Args:
        text: Văn bản gốc
        num_swaps: Số cặp từ muốn đổi chỗ, nếu None thì sẽ đổi chỗ ngẫu nhiên 10-20% số từ ban đầu
        probability: Xác suất đổi chỗ từ tại mỗi vị trí (mặc định: 0.2)
    
    Returns:
        Văn bản sau khi đổi chỗ các từ
    """
    words = tokenize_vietnamese(text)
    if len(words) < 2:
        return text
    
    if num_swaps is None:
        # Đổi chỗ khoảng 10-20% số từ
        num_swaps = max(1, int(random.uniform(0.1, 0.2) * len(words)))
    
    # Giới hạn số lần swap không vượt quá số từ chia 2
    num_swaps = min(num_swaps, len(words) // 2)
    
    # Đảm bảo đổi chỗ ít nhất 1 cặp từ
    num_swaps = max(1, num_swaps)
    
    # Thực hiện đổi chỗ từ
    for _ in range(num_swaps):
        # Chọn hai vị trí ngẫu nhiên để đổi chỗ
        i, j = random.sample(range(len(words)), 2)
        words[i], words[j] = words[j], words[i]
    
    result = ' '.join(words)
    logger.debug(f"Đã đổi chỗ {num_swaps} cặp từ trong văn bản")
    return result

def delete_words(text: str, num_words: int = None, probability: float = 0.2) -> str:
    """
    Xóa ngẫu nhiên một số từ khỏi văn bản.
    
    Args:
        text: Văn bản gốc
        num_words: Số từ muốn xóa, nếu None thì sẽ xóa ngẫu nhiên 10-20% số từ ban đầu
        probability: Xác suất xóa từ tại mỗi vị trí (mặc định: 0.2)
    
    Returns:
        Văn bản sau khi xóa từ
    """
    words = tokenize_vietnamese(text)
    if len(words) < 2:
        return text
    
    if num_words is None:
        # Xóa khoảng 10-20% số từ
        num_words = max(1, int(random.uniform(0.1, 0.2) * len(words)))
    
    # Không xóa quá nhiều từ, dữ lại ít nhất 70% số từ
    num_words = min(num_words, int(len(words) * 0.3))
    
    # Nếu văn bản quá ngắn, chỉ xóa 1 từ
    num_words = max(1, min(num_words, len(words) - 1))  # Giữ lại ít nhất 1 từ
    
    # Chọn các vị trí để xóa từ
    indices_to_remove = sorted(random.sample(range(len(words)), num_words), reverse=True)
    
    # Xóa từ
    for idx in indices_to_remove:
        words.pop(idx)
    
    result = ' '.join(words)
    logger.debug(f"Đã xóa {num_words} từ khỏi văn bản")
    return result

def replace_with_synonyms(text: str, replacement_prob: float = 0.5) -> Tuple[str, List[str]]:
    """
    Thay thế một số từ trong văn bản bằng từ đồng nghĩa.
    
    Args:
        text: Văn bản gốc
        replacement_prob: Xác suất thay thế mỗi từ có trong từ điển (mặc định: 0.5)
    
    Returns:
        Tuple (văn bản sau khi thay thế, danh sách các thay thế đã thực hiện)
    """
    # Đảm bảo có dữ liệu mẫu
    ensure_sample_synonyms()
    
    # Nạp từ đồng nghĩa từ cache
    synonyms_cache = load_synonyms_cache()
    
    if not synonyms_cache:
        logger.warning("Không tìm thấy dữ liệu từ đồng nghĩa trong cache")
        return text, []
    
    # Thông tin debug
    logger.debug(f"Cache từ đồng nghĩa chứa {len(synonyms_cache)} từ")
    
    # Tách từ
    words = tokenize_vietnamese(text)
    if not words:
        logger.warning("Văn bản trống hoặc không thể tách từ")
        return text, []
    
    # Kết quả và danh sách thay thế
    result = []
    replacements = []
    
    # Tìm các từ có từ đồng nghĩa trong văn bản
    replaceable_indices = []
    for i, word in enumerate(words):
        # Bỏ qua dấu câu
        if word in PUNCTUATION_SET:
            continue
        
        # Kiểm tra từ có trong từ điển từ đồng nghĩa không
        normalized_word = word.lower()
        if normalized_word in synonyms_cache and synonyms_cache[normalized_word]:
            replaceable_indices.append(i)
    
    # Nếu không có từ nào có thể thay thế
    if not replaceable_indices:
        logger.warning("Không có từ nào trong văn bản có từ đồng nghĩa trong cache")
        return text, []
    
    # Số lượng từ sẽ được thay thế
    num_to_replace = max(1, int(replacement_prob * len(replaceable_indices)))
    
    # Chọn ngẫu nhiên các vị trí để thay thế
    if num_to_replace < len(replaceable_indices):
        indices_to_replace = random.sample(replaceable_indices, num_to_replace)
    else:
        indices_to_replace = replaceable_indices
    
    # Thực hiện thay thế
    for i, word in enumerate(words):
        if i in indices_to_replace:
            normalized_word = word.lower()
            synonyms = synonyms_cache[normalized_word]
            
            # Chọn từ đồng nghĩa không trùng với từ gốc
            filtered_synonyms = [s for s in synonyms if s.lower() != normalized_word]
            
            if filtered_synonyms:
                synonym = random.choice(filtered_synonyms)
                result.append(synonym)
                replacements.append(f"{word} -> {synonym}")
            else:
                # Nếu không có từ đồng nghĩa phù hợp, giữ nguyên từ gốc
                result.append(word)
        else:
            result.append(word)
    
    # Thông tin debug
    if replacements:
        logger.info(f"Đã thay thế {len(replacements)}/{len(words)} từ")
        if logger.isEnabledFor(logging.DEBUG):
            for replacement in replacements[:10]:
                logger.debug(f"  {replacement}")
            if len(replacements) > 10:
                logger.debug(f"  ... và {len(replacements) - 10} thay thế khác")
    
    return ' '.join(result), replacements

def add_typos(text: str, typo_probability: float = 0.1) -> str:
    """
    Thêm lỗi chính tả vào văn bản.
    
    Args:
        text: Văn bản gốc
        typo_probability: Xác suất xuất hiện lỗi chính tả cho mỗi từ (mặc định: 0.1)
    
    Returns:
        Văn bản có lỗi chính tả
    """
    words = tokenize_vietnamese(text)
    if not words:
        return text
    
    result = []
    
    # Các loại lỗi chính tả
    typo_types = [
        "substitute",  # Thay thế một ký tự bằng ký tự khác
        "swap",        # Đổi chỗ hai ký tự liền kề
        "delete",      # Xóa một ký tự
        "insert",      # Thêm một ký tự
        "diacritic"    # Thay đổi dấu
    ]
    
    # Xử lý từng từ
    for word in words:
        # Bỏ qua dấu câu và từ quá ngắn
        if word in PUNCTUATION_SET or len(word) < 2:
            result.append(word)
            continue
        
        # Xác định xem có thay đổi từ này không
        if random.random() < typo_probability:
            # Chọn loại lỗi chính tả
            typo_type = random.choice(typo_types)
            
            if typo_type == "substitute" and len(word) > 0:
                # Thay thế một ký tự
                pos = random.randint(0, len(word) - 1)
                char = word[pos].lower()
                
                # Tìm các ký tự tương tự để thay thế
                if char in COMMON_TYPOS:
                    replacement_chars = COMMON_TYPOS[char].split()
                    if replacement_chars:
                        replacement = random.choice(replacement_chars)
                        word = word[:pos] + replacement + word[pos+1:]
                
            elif typo_type == "swap" and len(word) > 1:
                # Đổi chỗ hai ký tự liền kề
                pos = random.randint(0, len(word) - 2)
                word = word[:pos] + word[pos+1] + word[pos] + word[pos+2:]
                
            elif typo_type == "delete" and len(word) > 2:
                # Xóa một ký tự
                pos = random.randint(0, len(word) - 1)
                word = word[:pos] + word[pos+1:]
                
            elif typo_type == "insert" and len(word) > 0:
                # Thêm một ký tự
                pos = random.randint(0, len(word))
                chars = "abcdefghijklmnopqrstuvwxyzàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"
                word = word[:pos] + random.choice(chars) + word[pos:]
                
            elif typo_type == "diacritic" and len(word) > 0:
                # Thay đổi dấu
                if any(c in "aăâeêioôơuưy" for c in word):
                    pos = random.choice([i for i, c in enumerate(word) if c.lower() in "aăâeêioôơuưy"])
                    char = word[pos].lower()
                    
                    if char in COMMON_TYPOS:
                        replacement_chars = COMMON_TYPOS[char].split()
                        if replacement_chars:
                            replacement = random.choice(replacement_chars)
                            word = word[:pos] + replacement + word[pos+1:]
        
        result.append(word)
    
    return ' '.join(result)

def random_capitalization(text: str, capitalization_probability: float = 0.3) -> str:
    """
    Thay đổi ngẫu nhiên kiểu viết hoa/thường của các từ.
    
    Args:
        text: Văn bản gốc
        capitalization_probability: Xác suất thay đổi kiểu viết hoa/thường (mặc định: 0.3)
    
    Returns:
        Văn bản với kiểu viết hoa/thường ngẫu nhiên
    """
    words = tokenize_vietnamese(text)
    if not words:
        return text
    
    result = []
    
    # Các kiểu viết hoa
    capitalization_types = [
        "uppercase",    # Viết hoa toàn bộ từ
        "lowercase",    # Viết thường toàn bộ từ
        "capitalize",   # Viết hoa chữ cái đầu
        "random_case"   # Viết hoa/thường ngẫu nhiên từng chữ cái
    ]
    
    # Xử lý từng từ
    for word in words:
        # Bỏ qua dấu câu
        if word in PUNCTUATION_SET:
            result.append(word)
            continue
        
        # Xác định xem có thay đổi từ này không
        if random.random() < capitalization_probability:
            # Chọn kiểu viết hoa
            capitalization_type = random.choice(capitalization_types)
            
            if capitalization_type == "uppercase":
                word = word.upper()
            elif capitalization_type == "lowercase":
                word = word.lower()
            elif capitalization_type == "capitalize":
                word = word.capitalize()
            elif capitalization_type == "random_case":
                word = ''.join(c.upper() if random.random() < 0.5 else c.lower() for c in word)
        
        result.append(word)
    
    return ' '.join(result)

def back_translation(text: str, intermediate_lang: str = "en") -> str:
    """
    Mô phỏng dịch ngược - dịch văn bản sang ngôn ngữ trung gian rồi dịch lại tiếng Việt.
    
    Args:
        text: Văn bản gốc tiếng Việt
        intermediate_lang: Mã ngôn ngữ trung gian (mặc định: tiếng Anh)
    
    Returns:
        Văn bản sau khi mô phỏng dịch ngược
    """
    # Đảm bảo có dữ liệu mẫu
    ensure_sample_synonyms()
    
    # Tách thành câu
    sentences = split_sentences(text)
    if not sentences:
        return text
    
    # Nạp từ đồng nghĩa từ cache
    synonyms_cache = load_synonyms_cache()
    
    processed_sentences = []
    
    for sentence in sentences:
        # Tách từ
        words = tokenize_vietnamese(sentence)
        if not words:
            processed_sentences.append(sentence)
            continue
        
        # 1. Đôi chỗ một số từ (5-10%)
        if len(words) >= 2:
            num_swaps = max(1, int(random.uniform(0.05, 0.1) * len(words)))
            for _ in range(num_swaps):
                i, j = random.sample(range(len(words)), 2)
                words[i], words[j] = words[j], words[i]
        
        # 2. Thay thế một số từ bằng từ đồng nghĩa (15-25%)
        for i in range(len(words)):
            # Bỏ qua dấu câu
            if words[i] in PUNCTUATION_SET:
                continue
                
            if random.random() < 0.2:
                normalized_word = words[i].lower()
                if normalized_word in synonyms_cache and synonyms_cache[normalized_word]:
                    words[i] = random.choice(synonyms_cache[normalized_word])
        
        # 3. Xóa một số từ không quan trọng (5-15%)
        if len(words) > 3:
            num_to_remove = max(1, int(random.uniform(0.05, 0.15) * len(words)))
            indices_to_remove = sorted(random.sample(range(len(words)), min(num_to_remove, len(words) - 3)), reverse=True)
            
            for idx in indices_to_remove:
                words.pop(idx)
        
        # 4. Thêm một số từ phổ biến (5-15%)
        num_to_add = max(1, int(random.uniform(0.05, 0.15) * len(words)))
        for _ in range(num_to_add):
            position = random.randint(0, len(words))
            words.insert(position, random.choice(COMMON_VIETNAMESE_WORDS))
        
        processed_sentences.append(' '.join(words))
    
    return ' '.join(processed_sentences)

def create_augmented_samples(
    text: str, 
    num_samples: int = 3, 
    use_synonyms: bool = True, 
    add_words: bool = True, 
    swap_word_order: bool = True, 
    delete_words_enabled: bool = True,
    add_typos_enabled: bool = False,
    random_case_enabled: bool = False,
    back_translation_enabled: bool = False
) -> List[str]:
    """
    Tạo nhiều mẫu tăng cường từ một văn bản gốc.
    
    Args:
        text: Văn bản gốc cần tăng cường
        num_samples: Số mẫu cần tạo
        use_synonyms: Có sử dụng phương pháp thay thế từ đồng nghĩa
        add_words: Có sử dụng phương pháp thêm từ ngẫu nhiên
        swap_word_order: Có sử dụng phương pháp đổi chỗ từ
        delete_words_enabled: Có sử dụng phương pháp xóa từ
        add_typos_enabled: Có sử dụng phương pháp thêm lỗi chính tả
        random_case_enabled: Có sử dụng phương pháp thay đổi kiểu viết hoa/thường
        back_translation_enabled: Có sử dụng phương pháp mô phỏng dịch ngược
        
    Returns:
        Danh sách các văn bản đã được tăng cường
    """
    logger.info(f"Tạo {num_samples} mẫu tăng cường từ văn bản")
    
    if not text:
        logger.warning("Văn bản đầu vào trống")
        return []
    
    # Danh sách các phương pháp được sử dụng
    augmentation_methods = []
    
    if use_synonyms:
        augmentation_methods.append(("Thay thế từ đồng nghĩa", lambda t: replace_with_synonyms(t, replacement_prob=0.3)[0]))
    
    if add_words:
        augmentation_methods.append(("Thêm từ ngẫu nhiên", lambda t: add_random_words(t)))
    
    if swap_word_order:
        augmentation_methods.append(("Đổi chỗ từ", lambda t: swap_words(t)))
    
    if delete_words_enabled:
        augmentation_methods.append(("Xóa từ ngẫu nhiên", lambda t: delete_words(t)))
    
    if add_typos_enabled:
        augmentation_methods.append(("Thêm lỗi chính tả", lambda t: add_typos(t, typo_probability=0.1)))
    
    if random_case_enabled:
        augmentation_methods.append(("Thay đổi viết hoa/thường", lambda t: random_capitalization(t, capitalization_probability=0.2)))
    
    if back_translation_enabled:
        augmentation_methods.append(("Mô phỏng dịch ngược", lambda t: back_translation(t)))
    
    # Kiểm tra nếu không có phương pháp nào được chọn
    if not augmentation_methods:
        logger.warning("Không có phương pháp tăng cường nào được chọn")
        return []
    
    augmented_texts = []
    
    for i in range(num_samples):
        # Số lượng phương pháp sẽ áp dụng (1-3, hoặc tất cả nếu ít hơn 3)
        num_methods = random.randint(1, min(3, len(augmentation_methods)))
        
        # Chọn ngẫu nhiên các phương pháp
        selected_methods = random.sample(augmentation_methods, num_methods)
        
        # Sao chép văn bản gốc
        augmented_text = text
        applied_methods = []
        
        # Áp dụng các phương pháp được chọn
        for method_name, method_func in selected_methods:
            try:
                augmented_text = method_func(augmented_text)
                applied_methods.append(method_name)
            except Exception as e:
                logger.error(f"Lỗi khi áp dụng phương pháp {method_name}: {str(e)}")
        
        augmented_texts.append(augmented_text)
        
        logger.info(f"Đã tạo mẫu tăng cường #{i+1} sử dụng {', '.join(applied_methods)}")
    
    return augmented_texts

def combine_augmentation_methods(text: str, methods: List[Callable], max_combinations: int = 3) -> List[str]:
    """
    Kết hợp nhiều phương pháp tăng cường khác nhau để tạo ra nhiều biến thể của văn bản.
    
    Args:
        text: Văn bản gốc
        methods: Danh sách các hàm tăng cường dữ liệu
        max_combinations: Số lượng tối đa các phương pháp được kết hợp với nhau
        
    Returns:
        Danh sách các văn bản đã được tăng cường
    """
    if not text or not methods:
        return []
    
    results = []
    
    # Giới hạn số lượng phương pháp kết hợp
    for i in range(1, min(max_combinations + 1, len(methods) + 1)):
        # Lấy tất cả tổ hợp i phương pháp từ danh sách methods
        for combination in range(min(5, sum(1 for _ in range(len(methods) - i + 1)))):
            # Chọn ngẫu nhiên i phương pháp từ danh sách
            selected_methods = random.sample(methods, i)
            
            # Áp dụng các phương pháp đã chọn theo thứ tự
            augmented = text
            for method in selected_methods:
                augmented = method(augmented)
            
            # Thêm kết quả vào danh sách
            results.append(augmented)
    
    return results

# Danh sách tất cả các phương pháp tăng cường dữ liệu
def get_all_augmentation_methods() -> Dict[str, Callable]:
    """
    Lấy tất cả các phương pháp tăng cường dữ liệu có sẵn.
    
    Returns:
        Từ điển {tên phương pháp: hàm}
    """
    return {
        "replace_synonyms": lambda t: replace_with_synonyms(t)[0],
        "add_random_words": add_random_words,
        "swap_words": swap_words,
        "delete_words": delete_words,
        "add_typos": add_typos,
        "random_capitalization": random_capitalization,
        "back_translation": back_translation
    }

    