"""
Backend package for the text processing application
"""

__version__ = '1.0.0'

# Tạo alias từ create_augmented_samples sang generate_augmented_data
from backend.data_augmentation import create_augmented_samples as generate_augmented_data 