/**
 * JavaScript cho trang đào tạo mô hình phân loại văn bản
 */

// Khai báo biến global
let modelResults = []; // Mảng lưu trữ kết quả của các mô hình đã huấn luyện
let currentModelIndex = -1; // Chỉ số của mô hình hiện tại đang hiển thị

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các thành phần UI
    initUIComponents();
    
    // Xử lý các sự kiện
    setupEventListeners();
});

/**
 * Khởi tạo các thành phần UI
 */
function initUIComponents() {
    // Khởi tạo tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Khởi tạo giá trị ban đầu cho tỷ lệ huấn luyện/kiểm thử
    updateTrainTestSplitLabels(document.getElementById('train-test-split').value);
    
    // Khởi tạo tên mô hình mặc định
    generateDefaultModelName();
}

/**
 * Thiết lập các trình nghe sự kiện
 */
function setupEventListeners() {
    // Xử lý sự kiện thay đổi thanh trượt tỷ lệ huấn luyện/kiểm thử
    document.getElementById('train-test-split').addEventListener('input', function(e) {
        updateTrainTestSplitLabels(e.target.value);
    });
    
    // Xử lý sự kiện thay đổi phương pháp phân loại
    document.querySelectorAll('.classification-option').forEach(function(radio) {
        radio.addEventListener('change', function() {
            generateDefaultModelName();
        });
    });
    
    // Xử lý sự kiện khi chọn ngrams để hiển thị tùy chọn ngrams
    document.getElementById('ngrams').addEventListener('change', function() {
        document.getElementById('ngrams-options').style.display = this.checked ? 'block' : 'none';
    });
    
    // Xử lý sự kiện khi chọn phương pháp vector hóa khác không phải ngrams
    document.querySelectorAll('.vectorization-option:not(#ngrams)').forEach(function(radio) {
        radio.addEventListener('change', function() {
            document.getElementById('ngrams-options').style.display = 'none';
        });
    });
    
    // Xử lý sự kiện khi thay đổi thể loại mô hình
    document.querySelectorAll('.model-category-option').forEach(function(radio) {
        radio.addEventListener('change', function() {
            // Hiển thị ô nhập nếu chọn thể loại tùy chỉnh
            if (this.value === 'custom') {
                document.getElementById('custom-category-input-container').style.display = 'block';
            } else {
                document.getElementById('custom-category-input-container').style.display = 'none';
            }
        });
    });
    
    // Xử lý sự kiện khi nhấn nút preview dataset
    document.getElementById('preview-dataset-btn').addEventListener('click', function() {
        previewDataset();
    });
    
    // Xử lý sự kiện khi nhấn nút đào tạo mô hình
    document.getElementById('train-model-btn').addEventListener('click', function() {
        trainModel();
    });
    
    // Xử lý hiển thị/ẩn tùy chọn N-grams khi chọn phương pháp vector hóa
    const vectorizationOptions = document.querySelectorAll('.vectorization-option');
    vectorizationOptions.forEach(option => {
        option.addEventListener('change', function() {
            const ngramsOptions = document.getElementById('ngrams-options');
            if (this.value === 'ngrams') {
                ngramsOptions.style.display = 'block';
            } else {
                ngramsOptions.style.display = 'none';
            }
        });
    });
    
    // Xử lý thanh trượt max-features
    const maxFeaturesRange = document.getElementById('max-features-range');
    const maxFeaturesValue = document.getElementById('max-features-value');
    const maxFeaturesInput = document.getElementById('max-features');
    
    if (maxFeaturesRange) {
        maxFeaturesRange.addEventListener('input', function() {
            maxFeaturesValue.textContent = this.value;
            maxFeaturesInput.value = this.value;
        });
    }
    
    // Thêm animation khi hover vào card
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('shadow');
        });
        card.addEventListener('mouseleave', function() {
            this.classList.remove('shadow');
        });
    });
    
    // Hiệu ứng cho các nút
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Xử lý khi nhập thông tin mô hình
    const modelNameInput = document.getElementById('model-name');
    const randomStateInput = document.getElementById('random-state');
    
    if (modelNameInput) {
        modelNameInput.addEventListener('input', function() {
            // Cập nhật tên mô hình khi người dùng nhập
        });
    }
    
    if (randomStateInput) {
        randomStateInput.addEventListener('input', function() {
            // Xử lý khi thay đổi random state
        });
    }
    
    // Xử lý khi tải file dataset lên
    const datasetFileInput = document.getElementById('dataset-file');
    if (datasetFileInput) {
        datasetFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                // File đã được chọn
            }
        });
    }
    
    // Xử lý sự kiện khi nhấn nút thử nghiệm mô hình
    document.getElementById('test-model-btn')?.addEventListener('click', function() {
        testModel();
    });
    
    // Xử lý sự kiện khi nhấn nút xóa
    document.getElementById('clear-test-btn')?.addEventListener('click', function() {
        document.getElementById('test-input').value = '';
        document.getElementById('test-result').style.display = 'none';
    });

    // Xử lý phím Enter trong textarea thử nghiệm
    document.getElementById('test-input')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            testModel();
        }
    });

    // Xử lý các nút chọn/bỏ chọn tất cả cho phương pháp phân loại
    document.getElementById('select-all-classifications')?.addEventListener('click', function() {
        document.querySelectorAll('.classification-option').forEach(checkbox => {
            checkbox.checked = true;
        });
    });
    
    document.getElementById('deselect-all-classifications')?.addEventListener('click', function() {
        document.querySelectorAll('.classification-option').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Đảm bảo ít nhất một phương pháp được chọn
        if (document.querySelectorAll('.classification-option:checked').length === 0) {
            document.getElementById('naive_bayes').checked = true;
        }
    });

    // Xử lý hiển thị/ẩn tham số khi chọn/bỏ chọn KNN
    document.getElementById('knn').addEventListener('change', toggleKNNParams);
    
    // Kiểm tra trạng thái ban đầu của KNN
    toggleKNNParams();
}

/**
 * Cập nhật nhãn tỷ lệ huấn luyện/kiểm thử
 */
function updateTrainTestSplitLabels(trainPercent) {
    document.querySelector('.train-split-value').textContent = trainPercent + '%';
    document.querySelector('.test-split-value').textContent = (100 - trainPercent) + '%';
}

/**
 * Tạo tên mô hình mặc định dựa trên loại mô hình đã chọn
 */
function generateDefaultModelName() {
    const classificationOption = document.querySelector('input[name="classification"]:checked');
    const modelType = classificationOption ? classificationOption.value : 'model';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    document.getElementById('model-name').value = `${modelType}_${timestamp}`;
}

/**
 * Hiển thị xem trước dataset
 */
async function previewDataset() {
    const datasetFile = document.getElementById('dataset-file').files[0];
    if (!datasetFile) {
        showToast('Vui lòng chọn file dataset', 'warning');
        return;
    }
    
    const textColumn = document.getElementById('text-column').value;
    const labelColumn = document.getElementById('label-column').value;
    
    if (!textColumn || !labelColumn) {
        showToast('Vui lòng nhập tên cột văn bản và cột nhãn', 'warning');
        return;
    }
    
    try {
        // Hiển thị loading
        showLoading('Đang đọc dataset...');
        
        // Lưu trữ dataset để tải thêm mẫu sau này
        window.datasetData = {
            parsed: false,
            header: [],
            data: [],
            labels: {},
            textColIndex: -1,
            labelColIndex: -1,
            currentPage: 0,
            pageSize: 20,
            totalSamples: 0,
            isLoading: false // Thêm flag để theo dõi trạng thái đang tải
        };
        
        // Đọc file CSV
        const text = await datasetFile.text();
        let rows = text.split('\n');
        
        // Xử lý trường hợp file có ký tự BOM hoặc các ký tự đặc biệt khác
        if (rows[0].charCodeAt(0) === 0xFEFF) {
            rows[0] = rows[0].substring(1); // Loại bỏ BOM nếu có
        }
        
        if (rows.length < 2) {
            throw new Error('Dataset không hợp lệ hoặc không có dữ liệu');
        }
        
        // Lấy header và xử lý
        try {
            // Thử phân tích header như CSV chuẩn
            const headerLine = rows[0].trim();
            // Xử lý ngắt dòng đặc biệt của Windows
            if (headerLine.includes('\r')) {
                window.datasetData.header = headerLine.split('\r')[0].split(',');
            } else {
                window.datasetData.header = headerLine.split(',');
            }
            window.datasetData.header = window.datasetData.header.map(col => col.trim().replace(/^"|"$/g, ''));
        } catch (e) {
            throw new Error('Không thể phân tích header của file CSV. Vui lòng kiểm tra định dạng file.');
        }
        
        // Tìm vị trí của cột văn bản và cột nhãn
        window.datasetData.textColIndex = window.datasetData.header.findIndex(col => col.toLowerCase() === textColumn.toLowerCase());
        window.datasetData.labelColIndex = window.datasetData.header.findIndex(col => col.toLowerCase() === labelColumn.toLowerCase());
        
        if (window.datasetData.textColIndex === -1) {
            throw new Error(`Không tìm thấy cột văn bản "${textColumn}" trong dataset`);
        }
        
        if (window.datasetData.labelColIndex === -1) {
            throw new Error(`Không tìm thấy cột nhãn "${labelColumn}" trong dataset`);
        }
        
        // Lưu toàn bộ dữ liệu vào bộ nhớ (trừ header)
        window.datasetData.data = rows.slice(1).filter(row => row.trim());
        window.datasetData.totalSamples = window.datasetData.data.length;
        window.datasetData.parsed = true;
        
        // Cập nhật UI với số lượng mẫu
        document.getElementById('dataset-total-samples').textContent = window.datasetData.totalSamples.toLocaleString();
        document.getElementById('total-samples-count').textContent = window.datasetData.totalSamples.toLocaleString();
        
        // Phân tích tối đa 1000 mẫu đầu tiên để hiển thị phân phối nhãn
        await parseDatasetLabels(Math.min(1000, window.datasetData.totalSamples));
        
        // Tải trang đầu tiên của dữ liệu
        await loadDatasetPage(0);
        
        // Ẩn loading và hiển thị modal
        hideLoading();
        
        // Xóa mọi overlay loading có thể còn tồn tại
        const allOverlays = document.querySelectorAll('[id^="loading-overlay"]');
        allOverlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        // Đảm bảo body không còn class modal-open
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Hiển thị modal với timeout nhỏ để đảm bảo DOM đã được cập nhật
        setTimeout(() => {
            const previewModal = new bootstrap.Modal(document.getElementById('preview-dataset-modal'));
            previewModal.show();
            
            // Thêm event listener để theo dõi cuộn
            const tableContainer = document.querySelector('.table-responsive');
            if (tableContainer) {
                // Xóa event listener cũ nếu có
                tableContainer.removeEventListener('scroll', handleTableScroll);
                // Thêm event listener mới
                tableContainer.addEventListener('scroll', handleTableScroll);
            }
        }, 100);
        
    } catch (error) {
        console.error('Lỗi khi xem trước dataset:', error);
        hideLoading();
        showToast('Lỗi khi đọc file dataset: ' + error.message, 'danger');
    }
}

/**
 * Xử lý sự kiện cuộn trong bảng dữ liệu
 */
function handleTableScroll(event) {
    if (!window.datasetData || !window.datasetData.parsed || window.datasetData.isLoading) {
        return;
    }
    
    const tableContainer = event.target;
    const scrollPosition = tableContainer.scrollTop + tableContainer.clientHeight;
    const totalHeight = tableContainer.scrollHeight;
    
    // Nếu đã cuộn đến vị trí gần cuối (còn 100px)
    if (scrollPosition >= totalHeight - 100) {
        // Tải trang tiếp theo nếu chưa tải hết dữ liệu
        const nextPage = window.datasetData.currentPage + 1;
        const startIndex = nextPage * window.datasetData.pageSize;
        
        if (startIndex < window.datasetData.data.length) {
            window.datasetData.isLoading = true;
            
            // Tăng pageSize sau mỗi 5 lần cuộn để hiệu suất tốt hơn
            if (nextPage % 5 === 0 && window.datasetData.pageSize < 100) {
                window.datasetData.pageSize = Math.min(100, window.datasetData.pageSize * 1.5);
            }
            
            // Thêm trạng thái loading ở cuối bảng
            const tableBody = document.querySelector('#dataset-preview-table tbody');
            const loadingRow = document.createElement('tr');
            loadingRow.className = 'loading-row';
            loadingRow.id = 'infinite-scroll-loader';
            loadingRow.innerHTML = `
                <td colspan="3" class="text-center">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <span>Đang tải thêm dữ liệu...</span>
                </td>
            `;
            tableBody.appendChild(loadingRow);
            
            // Tải trang tiếp theo
            loadDatasetPage(nextPage).then(() => {
                window.datasetData.isLoading = false;
                
                // Xóa hàng loading
                const loader = document.getElementById('infinite-scroll-loader');
                if (loader) {
                    loader.remove();
                }
            });
        }
    }
}

/**
 * Phân tích và hiển thị phân phối nhãn từ dataset
 */
async function parseDatasetLabels(maxSamples) {
    if (!window.datasetData || !window.datasetData.parsed) return;
    
    window.datasetData.labels = {};
    
    // Sử dụng số mẫu nhỏ hơn để tính toán phân phối nhanh
    const sampleSize = Math.min(maxSamples, window.datasetData.data.length);
    
    for (let i = 0; i < sampleSize; i++) {
        try {
            const rowData = parseCSVRow(window.datasetData.data[i]);
            if (rowData.length <= Math.max(window.datasetData.textColIndex, window.datasetData.labelColIndex)) {
                continue; // Bỏ qua hàng không đủ cột
            }
            
            const label = rowData[window.datasetData.labelColIndex].replace(/^"|"$/g, '');
            
            // Đếm phân phối nhãn
            if (window.datasetData.labels[label]) {
                window.datasetData.labels[label]++;
            } else {
                window.datasetData.labels[label] = 1;
            }
        } catch (e) {
            console.error("Lỗi khi phân tích hàng", i, e);
        }
    }
        
        // Hiển thị phân phối nhãn bằng biểu đồ màu
        const labelsContainer = document.getElementById('dataset-labels-distribution');
        labelsContainer.innerHTML = '';
        
        // Các màu nền đẹp cho các nhãn
        const backgroundColors = [
            'rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 
            'rgba(75, 192, 192, 0.2)', 'rgba(255, 206, 86, 0.2)',
            'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)',
            'rgba(199, 199, 199, 0.2)', 'rgba(83, 102, 255, 0.2)',
            'rgba(255, 99, 255, 0.2)', 'rgba(0, 212, 255, 0.2)'
        ];
        
        // Các màu viền đẹp cho các nhãn
        const borderColors = [
            'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 
            'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)', 'rgba(0, 212, 255, 1)'
        ];
        
        // Hiển thị nhãn dưới dạng badge
    Object.keys(window.datasetData.labels).forEach((label, index) => {
        const count = window.datasetData.labels[label];
            const bgColor = backgroundColors[index % backgroundColors.length];
            const borderColor = borderColors[index % borderColors.length];
            
            const badge = document.createElement('span');
            badge.className = 'badge rounded-pill me-2 mb-2';
            badge.style.backgroundColor = bgColor;
            badge.style.color = borderColor;
            badge.style.borderColor = borderColor;
            badge.style.borderWidth = '1px';
            badge.style.borderStyle = 'solid';
            badge.textContent = `${label}: ${count}`;
            
            labelsContainer.appendChild(badge);
        });
}

/**
 * Tải một trang dữ liệu của dataset
 */
async function loadDatasetPage(pageNumber) {
    if (!window.datasetData || !window.datasetData.parsed) return;
    
    const pageSize = window.datasetData.pageSize;
    const startIndex = pageNumber * pageSize;
    const endIndex = Math.min(startIndex + pageSize, window.datasetData.data.length);
    
    // Nếu đã tải hết dữ liệu
    if (startIndex >= window.datasetData.data.length) {
        // Ẩn nút tải thêm và cập nhật trạng thái
        const loadMoreBtn = document.getElementById('load-more-samples');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        
        // Cập nhật thông tin hiển thị
        document.getElementById('dataset-preview-info').innerHTML = `<i class="fas fa-check-circle text-success me-1"></i> Đã tải tất cả ${window.datasetData.totalSamples.toLocaleString()} mẫu`;
        return;
    }
    
        const tableBody = document.querySelector('#dataset-preview-table tbody');
    
    // Nếu là trang đầu tiên, xóa sạch tbody
    if (pageNumber === 0) {
        tableBody.innerHTML = '';
        
        // Thêm hàng loading
        for (let i = 0; i < 3; i++) {
            const loadingRow = document.createElement('tr');
            loadingRow.className = 'loading-row';
            loadingRow.innerHTML = `
                <td></td>
                <td></td>
                <td></td>
            `;
            tableBody.appendChild(loadingRow);
        }
    }
    
    // Sử dụng setTimeout để cho phép UI cập nhật loading state
    return new Promise(resolve => {
        setTimeout(async () => {
            // Xóa các hàng loading
            const loadingRows = tableBody.querySelectorAll('.loading-row:not(#infinite-scroll-loader)');
            loadingRows.forEach(row => row.remove());
            
            // Tải và hiển thị dữ liệu
            for (let i = startIndex; i < endIndex; i++) {
                try {
            const row = document.createElement('tr');
                    const rowData = parseCSVRow(window.datasetData.data[i]);
                    
                    if (rowData.length <= Math.max(window.datasetData.textColIndex, window.datasetData.labelColIndex)) {
                        continue; // Bỏ qua hàng không đủ cột
                    }
            
            const indexCell = document.createElement('td');
            indexCell.textContent = i + 1;
            row.appendChild(indexCell);
            
            const textCell = document.createElement('td');
                    const textPreview = rowData[window.datasetData.textColIndex];
                    const textTrimmed = textPreview.length > 150 ? textPreview.substring(0, 150) + '...' : textPreview;
                    textCell.textContent = textTrimmed;
                    textCell.title = textPreview; // Hiển thị đầy đủ khi hover
            row.appendChild(textCell);
            
            const labelCell = document.createElement('td');
                    const label = rowData[window.datasetData.labelColIndex];
                    
            // Sử dụng badge có màu tương ứng với nhãn
                    const labelIndex = Object.keys(window.datasetData.labels).indexOf(label);
                    const backgroundColors = [
                        'rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 
                        'rgba(75, 192, 192, 0.2)', 'rgba(255, 206, 86, 0.2)',
                        'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'
                    ];
                    const borderColors = [
                        'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 
                        'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
                        'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
                    ];
                    
                    const bgColor = labelIndex >= 0 
                        ? backgroundColors[labelIndex % backgroundColors.length] 
                        : 'rgba(200, 200, 200, 0.2)';
                        
                    const borderColor = labelIndex >= 0 
                        ? borderColors[labelIndex % borderColors.length] 
                        : 'rgba(200, 200, 200, 1)';
            
            const labelBadge = document.createElement('span');
            labelBadge.className = 'badge rounded-pill';
            labelBadge.style.backgroundColor = bgColor;
            labelBadge.style.color = borderColor;
            labelBadge.style.borderColor = borderColor;
            labelBadge.style.borderWidth = '1px';
            labelBadge.style.borderStyle = 'solid';
                    labelBadge.textContent = label;
            
            labelCell.appendChild(labelBadge);
            row.appendChild(labelCell);
            
            tableBody.appendChild(row);
                } catch (e) {
                    console.error("Lỗi khi hiển thị hàng", i, e);
                }
            }
            
            // Cập nhật trạng thái
            window.datasetData.currentPage = pageNumber;
            const samplesLoaded = Math.min((pageNumber + 1) * pageSize, window.datasetData.totalSamples);
            document.getElementById('samples-loaded').textContent = samplesLoaded.toLocaleString();
            
            // Ẩn nút tải thêm nếu không cần thiết
            const loadMoreBtn = document.getElementById('load-more-samples');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            
            // Hiển thị thông báo nếu đã tải hết dữ liệu
            if (endIndex >= window.datasetData.data.length) {
                document.getElementById('dataset-preview-info').innerHTML = `<i class="fas fa-check-circle text-success me-1"></i> Đã tải tất cả ${window.datasetData.totalSamples.toLocaleString()} mẫu`;
            }
            
            resolve();
        }, 100);
    });
}

/**
 * Phân tích một hàng CSV, xử lý đúng trường hợp trích dẫn
 */
function parseCSVRow(rowStr) {
    if (!rowStr) return [];
    
    // Xử lý break line của Windows
    if (rowStr.includes('\r')) {
        rowStr = rowStr.split('\r')[0];
    }
    
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < rowStr.length; j++) {
        const char = rowStr[j];
        
        if (char === '"' && (j === 0 || rowStr[j-1] !== '\\')) {
            inQuotes = !inQuotes;
            continue;
        }
        
        if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
            continue;
        }
        
        currentValue += char;
    }
    
    if (currentValue) {
        values.push(currentValue.trim());
    }
    
    // Xóa dấu ngoặc kép ở đầu và cuối nếu có
    return values.map(v => v.replace(/^"|"$/g, ''));
}

/**
 * Đào tạo mô hình
 */
async function trainModel() {
    const datasetFile = document.getElementById('dataset-file').files[0];
    
    if (!datasetFile) {
        showToast('Vui lòng chọn file dataset', 'warning');
        return;
    }
    
    const textColumn = document.getElementById('text-column').value;
    const labelColumn = document.getElementById('label-column').value;
    
    if (!textColumn || !labelColumn) {
        showToast('Vui lòng nhập tên cột văn bản và cột nhãn', 'warning');
        return;
    }
    
    // Kiểm tra phương pháp vector hóa
    let vectorizationMethod = '';
    document.querySelectorAll('.vectorization-option').forEach(option => {
        if (option.checked) {
            vectorizationMethod = option.value;
        }
    });
    
    if (!vectorizationMethod) {
        showToast('Vui lòng chọn phương pháp vector hóa', 'warning');
        return;
    }
    
    // Kiểm tra phương pháp phân loại
    let classificationMethods = [];
    document.querySelectorAll('.classification-option').forEach(option => {
        if (option.checked) {
            classificationMethods.push(option.value);
        }
    });
    
    if (classificationMethods.length === 0) {
        showToast('Vui lòng chọn ít nhất một phương pháp phân loại', 'warning');
        return;
    }
    
    // Lấy thể loại mô hình
    let modelCategory = '';
    document.querySelectorAll('.model-category-option').forEach(option => {
        if (option.checked) {
            modelCategory = option.value;
        }
    });
    
    // Nếu là thể loại tùy chỉnh, lấy giá trị từ ô nhập
    if (modelCategory === 'custom') {
        const customCategory = document.getElementById('custom-category-input').value.trim();
        if (!customCategory) {
            showToast('Vui lòng nhập tên thể loại tùy chỉnh', 'warning');
            return;
        }
        modelCategory = customCategory;
    }
    
    // Tạo form data
    const formData = new FormData();
    formData.append('dataset', datasetFile);
    formData.append('text_column', textColumn);
    formData.append('label_column', labelColumn);
    formData.append('vectorization_method', vectorizationMethod);
    formData.append('classification_method', classificationMethods[0]);
    formData.append('max_features', document.getElementById('max-features').value);
    formData.append('train_test_split', document.getElementById('train-test-split').value / 100);
    formData.append('random_state', document.getElementById('random-state').value);
    formData.append('model_category', modelCategory);
    
    // Tên mô hình (nếu có)
    const modelName = document.getElementById('model-name').value;
    if (modelName) {
        formData.append('model_name', modelName);
    }
    
    // Thêm tham số k cho KNN nếu KNN được chọn
    const knnOption = document.getElementById('knn');
    if (knnOption && knnOption.checked) {
        const knnNeighbors = document.getElementById('knn-neighbors').value;
        formData.append('knn_neighbors', knnNeighbors);
    }
    
    // Thêm tham số ngram range nếu phương pháp là ngrams
    if (vectorizationMethod === 'ngrams') {
        const ngramMin = document.getElementById('ngram-min').value;
        const ngramMax = document.getElementById('ngram-max').value;
        
        if (parseInt(ngramMin) > parseInt(ngramMax)) {
            showToast('Giá trị Min không thể lớn hơn Max trong N-grams', 'warning');
            return;
        }
        
        formData.append('ngram_min', ngramMin);
        formData.append('ngram_max', ngramMax);
    }
    
    try {
        // Hiển thị loading
        showLoading('Đang đào tạo mô hình...');
        
        // Gửi request đào tạo mô hình
        const response = await fetch('/api/train_model', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Đảm bảo ẩn loading trong mọi trường hợp
        hideLoading();
        
        // Xóa mọi overlay loading có thể còn tồn tại
        const allOverlays = document.querySelectorAll('[id^="loading-overlay"]');
        allOverlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        // Đảm bảo body không còn class modal-open
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        if (result.status === 'error') {
            showToast(result.message || 'Lỗi khi đào tạo mô hình', 'danger');
            return;
        }
        
        // Hiển thị kết quả đào tạo với timeout nhỏ
        setTimeout(() => {
            // Ẩn trạng thái trống
            const emptyStateCard = document.getElementById('empty-state-card');
            if (emptyStateCard) {
                emptyStateCard.style.display = 'none';
            }
            
            // Hiển thị kết quả đào tạo
            const trainingResults = document.getElementById('training-results');
            if (trainingResults) {
                trainingResults.style.display = 'block';
            }
            
            // Lưu kết quả vào mảng để so sánh
            modelResults.push({
                ...result,
                timestamp: new Date().toLocaleString(),
                model_number: modelResults.length + 1
            });
            
            // Cập nhật chỉ số của mô hình hiện tại
            currentModelIndex = modelResults.length - 1;
            
            // Cập nhật nội dung kết quả
            updateResultsDisplay();
            
            // Cuộn đến phần kết quả
            document.getElementById('results-wrapper').scrollIntoView({ behavior: 'smooth' });
            
            // Hiển thị thông báo thành công
            showToast('Đã đào tạo mô hình thành công!', 'success');
        }, 100);
        
    } catch (error) {
        console.error('Lỗi khi đào tạo mô hình:', error);
        // Đảm bảo ẩn loading khi có lỗi
        hideLoading();
        showToast('Lỗi khi gửi yêu cầu đào tạo mô hình', 'danger');
    }
}

/**
 * Tạo HTML cho kết quả đào tạo
 */
function createTrainingResultHTML(result) {
    const training = result.training_result;
    const modelInfo = result.model_info;
    
    // Tính thời gian huấn luyện
    const processingTime = result.processing_time ? 
        `<div class="badge bg-primary bg-opacity-75 p-2 mb-3">⏱️ Thời gian xử lý: ${result.processing_time} giây</div>` : '';
    
    // Tạo HTML cho thông tin mô hình - thiết kế đơn giản hơn
    const modelInfoHTML = `
        <div class="card model-info-card mb-4">
            <div class="card-header bg-primary bg-opacity-75 text-white">
                <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i> Thông tin mô hình</h5>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-center mb-4">
                    ${processingTime}
                </div>
                
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Tên mô hình:</span>
                        <span class="text-secondary">${modelInfo.model_name}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Phương pháp phân loại:</span>
                        <span class="text-secondary">${modelInfo.classification_method}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Phương pháp vector hóa:</span>
                        <span class="text-secondary">${modelInfo.vectorization_method}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Số lớp:</span>
                        <span class="text-secondary">${training.labels.length}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Số đặc trưng:</span>
                        <span class="text-secondary">${formatNumber(training.feature_count)}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Mẫu huấn luyện:</span>
                        <span class="text-secondary">${formatNumber(training.train_samples)}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Mẫu kiểm thử:</span>
                        <span class="text-secondary">${formatNumber(training.test_samples)}</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
    
    // Tạo HTML card cho các chỉ số đánh giá - thiết kế trực quan hơn
    const metricsHTML = `
        <div class="card model-info-card mb-4">
            <div class="card-header bg-primary bg-opacity-75 text-white">
                <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i> Chỉ số đánh giá</h5>
            </div>
            <div class="card-body">
                <div class="row g-3 mb-3">
                    <div class="col-md-3 col-6">
                        <div class="metric-card text-center p-3 border-0 rounded shadow-sm" style="background-color: rgba(13, 110, 253, 0.1);">
                            <div class="display-4 fw-bold" style="color: #0d6efd;">${(training.accuracy * 100).toFixed(1)}%</div>
                            <p class="fs-5 mb-0">Accuracy</p>
                            <div class="small text-muted">Dự đoán đúng</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="metric-card text-center p-3 border-0 rounded shadow-sm" style="background-color: rgba(32, 136, 203, 0.1);">
                            <div class="display-4 fw-bold" style="color: #2088cb;">${(training.precision * 100).toFixed(1)}%</div>
                            <p class="fs-5 mb-0">Precision</p>
                            <div class="small text-muted">Độ chính xác</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="metric-card text-center p-3 border-0 rounded shadow-sm" style="background-color: rgba(86, 155, 215, 0.1);">
                            <div class="display-4 fw-bold" style="color: #569bd7;">${(training.recall * 100).toFixed(1)}%</div>
                            <p class="fs-5 mb-0">Recall</p>
                            <div class="small text-muted">Độ nhạy</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="metric-card text-center p-3 border-0 rounded shadow-sm" style="background-color: rgba(108, 175, 233, 0.1);">
                            <div class="display-4 fw-bold" style="color: #6cafe9;">${(training.f1 * 100).toFixed(1)}%</div>
                            <p class="fs-5 mb-0">F1 Score</p>
                            <div class="small text-muted">Điểm cân bằng</div>
                        </div>
                    </div>
                </div>
                
                <div class="row g-3 mt-3">
                    <div class="col-md-8">
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-table me-2"></i> Ma trận nhầm lẫn</h6>
                            </div>
                            <div class="card-body p-2">
                                <div class="confusion-matrix-container">
                                    ${createConfusionMatrixHTML(training.confusion_matrix, training.labels)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-chart-pie me-2"></i> Phân phối nhãn</h6>
                            </div>
                            <div class="card-body p-2">
                                <div class="chart-container" style="position: relative; height: 180px;">
                                    <canvas id="labels-distribution-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Kết hợp tất cả các phần
    const html = modelInfoHTML + metricsHTML;
    
    // Vẽ biểu đồ phân phối nhãn sau khi HTML được thêm vào DOM
    setTimeout(() => {
        const labelCounts = {};
        training.labels.forEach(label => {
            labelCounts[label] = 0;
        });
        
        // Tính tổng số mẫu mỗi nhãn từ ma trận nhầm lẫn
        for (let i = 0; i < training.confusion_matrix.length; i++) {
            for (let j = 0; j < training.confusion_matrix[i].length; j++) {
                if (i === j) {
                    labelCounts[training.labels[i]] += training.confusion_matrix[i][j];
                }
            }
        }
        
        const ctx = document.getElementById('labels-distribution-chart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(labelCounts),
                datasets: [{
                    data: Object.values(labelCounts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }, 100);
    
    return html;
}

/**
 * Tạo HTML cho ma trận nhầm lẫn
 */
function createConfusionMatrixHTML(confusionMatrix, labels) {
    if (!confusionMatrix || confusionMatrix.length === 0 || !labels || labels.length === 0) {
        return '<div class="alert alert-warning">Không có dữ liệu ma trận nhầm lẫn</div>';
    }
    
    // Rút gọn nhãn nếu quá dài
    const shortenedLabels = labels.map(label => formatDisplayValue(label, 8));
    
    let html = '<div class="table-responsive"><table class="table table-sm table-bordered confusion-matrix m-0">';
    
    // Tạo header với styling mới
    html += '<thead class="table-light"><tr><th style="background-color: #f8f9fa;"></th>';
    for (let i = 0; i < labels.length; i++) {
        html += `<th class="text-center" title="${labels[i]}">${shortenedLabels[i]}</th>`;
    }
    html += '</tr></thead>';
    
    // Tạo body với styling mới
    html += '<tbody>';
    for (let i = 0; i < confusionMatrix.length; i++) {
        html += `<tr><td class="fw-bold bg-light" title="${labels[i]}">${shortenedLabels[i]}</td>`;
        for (let j = 0; j < confusionMatrix[i].length; j++) {
            const value = confusionMatrix[i][j];
            let cellClass = 'text-center';
            let textClass = '';
            let bgColor = '#ffffff'; // Màu nền mặc định là trắng
            
            if (i === j && value > 0) {
                // Diagonal cells (correct predictions) - Màu xanh lam nhạt
                textClass = 'fw-bold';
                const intensity = Math.min(Math.max(value / 10, 0.1), 0.6);
                bgColor = `rgba(13, 110, 253, ${intensity})`; // Màu xanh lam với độ trong suốt
            } else if (value > 0) {
                // Incorrect predictions - Màu đỏ nhạt
                textClass = '';
                const intensity = Math.min(Math.max(value / 10, 0.1), 0.6);
                bgColor = `rgba(220, 53, 69, ${intensity})`; // Màu đỏ với độ trong suốt
            } else {
                // Khi giá trị bằng 0
                bgColor = '#f8f9fa'; // Màu xám rất nhạt
            }
            
            html += `<td class="${cellClass}" style="background-color: ${bgColor}"><span class="${textClass}">${value}</span></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    
    return html;
}

/**
 * Hiển thị loading indicator
 */
function showLoading(message = 'Đang xử lý...') {
    try {
        // Đầu tiên, xóa tất cả overlay hiện có để tránh chồng chéo
        hideLoading();
        
        // Tạo overlay mới với ID duy nhất để tránh xung đột
        const overlayId = 'loading-overlay-' + Date.now();
        let loadingOverlay = document.createElement('div');
        loadingOverlay.id = overlayId;
        loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingOverlay.style.zIndex = '9999';
        
        const loadingContent = document.createElement('div');
        loadingContent.className = 'bg-white p-4 rounded shadow text-center';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border text-primary mb-3';
        spinner.setAttribute('role', 'status');
        
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'loading-message-' + Date.now();
        loadingMessage.className = 'text-center';
        loadingMessage.textContent = message;
        
        loadingContent.appendChild(spinner);
        loadingContent.appendChild(loadingMessage);
        loadingOverlay.appendChild(loadingContent);
        document.body.appendChild(loadingOverlay);
        
        // Đặt timeout tự động ẩn loading sau 30 giây để tránh bị treo
        setTimeout(() => {
            if (document.getElementById(overlayId)) {
                console.log('Tự động ẩn loading overlay sau 30 giây');
                hideLoading();
            }
        }, 30000);
        
        console.log('Đã hiển thị loading overlay với ID:', overlayId);
    } catch (e) {
        console.error('Lỗi khi hiển thị loading:', e);
    }
}

/**
 * Ẩn loading indicator
 */
function hideLoading() {
    try {
        // Xóa tất cả các overlay loading
        const overlays = document.querySelectorAll('[id^="loading-overlay"]');
        overlays.forEach(overlay => {
            // Xóa overlay khỏi DOM hoàn toàn
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        // Xóa tất cả modal-backdrop không cần thiết
        const backdrops = document.querySelectorAll('.modal-backdrop:not(.show)');
        backdrops.forEach(backdrop => {
            if (backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        });
        
        // Phục hồi trạng thái body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Ghi log để debug
        console.log('Đã xóa tất cả loading overlay và khôi phục trạng thái body');
    } catch (e) {
        console.error('Lỗi khi ẩn loading:', e);
    }
}

/**
 * Hiển thị thông báo toast
 */
function showToast(message, type = 'info') {
    // Tạo container toast nếu chưa tồn tại
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Xác định màu sắc dựa trên loại toast
    let bgColor = 'bg-info';
    switch (type) {
        case 'success':
            bgColor = 'bg-success';
            break;
        case 'warning':
            bgColor = 'bg-warning';
            break;
        case 'danger':
            bgColor = 'bg-danger';
            break;
    }
    
    // Tạo toast mới
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgColor} text-white">
                <strong class="me-auto">Thông báo</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Đóng"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Thêm toast vào container
    toastContainer.innerHTML += toastHTML;
    
    // Hiển thị toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        autohide: true,
        delay: 5000
    });
    toast.show();
    
    // Xóa toast sau khi ẩn
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

/**
 * Thử nghiệm mô hình
 */
async function testModel() {
    const input = document.getElementById('test-input').value.trim();
    
    if (!input) {
        showToast('Vui lòng nhập văn bản cần phân loại', 'warning');
        return;
    }
    
    // Đảm bảo có mô hình đã được huấn luyện
    if (modelResults.length === 0 || currentModelIndex < 0) {
        showToast('Chưa có mô hình nào được huấn luyện', 'warning');
        return;
    }
    
    try {
        // Lấy thông tin mô hình hiện tại
        const currentModel = modelResults[currentModelIndex];
        
        // Hiển thị loading
        showLoading('Đang phân loại văn bản...');
        
        // Gửi request phân loại
        const response = await fetch('/api/test_model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: input,
                model_id: currentModel.model_info.model_id  // Sử dụng ID của mô hình hiện tại
            })
        });
        
        const result = await response.json();
        
        // Ẩn loading
        hideLoading();
        
        if (result.status === 'error') {
            showToast(result.message || 'Lỗi khi phân loại văn bản', 'danger');
            return;
        }
        
        // Hiển thị kết quả
        const testResult = document.getElementById('test-result');
        if (testResult) {
            testResult.style.display = 'block';
            
            const labelColor = getBgColorForLabel(result.label);
            
            testResult.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-2"><strong>Nhãn dự đoán:</strong></div>
                        <div class="mb-3">
                            <span class="badge ${labelColor} p-2 fs-6">${result.label}</span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-2"><strong>Độ tin cậy:</strong></div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar ${labelColor}" role="progressbar" 
                                style="width: ${(result.confidence * 100).toFixed(2)}%;" 
                                aria-valuenow="${(result.confidence * 100).toFixed(2)}" 
                                aria-valuemin="0" aria-valuemax="100">
                                ${(result.confidence * 100).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
                
                ${result.all_probabilities ? `
                <hr>
                <div>
                    <div class="mb-2"><strong>Phân phối xác suất cho tất cả các nhãn:</strong></div>
                    <div class="row g-2">
                        ${Object.entries(result.all_probabilities).map(([label, prob]) => {
                            const color = getBgColorForLabel(label);
                            return `
                            <div class="col-md-6 col-lg-4">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small">${label}</span>
                                    <span class="badge ${color}">${(prob * 100).toFixed(2)}%</span>
                                </div>
                                <div class="progress mb-2" style="height: 8px;">
                                    <div class="progress-bar ${color}" role="progressbar" 
                                        style="width: ${(prob * 100).toFixed(2)}%;" 
                                        aria-valuenow="${(prob * 100).toFixed(2)}" 
                                        aria-valuemin="0" aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="mt-3 small text-muted">
                    <i class="fas fa-info-circle me-1"></i> 
                    Kết quả phân loại bằng mô hình: <strong>${currentModel.model_info.model_name}</strong>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Lỗi khi thử nghiệm mô hình:', error);
        hideLoading();
        showToast('Lỗi khi gửi yêu cầu phân loại văn bản', 'danger');
    }
}

/**
 * Lấy màu nền dựa trên nhãn
 */
function getBgColorForLabel(label) {
    if (!label) return 'bg-secondary';
    
    // Chuyển đổi nhãn thành mã hash
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = ((hash << 5) - hash) + label.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Danh sách các màu bootstrap mới mô phỏng bảng xanh lam
    const colors = [
        'primary',          // Xanh lam
        'primary-subtle',   // Xanh lam nhạt
        'primary-emphasis', // Xanh lam đậm
        'info',             // Xanh dương
        'info-subtle',      // Xanh dương nhạt
        'info-emphasis'     // Xanh dương đậm
    ];
    
    // Lấy màu dựa vào hash
    const colorIndex = Math.abs(hash) % colors.length;
    return `bg-${colors[colorIndex]}`;
}

/**
 * Hàm để định dạng giá trị hiển thị
 */
function formatDisplayValue(value, maxLength) {
    if (value.length > maxLength) {
        return value.substring(0, maxLength) + '...';
    }
    return value;
}

/**
 * Hàm để định dạng số
 */
function formatNumber(value) {
    return value.toLocaleString();
}

/**
 * Cập nhật hiển thị kết quả dựa trên mô hình hiện tại
 */
function updateResultsDisplay() {
    const resultsContainer = document.getElementById('results-container');
    
    if (modelResults.length === 0 || currentModelIndex < 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i> 
                Chưa có kết quả nào được lưu.
            </div>
        `;
        return;
    }
    
    // Lấy kết quả của mô hình hiện tại
    const currentResult = modelResults[currentModelIndex];
    
    // Tạo HTML cho giao diện lựa chọn mô hình
    let modelSelectorHTML = '';
    if (modelResults.length > 1) {
        modelSelectorHTML = `
            <div class="card mb-4">
                <div class="card-header bg-primary bg-opacity-75 text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-exchange-alt me-2"></i> So sánh mô hình</h5>
                        <div class="badge bg-light text-primary p-2">Đã lưu ${modelResults.length} mô hình</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center">
                                <button class="btn btn-outline-primary me-2" 
                                        onclick="changeModel(${currentModelIndex - 1})" 
                                        ${currentModelIndex <= 0 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                
                                <select class="form-select" id="model-selector" onchange="changeModel(this.value)">
                                    ${modelResults.map((result, index) => {
                                        const modelName = result.model_info.model_name;
                                        const classifier = result.model_info.classification_method;
                                        const vectorizer = result.model_info.vectorization_method;
                                        return `<option value="${index}" ${index === currentModelIndex ? 'selected' : ''}>
                                            Mô hình #${index + 1}: ${modelName} (${classifier} + ${vectorizer})
                                        </option>`;
                                    }).join('')}
                                </select>
                                
                                <button class="btn btn-outline-primary ms-2" 
                                        onclick="changeModel(${currentModelIndex + 1})" 
                                        ${currentModelIndex >= modelResults.length - 1 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-primary bg-opacity-75" onclick="compareModels()">
                                <i class="fas fa-chart-bar me-1"></i> So sánh các chỉ số
                            </button>
                        </div>
                    </div>
                    
                    ${modelResults.length > 1 ? `
                    <div class="mt-3">
                        <div class="small text-muted">
                            <i class="fas fa-info-circle me-1"></i> 
                            Đã lưu kết quả của ${modelResults.length} mô hình. Bạn có thể chuyển đổi giữa các kết quả hoặc so sánh chúng.
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Tạo HTML cho kết quả mô hình
    const resultHTML = createTrainingResultHTML(currentResult);
    
    // Kết hợp tất cả - Đổi thứ tự để thông tin mô hình hiển thị trước, card so sánh ở dưới
    resultsContainer.innerHTML = resultHTML + modelSelectorHTML;
    
    // Cập nhật biểu đồ so sánh nếu có nhiều mô hình
    setTimeout(() => {
        if (modelResults.length > 1) {
            updateComparisonCharts();
        }
    }, 200);
}

/**
 * Chuyển đổi giữa các mô hình
 */
function changeModel(index) {
    index = parseInt(index);
    if (index >= 0 && index < modelResults.length) {
        currentModelIndex = index;
        updateResultsDisplay();
    }
}

/**
 * Hiển thị hộp thoại so sánh các mô hình
 */
function compareModels() {
    if (modelResults.length <= 1) {
        showToast('Cần ít nhất 2 mô hình để so sánh', 'warning');
        return;
    }
    
    // Tạo dữ liệu cho bảng so sánh
    const comparisonData = modelResults.map(result => {
        const training = result.training_result;
        const modelInfo = result.model_info;
        
        return {
            model_number: result.model_number,
            model_name: modelInfo.model_name,
            classification: modelInfo.classification_method,
            vectorization: modelInfo.vectorization_method,
            accuracy: (training.accuracy * 100).toFixed(1),
            precision: (training.precision * 100).toFixed(1),
            recall: (training.recall * 100).toFixed(1),
            f1: (training.f1 * 100).toFixed(1),
            feature_count: training.feature_count,
            train_samples: training.train_samples,
            test_samples: training.test_samples
        };
    });
    
    // Tạo HTML cho bảng so sánh
    let comparisonHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-primary bg-opacity-75">
                    <tr>
                        <th>#</th>
                        <th>Tên mô hình</th>
                        <th>Phân loại</th>
                        <th>Vector hóa</th>
                        <th class="text-end">Accuracy</th>
                        <th class="text-end">Precision</th>
                        <th class="text-end">Recall</th>
                        <th class="text-end">F1 Score</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    comparisonData.forEach(data => {
        comparisonHTML += `
            <tr>
                <td>${data.model_number}</td>
                <td>${data.model_name}</td>
                <td>${data.classification}</td>
                <td>${data.vectorization}</td>
                <td class="text-end">${data.accuracy}%</td>
                <td class="text-end">${data.precision}%</td>
                <td class="text-end">${data.recall}%</td>
                <td class="text-end">${data.f1}%</td>
            </tr>
        `;
    });
    
    comparisonHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    // Hiển thị modal với bảng so sánh
    const modalHTML = `
        <div class="modal fade" id="compare-models-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-primary bg-opacity-75 text-white">
                        <h5 class="modal-title"><i class="fas fa-chart-bar me-2"></i>So sánh các mô hình</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="alert alert-primary bg-opacity-25">
                            <i class="fas fa-info-circle me-2"></i>
                            Bảng so sánh các chỉ số đánh giá của ${modelResults.length} mô hình đã huấn luyện.
                        </div>
                        ${comparisonHTML}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal vào DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('compare-models-modal'));
    modal.show();
    
    // Xóa modal khỏi DOM khi đóng
    document.getElementById('compare-models-modal').addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modalContainer);
    });
}

/**
 * Cập nhật biểu đồ so sánh các chỉ số đánh giá
 */
function updateComparisonCharts() {
    if (modelResults.length < 2) {
        document.getElementById('metrics-comparison-container').style.display = 'none';
        return;
    }
    
    document.getElementById('metrics-comparison-container').style.display = 'block';
    
    // Chuẩn bị dữ liệu cho biểu đồ
    const labels = modelResults.map(result => {
        const modelInfo = result.model_info;
        return `Mô hình #${result.model_number} (${modelInfo.classification_method})`;
    });
    
    const accuracyData = modelResults.map(result => (result.training_result.accuracy * 100).toFixed(1));
    const precisionData = modelResults.map(result => (result.training_result.precision * 100).toFixed(1));
    const recallData = modelResults.map(result => (result.training_result.recall * 100).toFixed(1));
    const f1Data = modelResults.map(result => (result.training_result.f1 * 100).toFixed(1));
    
    // Vẽ biểu đồ Accuracy và Precision
    const accuracyPrecisionCtx = document.getElementById('accuracy-precision-chart').getContext('2d');
    if (window.accuracyPrecisionChart) {
        window.accuracyPrecisionChart.destroy();
    }
    
    window.accuracyPrecisionChart = new Chart(accuracyPrecisionCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Accuracy',
                    data: accuracyData,
                    backgroundColor: 'rgba(13, 110, 253, 0.5)',
                    borderColor: 'rgba(13, 110, 253, 0.8)',
                    borderWidth: 1
                },
                {
                    label: 'Precision',
                    data: precisionData,
                    backgroundColor: 'rgba(32, 136, 203, 0.5)',
                    borderColor: 'rgba(32, 136, 203, 0.8)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Accuracy & Precision (%)',
                    color: '#0d6efd'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Vẽ biểu đồ Recall và F1
    const recallF1Ctx = document.getElementById('recall-f1-chart').getContext('2d');
    if (window.recallF1Chart) {
        window.recallF1Chart.destroy();
    }
    
    window.recallF1Chart = new Chart(recallF1Ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Recall',
                    data: recallData,
                    backgroundColor: 'rgba(86, 155, 215, 0.5)',
                    borderColor: 'rgba(86, 155, 215, 0.8)',
                    borderWidth: 1
                },
                {
                    label: 'F1 Score',
                    data: f1Data,
                    backgroundColor: 'rgba(108, 175, 233, 0.5)',
                    borderColor: 'rgba(108, 175, 233, 0.8)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Recall & F1 Score (%)',
                    color: '#0d6efd'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Thêm hàm mới để xử lý việc hiển thị/ẩn tham số KNN
function toggleKNNParams() {
    const knnOption = document.getElementById('knn');
    const knnParams = document.querySelector('.knn-params');
    
    if (knnParams) {
        knnParams.style.display = knnOption.checked ? 'block' : 'none';
    }
} 