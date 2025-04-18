#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Ứng dụng chatbot sử dụng Gemini 1.5 Pro
"""

import os
import sys

# Thêm thư mục gốc vào sys.path để Python tìm thấy các module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import app từ module backend
from backend.app import app

if __name__ == '__main__':
    # Chạy ứng dụng
    app.run(debug=True, host='0.0.0.0', port=5000) 