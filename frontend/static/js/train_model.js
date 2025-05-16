/**
 * JavaScript cho trang đào tạo mô hình phân loại văn bản
 */

// Khai báo biến global
let modelResults = []; // Mảng lưu trữ kết quả của các mô hình đã huấn luyện
let currentModelIndex = -1; // Chỉ số của mô hình hiện tại đang hiển thị

// Biến lưu trữ thông tin mô hình hiện tại
let currentModelInfo = null;

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
            // Ẩn tất cả các tùy chọn tham số trước
            document.querySelectorAll('.knn-params, .neural-network-params, .gradient-boosting-params, .svm-params').forEach(elem => {
                if (elem) elem.style.display = 'none';
            });
            
            // Hiển thị tùy chọn tương ứng với phương pháp đã chọn
            if (this.id === 'knn') {
                const knnParams = document.querySelector('.knn-params');
                if (knnParams) knnParams.style.display = 'block';
            } else if (this.id === 'neural_network') {
                const nnParams = document.querySelector('.neural-network-params');
                if (nnParams) nnParams.style.display = 'block';
            } else if (this.id === 'gradient_boosting') {
                const gbParams = document.querySelector('.gradient-boosting-params');
                if (gbParams) gbParams.style.display = 'block';
            } else if (this.id === 'svm') {
                const svmParams = document.querySelector('.svm-params');
                if (svmParams) svmParams.style.display = 'block';
            }
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
    
    // Kiểm tra trạng thái ban đầu của các phương pháp phân loại
    // và hiển thị tùy chọn tham số tương ứng
    const knn = document.getElementById('knn');
    if (knn && knn.checked) {
        const knnParams = document.querySelector('.knn-params');
        if (knnParams) knnParams.style.display = 'block';
    }
    
    const nn = document.getElementById('neural_network');
    if (nn && nn.checked) {
        const nnParams = document.querySelector('.neural-network-params');
        if (nnParams) nnParams.style.display = 'block';
    }
    
    const gb = document.getElementById('gradient_boosting');
    if (gb && gb.checked) {
        const gbParams = document.querySelector('.gradient-boosting-params');
        if (gbParams) gbParams.style.display = 'block';
    }
    
    const svm = document.getElementById('svm');
    if (svm && svm.checked) {
        const svmParams = document.querySelector('.svm-params');
        if (svmParams) svmParams.style.display = 'block';
    }
    
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
        toggleKNNParams();
        toggleNeuralNetworkParams();
        toggleGradientBoostingParams();
        toggleSVMParams();
    });
    
    document.getElementById('deselect-all-classifications')?.addEventListener('click', function() {
        document.querySelectorAll('.classification-option').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Đảm bảo ít nhất một phương pháp được chọn
        if (document.querySelectorAll('.classification-option:checked').length === 0) {
            document.getElementById('naive_bayes').checked = true;
        }
        toggleKNNParams();
        toggleNeuralNetworkParams();
        toggleGradientBoostingParams();
        toggleSVMParams();
    });

    // Xử lý hiển thị/ẩn tham số khi chọn/bỏ chọn KNN
    document.getElementById('knn').addEventListener('change', toggleKNNParams);
    
    // Xử lý hiển thị/ẩn tham số khi chọn/bỏ chọn Neural Network
    document.getElementById('neural_network').addEventListener('change', toggleNeuralNetworkParams);
    
    // Xử lý hiển thị/ẩn tham số khi chọn/bỏ chọn Gradient Boosting
    document.getElementById('gradient_boosting').addEventListener('change', toggleGradientBoostingParams);
    
    // Xử lý hiển thị/ẩn tham số khi chọn/bỏ chọn SVM
    document.getElementById('svm').addEventListener('change', toggleSVMParams);
    
    // Kiểm tra trạng thái ban đầu của các phương pháp phân loại
    // và hiển thị tùy chọn tham số tương ứng
    toggleKNNParams();
    toggleNeuralNetworkParams();
    toggleGradientBoostingParams();
    toggleSVMParams();
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
            isLoading: false
        };
        
        // Đọc file CSV
        const text = await datasetFile.text();
        let rows = text.split('\n');
        
        if (rows[0].charCodeAt(0) === 0xFEFF) {
            rows[0] = rows[0].substring(1); // Loại bỏ BOM nếu có
        }
        
        if (rows.length < 2) {
            throw new Error('Dataset không hợp lệ hoặc không có dữ liệu');
        }
        
        try {
            const headerLine = rows[0].trim();
            if (headerLine.includes('\r')) {
                window.datasetData.header = headerLine.split('\r')[0].split(',');
            } else {
                window.datasetData.header = headerLine.split(',');
            }
            window.datasetData.header = window.datasetData.header.map(col => col.trim().replace(/^"|"$/g, ''));
        } catch (e) {
            throw new Error('Không thể phân tích header của file CSV. Vui lòng kiểm tra định dạng file.');
        }
        
        // Tự động đề xuất cột văn bản và cột nhãn
        const textColumn = document.getElementById('text-column').value;
        const labelColumn = document.getElementById('label-column').value;
        
        // Nếu đã có giá trị nhập vào, tìm theo giá trị đó
        if (textColumn) {
            window.datasetData.textColIndex = window.datasetData.header.findIndex(col => col.toLowerCase() === textColumn.toLowerCase());
        }
        
        if (labelColumn) {
            window.datasetData.labelColIndex = window.datasetData.header.findIndex(col => col.toLowerCase() === labelColumn.toLowerCase());
        }
        
        // Nếu chưa tìm thấy, gợi ý cột văn bản và cột nhãn dựa trên tên cột phổ biến
        if (window.datasetData.textColIndex === -1) {
            // Các tên cột văn bản phổ biến
            const commonTextColumns = ['text', 'content', 'document', 'message', 'description', 'review', 'nội dung', 'văn bản'];
            for (const col of commonTextColumns) {
                const index = window.datasetData.header.findIndex(header => header.toLowerCase().includes(col));
                if (index !== -1) {
                    window.datasetData.textColIndex = index;
                    // Cập nhật giá trị vào trường nhập liệu
                    document.getElementById('text-column').value = window.datasetData.header[index];
                    break;
                }
            }
            // Nếu vẫn không tìm thấy, lấy cột đầu tiên làm cột văn bản
            if (window.datasetData.textColIndex === -1 && window.datasetData.header.length > 0) {
                window.datasetData.textColIndex = 0;
                document.getElementById('text-column').value = window.datasetData.header[0];
            }
        }
        
        if (window.datasetData.labelColIndex === -1) {
            // Các tên cột nhãn phổ biến
            const commonLabelColumns = ['label', 'class', 'category', 'target', 'type', 'sentiment', 'nhãn', 'phân loại', 'thể loại'];
            for (const col of commonLabelColumns) {
                const index = window.datasetData.header.findIndex(header => header.toLowerCase().includes(col));
                if (index !== -1 && index !== window.datasetData.textColIndex) {
                    window.datasetData.labelColIndex = index;
                    // Cập nhật giá trị vào trường nhập liệu
                    document.getElementById('label-column').value = window.datasetData.header[index];
                    break;
                }
            }
            // Nếu vẫn không tìm thấy, lấy cột cuối cùng làm cột nhãn (miễn là khác cột văn bản)
            if (window.datasetData.labelColIndex === -1 && window.datasetData.header.length > 1) {
                const lastColIndex = window.datasetData.header.length - 1;
                if (lastColIndex !== window.datasetData.textColIndex) {
                    window.datasetData.labelColIndex = lastColIndex;
                } else {
                    // Nếu cột cuối trùng với cột văn bản, lấy cột kế cuối
                    window.datasetData.labelColIndex = lastColIndex - 1;
                }
                if (window.datasetData.labelColIndex >= 0) {
                    document.getElementById('label-column').value = window.datasetData.header[window.datasetData.labelColIndex];
                }
            }
        }
        
        window.datasetData.data = rows.slice(1).filter(row => row.trim());
        window.datasetData.totalSamples = window.datasetData.data.length;
        window.datasetData.parsed = true;
        
        document.getElementById('dataset-total-samples').textContent = window.datasetData.totalSamples.toLocaleString();
        document.getElementById('total-samples-count').textContent = window.datasetData.totalSamples.toLocaleString();
        
        // Cập nhật cấu trúc bảng preview để hiển thị tất cả các cột
        updatePreviewTableHeader(window.datasetData.header);
        
        // Phân tích và hiển thị thông tin về nhãn nếu đã tìm thấy cột nhãn
        if (window.datasetData.labelColIndex !== -1) {
            await parseDatasetLabels(Math.min(1000, window.datasetData.totalSamples));
        } else {
            // Nếu không tìm thấy cột nhãn, hiển thị thông báo
            document.getElementById('dataset-labels-distribution').innerHTML = 
                '<div class="alert alert-info mb-0">Chưa xác định được cột nhãn. Vui lòng nhập tên cột nhãn.</div>';
        }
        
        await loadDatasetPage(0);
        
        hideLoading();
        
        const allOverlays = document.querySelectorAll('[id^="loading-overlay"]');
        allOverlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        setTimeout(() => {
            const previewModal = new bootstrap.Modal(document.getElementById('preview-dataset-modal'));
            previewModal.show();
            
            const tableContainer = document.querySelector('.table-responsive');
            if (tableContainer) {
                tableContainer.removeEventListener('scroll', handleTableScroll);
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
 * Cập nhật cấu trúc bảng preview để hiển thị tất cả các cột
 */
function updatePreviewTableHeader(headers) {
    const tableHead = document.querySelector('#dataset-preview-table thead tr');
    if (!tableHead) return;
    
    // Xóa các cột hiện tại
    tableHead.innerHTML = '';
    
    // Thêm cột STT
    const indexHeader = document.createElement('th');
    indexHeader.style.width = '50px';
    indexHeader.textContent = '#';
    tableHead.appendChild(indexHeader);
    
    // Thêm mỗi cột từ header
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        // Đánh dấu cột văn bản và cột nhãn
        if (window.datasetData.textColIndex !== -1 && header === headers[window.datasetData.textColIndex]) {
            th.className = 'text-primary';
            th.innerHTML = `${header} <i class="fas fa-font ms-1" title="Cột văn bản"></i>`;
        } else if (window.datasetData.labelColIndex !== -1 && header === headers[window.datasetData.labelColIndex]) {
            th.className = 'text-primary';
            th.innerHTML = `${header} <i class="fas fa-tag ms-1" title="Cột nhãn"></i>`;
        }
        tableHead.appendChild(th);
    });
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
    
    if (scrollPosition >= totalHeight - 100) {
        const nextPage = window.datasetData.currentPage + 1;
        const startIndex = nextPage * window.datasetData.pageSize;
        
        if (startIndex < window.datasetData.data.length) {
            window.datasetData.isLoading = true;
            
            if (nextPage % 5 === 0 && window.datasetData.pageSize < 100) {
                window.datasetData.pageSize = Math.min(100, window.datasetData.pageSize * 1.5);
            }
            
            const tableBody = document.querySelector('#dataset-preview-table tbody');
            const loadingRow = document.createElement('tr');
            loadingRow.className = 'loading-row';
            loadingRow.id = 'infinite-scroll-loader';
            loadingRow.innerHTML = `
                <td colspan="${window.datasetData.header.length + 1}" class="text-center">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <span>Đang tải thêm dữ liệu...</span>
                </td>
            `;
            tableBody.appendChild(loadingRow);
            
            loadDatasetPage(nextPage).then(() => {
                window.datasetData.isLoading = false;
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
    if (!window.datasetData || !window.datasetData.parsed || window.datasetData.labelColIndex === -1) return;
    
    window.datasetData.labels = {};
    
    const sampleSize = Math.min(maxSamples, window.datasetData.data.length);
    
    for (let i = 0; i < sampleSize; i++) {
        try {
            const rowData = parseCSVRow(window.datasetData.data[i]);
            if (rowData.length <= window.datasetData.labelColIndex) {
                continue;
            }
            
            const label = rowData[window.datasetData.labelColIndex].replace(/^"|"$/g, '');
            
            if (window.datasetData.labels[label]) {
                window.datasetData.labels[label]++;
            } else {
                window.datasetData.labels[label] = 1;
            }
        } catch (e) {
            console.error("Lỗi khi phân tích hàng", i, e);
        }
    }
    
    const labelsContainer = document.getElementById('dataset-labels-distribution');
    labelsContainer.innerHTML = '';
    
    const backgroundColors = [
        'rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 
        'rgba(75, 192, 192, 0.2)', 'rgba(255, 206, 86, 0.2)',
        'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)',
        'rgba(199, 199, 199, 0.2)', 'rgba(83, 102, 255, 0.2)',
        'rgba(255, 99, 255, 0.2)', 'rgba(0, 212, 255, 0.2)'
    ];
    
    const borderColors = [
        'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 
        'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 255, 1)', 'rgba(0, 212, 255, 1)'
    ];
    
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
    
    if (startIndex >= window.datasetData.data.length) {
        const loadMoreBtn = document.getElementById('load-more-samples');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        
        document.getElementById('dataset-preview-info').innerHTML = `<i class="fas fa-check-circle text-success me-1"></i> Đã tải tất cả ${window.datasetData.totalSamples.toLocaleString()} mẫu`;
        return;
    }
    
    const tableBody = document.querySelector('#dataset-preview-table tbody');
    
    if (pageNumber === 0) {
        tableBody.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const loadingRow = document.createElement('tr');
            loadingRow.className = 'loading-row';
            loadingRow.innerHTML = '<td colspan="' + (window.datasetData.header.length + 1) + '"></td>';
            tableBody.appendChild(loadingRow);
        }
    }
    
    return new Promise(resolve => {
        setTimeout(async () => {
            const loadingRows = tableBody.querySelectorAll('.loading-row:not(#infinite-scroll-loader)');
            loadingRows.forEach(row => row.remove());
            
            for (let i = startIndex; i < endIndex; i++) {
                try {
                    const row = document.createElement('tr');
                    const rowData = parseCSVRow(window.datasetData.data[i]);
                    
                    // Thêm cột STT
                    const indexCell = document.createElement('td');
                    indexCell.textContent = i + 1;
                    row.appendChild(indexCell);
                    
                    // Thêm dữ liệu cho mỗi cột
                    for (let j = 0; j < window.datasetData.header.length; j++) {
                        const cell = document.createElement('td');
                        
                        if (j < rowData.length) {
                            const cellValue = rowData[j];
                            const textTrimmed = cellValue.length > 150 ? cellValue.substring(0, 150) + '...' : cellValue;
                            cell.textContent = textTrimmed;
                            cell.title = cellValue;
                            
                            // Nếu là cột nhãn và đã xác định cột nhãn
                            if (j === window.datasetData.labelColIndex && window.datasetData.labelColIndex !== -1) {
                                // Tạo badge cho nhãn
                                cell.textContent = '';
                                const label = cellValue;
                                
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
                        
                                cell.appendChild(labelBadge);
                            }
                        } else {
                            cell.textContent = '';
                        }
                        
                        row.appendChild(cell);
                    }
                    
                    tableBody.appendChild(row);
                } catch (e) {
                    console.error("Lỗi khi hiển thị hàng", i, e);
                }
            }
            
            window.datasetData.currentPage = pageNumber;
            const samplesLoaded = Math.min((pageNumber + 1) * pageSize, window.datasetData.totalSamples);
            document.getElementById('samples-loaded').textContent = samplesLoaded.toLocaleString();
            
            const loadMoreBtn = document.getElementById('load-more-samples');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            
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
    
    return values.map(v => v.replace(/^"|"$/g, ''));
}

/**
 * Hiển thị loading indicator với thanh tiến trình
 */
function showLoading(message = 'Đang xử lý...', showProgress = false) {
    // Xóa overlay cũ nếu có
    hideLoading();
    
    // Tạo unique ID bằng timestamp
    const timestamp = new Date().getTime();
    const overlayId = 'loading-overlay-' + timestamp;
    const progressBarId = 'progress-bar-' + timestamp;
    const statusMessageId = 'status-message-' + timestamp;
    
    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    
    // Tạo content
    const content = document.createElement('div');
    content.className = 'bg-white p-4 rounded shadow text-center';
    content.style.width = '400px';
    content.style.maxWidth = '90%';
    
    if (!showProgress) {
        // Chỉ hiển thị spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border text-primary mb-3';
        spinner.setAttribute('role', 'status');
        content.appendChild(spinner);
    } else {
        // Hiển thị thanh tiến trình
        const progressContainer = document.createElement('div');
        progressContainer.className = 'mb-3';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress';
        progressBar.style.height = '20px';
        
        const progressBarInner = document.createElement('div');
        progressBarInner.id = progressBarId;
        progressBarInner.className = 'progress-bar progress-bar-striped progress-bar-animated';
        progressBarInner.style.width = '0%';
        progressBarInner.setAttribute('role', 'progressbar');
        progressBarInner.setAttribute('aria-valuenow', '0');
        progressBarInner.setAttribute('aria-valuemin', '0');
        progressBarInner.setAttribute('aria-valuemax', '100');
        
        progressBar.appendChild(progressBarInner);
        progressContainer.appendChild(progressBar);
        
        // Thêm thông tin trạng thái
        const statusContainer = document.createElement('div');
        statusContainer.className = 'mt-2 mb-3';
        
        const statusMessage = document.createElement('div');
        statusMessage.id = statusMessageId;
        statusMessage.className = 'small text-muted';
        statusMessage.textContent = "Đang chuẩn bị...";
        
        statusContainer.appendChild(statusMessage);
        progressContainer.appendChild(statusContainer);
        
        content.appendChild(progressContainer);
        
        // Thêm nút hủy
        const btnContainer = document.createElement('div');
        btnContainer.className = 'mt-3';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-sm btn-outline-secondary';
        cancelBtn.textContent = 'Hủy';
        cancelBtn.onclick = function() {
            hideLoading();
        };
        
        btnContainer.appendChild(cancelBtn);
        content.appendChild(btnContainer);
    }
    
    // Thêm thông báo
    const messageElem = document.createElement('div');
    messageElem.className = 'text-center';
    messageElem.textContent = message;
    content.appendChild(messageElem);
    
    // Thêm vào overlay và body
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Thiết lập timeout tự động ẩn
    setTimeout(function() {
        if (document.getElementById(overlayId)) {
            hideLoading();
        }
    }, 60000);
    
    return {
        overlayId: overlayId,
        progressBarId: progressBarId,
        statusMessageId: statusMessageId
    };
}

/**
 * Ẩn loading indicator
 */
function hideLoading() {
    // Xóa tất cả các overlay loading
    const elements = document.querySelectorAll('[id^="loading-overlay"]');
    for (let i = 0; i < elements.length; i++) {
        if (elements[i] && elements[i].parentNode) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    }
    
    // Xóa backdrop nếu không có modal đang hiển thị
    const backdrops = document.querySelectorAll('.modal-backdrop');
    const activeModals = document.querySelectorAll('.modal.show');
    if (activeModals.length === 0) {
        for (let i = 0; i < backdrops.length; i++) {
            if (backdrops[i] && backdrops[i].parentNode) {
                backdrops[i].parentNode.removeChild(backdrops[i]);
            }
        }
    }
    
    // Khôi phục trạng thái body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Dừng polling nếu đang chạy
    if (currentPollingInterval) {
        clearInterval(currentPollingInterval);
        currentPollingInterval = null;
    }
}

/**
 * Hiển thị thông báo toast
 */
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
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
    
    toastContainer.innerHTML += toastHTML;
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        autohide: true,
        delay: 5000
    });
    toast.show();
    
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
    
    if (modelResults.length === 0 || currentModelIndex < 0) {
        showToast('Chưa có mô hình nào được huấn luyện', 'warning');
        return;
    }
    
    try {
        const currentModel = modelResults[currentModelIndex];
        
        // Hiển thị loading với thanh tiến trình
        const loadingIds = showLoading('Đang phân loại văn bản...', true);
        currentProgressBarId = loadingIds.progressBarId;
        currentStatusMessageId = loadingIds.statusMessageId;
        currentOverlayId = loadingIds.overlayId;
        
        // Bắt đầu polling để cập nhật tiến trình
        startProgressPolling();
        
        const response = await fetch('/api/test_model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: input,
                model_id: currentModel.model_info.model_id
            })
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.status === 'error') {
            showToast(result.message || 'Lỗi khi phân loại văn bản', 'danger');
            return;
        }
        
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
    
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = ((hash << 5) - hash) + label.charCodeAt(i);
        hash = hash & hash;
    }
    
    const colors = [
        'primary',
        'primary-subtle',
        'primary-emphasis',
        'info',
        'info-subtle',
        'info-emphasis'
    ];
    
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
    
    const currentResult = modelResults[currentModelIndex];
    
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
    
    const resultHTML = createTrainingResultHTML(currentResult);
    
    resultsContainer.innerHTML = resultHTML + modelSelectorHTML;
    
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
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    const modal = new bootstrap.Modal(document.getElementById('compare-models-modal'));
    modal.show();
    
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
    
    const labels = modelResults.map(result => {
        const modelInfo = result.model_info;
        return `Mô hình #${result.model_number} (${modelInfo.classification_method})`;
    });
    
    const accuracyData = modelResults.map(result => (result.training_result.accuracy * 100).toFixed(1));
    const precisionData = modelResults.map(result => (result.training_result.precision * 100).toFixed(1));
    const recallData = modelResults.map(result => (result.training_result.recall * 100).toFixed(1));
    const f1Data = modelResults.map(result => (result.training_result.f1 * 100).toFixed(1));
    
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

/**
 * Hiển thị/ẩn tham số cho KNN
 */
function toggleKNNParams() {
    const knnOption = document.getElementById('knn');
    const knnParams = document.querySelector('.knn-params');
    
    if (knnParams) {
        knnParams.style.display = knnOption.checked ? 'block' : 'none';
    }
}

/**
 * Hiển thị/ẩn tham số cho Neural Network
 */
function toggleNeuralNetworkParams() {
    const nnOption = document.getElementById('neural_network');
    const nnParams = document.querySelector('.neural-network-params');
    
    if (nnParams) {
        nnParams.style.display = nnOption.checked ? 'block' : 'none';
    }
}

/**
 * Hiển thị/ẩn tham số cho Gradient Boosting
 */
function toggleGradientBoostingParams() {
    const gbOption = document.getElementById('gradient_boosting');
    const gbParams = document.querySelector('.gradient-boosting-params');
    
    if (gbParams) {
        gbParams.style.display = gbOption.checked ? 'block' : 'none';
    }
}

/**
 * Hiển thị/ẩn tham số cho SVM
 */
function toggleSVMParams() {
    const svmOption = document.getElementById('svm');
    const svmParams = document.querySelector('.svm-params');
    
    if (svmParams) {
        svmParams.style.display = svmOption.checked ? 'block' : 'none';
    }
}

/**
 * Cập nhật thanh tiến trình và thông báo trạng thái
 * @param {string} progressBarId - ID của thanh tiến trình
 * @param {string} statusMessageId - ID của thông báo trạng thái
 * @param {number} progress - Giá trị tiến trình (0-100)
 * @param {string} message - Thông báo trạng thái
 */
function updateProgress(progressBarId, statusMessageId, progress, message) {
    try {
        // Giới hạn tiến trình trong khoảng 0-100
        progress = Math.max(0, Math.min(100, progress));
        
        // Cập nhật thanh tiến trình
        const progressBar = document.getElementById(progressBarId);
        if (progressBar) {
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        // Cập nhật thông báo trạng thái
        const statusMessage = document.getElementById(statusMessageId);
        if (statusMessage) {
            statusMessage.textContent = message || 'Đang xử lý...';
        }
        
        // Hiển thị nút tải xuống khi hoàn thành
        if (progress >= 100) {
            // Tạo thẻ container cho nút tải xuống nếu chưa tồn tại
            let downloadButtonContainer = document.getElementById('download-model-container');
            if (!downloadButtonContainer) {
                downloadButtonContainer = document.createElement('div');
                downloadButtonContainer.id = 'download-model-container';
                downloadButtonContainer.className = 'text-center mt-3';
                
                // Tìm loading overlay hiện tại để thêm nút vào
                const currentOverlay = document.getElementById(currentOverlayId);
                if (currentOverlay) {
                    currentOverlay.appendChild(downloadButtonContainer);
                }
            } else {
                // Xóa nội dung cũ nếu đã tồn tại
                downloadButtonContainer.innerHTML = '';
            }
            
            // Tạo nút tải xuống mô hình
            const downloadButton = document.createElement('button');
            downloadButton.className = 'btn btn-success';
            downloadButton.innerHTML = '<i class="fas fa-download"></i> Tải xuống mô hình đã huấn luyện';
            downloadButton.onclick = function() {
                downloadTrainedModel();
            };
            
            // Thêm nút vào container
            downloadButtonContainer.appendChild(downloadButton);
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật tiến trình:', error);
    }
}

// Hàm tải mô hình đã đào tạo
function downloadTrainedModel() {
    // Kiểm tra xem có thông tin model không
    if (!currentModelInfo || !currentModelInfo.model_id) {
        showToast('Không có thông tin mô hình để tải xuống', 'danger');
        return;
    }
    
    const modelId = currentModelInfo.model_id;
    const downloadUrl = `/api/download_model?model_id=${encodeURIComponent(modelId)}`;
    
    // Hiển thị thông báo đang tải
    showToast('Đang chuẩn bị tải xuống mô hình...', 'info');
    
    // Tạo phần tử a để tải xuống
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = `${currentModelInfo.model_name || 'trained_model'}.zip`;
    
    // Thêm phần tử vào trang và kích hoạt sự kiện click
    document.body.appendChild(a);
    a.click();
    
    // Dọn dẹp
    setTimeout(() => {
        document.body.removeChild(a);
    }, 100);
    
    showToast('Đang tải mô hình xuống...', 'success');
}

// Biến lưu trữ ID cho tiến trình hiện tại 
let currentProgressBarId = null;
let currentStatusMessageId = null;
let currentOverlayId = null;
let currentPollingInterval = null;

/**
 * Bắt đầu polling để cập nhật tiến trình
 */
function startProgressPolling() {
    // Dọn dẹp interval cũ nếu có
    if (currentPollingInterval) {
        clearInterval(currentPollingInterval);
        currentPollingInterval = null;
    }
    
    // Biến đếm số lần lỗi liên tiếp
    let errorCount = 0;
    
    // Thời gian bắt đầu polling
    const startTime = Date.now();
    
    // Thời gian tối đa cho phép polling (10 phút)
    const maxPollingTime = 10 * 60 * 1000;
    
    currentPollingInterval = setInterval(function() {
        // Kiểm tra thời gian chạy
        if (Date.now() - startTime > maxPollingTime) {
            clearInterval(currentPollingInterval);
            currentPollingInterval = null;
            hideLoading();
            showToast('Quá trình xử lý kéo dài quá lâu, đã ngắt kết nối giám sát tiến trình', 'warning');
            return;
        }
        
        // Gọi API lấy trạng thái
        fetch('/api/progress_status')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function(data) {
                // Reset đếm lỗi
                errorCount = 0;
                
                // Cập nhật tiến trình
                updateProgress(
                    currentProgressBarId, 
                    currentStatusMessageId, 
                    data.progress, 
                    data.message
                );
                
                // Nếu hoàn thành
                if (data.status === 'completed' && data.progress >= 100) {
                    setTimeout(function() {
                        clearInterval(currentPollingInterval);
                        currentPollingInterval = null;
                        hideLoading();
                    }, 2000);
                }
                
                // Nếu có lỗi
                if (data.status === 'error') {
                    showToast(data.message, 'danger');
                    clearInterval(currentPollingInterval);
                    currentPollingInterval = null;
                    hideLoading();
                }
            })
            .catch(function(error) {
                errorCount++;
                console.error('Lỗi khi gọi API tiến trình:', error);
                
                // Nếu lỗi 5 lần liên tiếp, dừng polling
                if (errorCount >= 5) {
                    clearInterval(currentPollingInterval);
                    currentPollingInterval = null;
                    hideLoading();
                    showToast('Không thể kết nối với máy chủ', 'danger');
                }
            });
    }, 1000);
    
    return currentPollingInterval;
}

/**
 * Huấn luyện mô hình
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
    
    // Lấy phương pháp vector hóa đã chọn
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
    
    // Lấy phương pháp phân loại đã chọn
    let classificationMethod = '';
    document.querySelectorAll('.classification-option').forEach(option => {
        if (option.checked) {
            classificationMethod = option.value;
        }
    });
    
    if (!classificationMethod) {
        showToast('Vui lòng chọn phương pháp phân loại', 'warning');
        return;
    }
    
    let modelCategory = '';
    document.querySelectorAll('.model-category-option').forEach(option => {
        if (option.checked) {
            modelCategory = option.value;
        }
    });
    
    if (modelCategory === 'custom') {
        const customCategory = document.getElementById('custom-category-input').value.trim();
        if (!customCategory) {
            showToast('Vui lòng nhập tên thể loại tùy chỉnh', 'warning');
            return;
        }
        modelCategory = customCategory;
    }
    
    const formData = new FormData();
    formData.append('dataset', datasetFile);
    formData.append('text_column', textColumn);
    formData.append('label_column', labelColumn);
    formData.append('vectorization_method', vectorizationMethod);
    formData.append('classification_method', classificationMethod);
    formData.append('max_features', document.getElementById('max-features').value);
    formData.append('train_test_split', (100 - document.getElementById('train-test-split').value) / 100);
    formData.append('random_state', document.getElementById('random-state').value);
    formData.append('model_category', modelCategory);
    
    const modelName = document.getElementById('model-name').value;
    if (modelName) {
        formData.append('model_name', modelName);
    }
    
    // Thêm các tham số tùy chỉnh cho từng loại mô hình phân loại
    if (classificationMethod === 'knn') {
        const knnNeighbors = document.getElementById('knn-neighbors').value;
        formData.append('knn_neighbors', knnNeighbors);
    }
    
    if (classificationMethod === 'neural_network') {
        const hiddenLayers = document.getElementById('nn-hidden-layers').value;
        const neuronsPerLayer = document.getElementById('nn-neurons-per-layer').value;
        formData.append('nn_hidden_layers', hiddenLayers);
        formData.append('nn_neurons_per_layer', neuronsPerLayer);
    }
    
    if (classificationMethod === 'gradient_boosting') {
        const nEstimators = document.getElementById('gb-n-estimators').value;
        const learningRate = document.getElementById('gb-learning-rate').value;
        formData.append('gb_n_estimators', nEstimators);
        formData.append('gb_learning_rate', learningRate);
    }
    
    if (classificationMethod === 'svm') {
        const svmKernel = document.getElementById('svm-kernel').value;
        const svmC = document.getElementById('svm-c').value;
        formData.append('svm_kernel', svmKernel);
        formData.append('svm_c', svmC);
    }
    
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
        // Hiển thị loading với thanh tiến trình
        const loadingIds = showLoading('Đang huấn luyện mô hình...', true);
        currentProgressBarId = loadingIds.progressBarId;
        currentStatusMessageId = loadingIds.statusMessageId;
        currentOverlayId = loadingIds.overlayId;
        
        // Bắt đầu polling để cập nhật tiến trình
        startProgressPolling();
        
        console.log('Đang gửi yêu cầu huấn luyện mô hình đến server...');
        const response = await fetch('/api/train_model', {
            method: 'POST',
            body: formData
        });
        
        // Kiểm tra nếu response không OK (HTTP error)
        if (!response.ok) {
            console.error('Lỗi từ server:', response.status, response.statusText);
            // Hiển thị thông báo lỗi 
            showToast(`Lỗi từ server: ${response.status} ${response.statusText}`, 'danger');
            hideLoading();
            return;
        }
        
        const result = await response.json();
        
        // Xóa các overlay cũ
        const allOverlays = document.querySelectorAll('[id^="loading-overlay"]');
        allOverlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        if (result.status === 'error') {
            console.error('Lỗi huấn luyện mô hình:', result.message);
            showToast(result.message || 'Lỗi khi đào tạo mô hình', 'danger');
            return;
        }
        
        setTimeout(() => {
            const emptyStateCard = document.getElementById('empty-state-card');
            if (emptyStateCard) {
                emptyStateCard.style.display = 'none';
            }
            
            const trainingResults = document.getElementById('training-results');
            if (trainingResults) {
                trainingResults.style.display = 'block';
            }
            
            modelResults.push({
                ...result,
                timestamp: new Date().toLocaleString(),
                model_number: modelResults.length + 1
            });
            
            currentModelIndex = modelResults.length - 1;
            updateResultsDisplay();
            
            // Hiển thị phần testing
            const modelTesting = document.getElementById('model-testing');
            if (modelTesting) {
                modelTesting.style.display = 'block';
            }
            
            document.getElementById('results-wrapper').scrollIntoView({ behavior: 'smooth' });
            showToast('Đã đào tạo mô hình thành công!', 'success');
        }, 100);
        
    } catch (error) {
        console.error('Lỗi khi đào tạo mô hình:', error);
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
    
    const processingTime = result.processing_time ? 
        `<div class="badge bg-primary bg-opacity-75 p-2 mb-3">⏱️ Thời gian xử lý: ${result.processing_time} giây</div>` : '';
    
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
    
    const html = modelInfoHTML + metricsHTML;
    
    setTimeout(() => {
        const labelCounts = {};
        training.labels.forEach(label => {
            labelCounts[label] = 0;
        });
        
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
    
    const shortenedLabels = labels.map(label => formatDisplayValue(label, 8));
    
    let html = '<div class="table-responsive"><table class="table table-sm table-bordered confusion-matrix m-0">';
    
    html += '<thead class="table-light"><tr><th style="background-color: #f8f9fa;"></th>';
    for (let i = 0; i < labels.length; i++) {
        html += `<th class="text-center" title="${labels[i]}">${shortenedLabels[i]}</th>`;
    }
    html += '</tr></thead>';
    
    html += '<tbody>';
    for (let i = 0; i < confusionMatrix.length; i++) {
        html += `<tr><td class="fw-bold bg-light" title="${labels[i]}">${shortenedLabels[i]}</td>`;
        for (let j = 0; j < confusionMatrix[i].length; j++) {
            const value = confusionMatrix[i][j];
            let cellClass = 'text-center';
            let textClass = '';
            let bgColor = '#ffffff';
            
            if (i === j && value > 0) {
                textClass = 'fw-bold';
                const intensity = Math.min(Math.max(value / 10, 0.1), 0.6);
                bgColor = `rgba(13, 110, 253, ${intensity})`;
            } else if (value > 0) {
                textClass = '';
                const intensity = Math.min(Math.max(value / 10, 0.1), 0.6);
                bgColor = `rgba(220, 53, 69, ${intensity})`;
            } else {
                bgColor = '#f8f9fa';
            }
            
            html += `<td class="${cellClass}" style="background-color: ${bgColor}"><span class="${textClass}">${value}</span></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    
    return html;
}

/**
 * Hàm dùng để tải xuống mô hình đã huấn luyện
 */
function downloadModel(modelId) {
    window.location.href = `/api/download_model?model_id=${modelId}`;
}

/**
 * Hàm lấy tên thân thiện của loại mô hình
 */
function getModelTypeName(modelType) {
    const modelNames = {
        'naive_bayes': 'Naive Bayes',
        'logistic_regression': 'Logistic Regression',
        'svm': 'Support Vector Machine',
        'knn': 'K-Nearest Neighbors',
        'decision_tree': 'Decision Tree',
        'neural_network': 'Neural Network',
        'gradient_boosting': 'Gradient Boosting'
    };
    
    return modelNames[modelType] || modelType;
}

/**
 * Hàm lấy tên thân thiện của phương pháp vector hóa
 */
function getVectorizationName(vectorizationType) {
    const vectorizationNames = {
        'bow': 'Bag of Words',
        'tfidf': 'TF-IDF',
        'onehot': 'One-Hot Encoding',
        'ngrams': 'N-Grams'
    };
    
    return vectorizationNames[vectorizationType] || vectorizationType;
}