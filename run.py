#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script khởi động ứng dụng NLP
"""

import os
import sys

# Thêm đường dẫn của thư mục hiện tại vào sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Chạy ứng dụng từ backend
from backend.app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 