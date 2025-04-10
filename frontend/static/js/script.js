document.addEventListener('DOMContentLoaded', function() {
    // Test API sample text
    console.log('Testing sample text API...');
    fetch('/api/sample_text?category=tích_cực')
        .then(response => {
            console.log('Test API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Test API data received:', data);
        })
        .catch(error => {
            console.error('Test API error:', error);
        });
    
    // Các phần tử DOM cần tương tác
    const inputText = document.getElementById('input-text');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const categorySelect = document.getElementById('category-select');

    // Kiểm tra phần tử DOM đã được tìm thấy
    console.log('inputText element:', inputText);
    console.log('sampleBtn element:', sampleBtn);
    console.log('categorySelect element:', categorySelect);

    const processBtn = document.getElementById('process-btn');
    const resultsContainer = document.getElementById('results-container');
    const downloadResultsBtn = document.getElementById('download-results-btn');
    const clearResultsBtn = document.getElementById('clear-results-btn');
    
    // Phần tử cho phần augmentation
    const dataNoiseCheckbox = document.getElementById('data-noise');
    const noiseOptions = document.getElementById('noise-options');
    const noisePercent = document.getElementById('noise-percent');
    const noisePercentValue = document.getElementById('noise-percent-value');
    
    // Các tab xử lý
    const processingTabs = document.querySelectorAll('#processingTabs .nav-link');
    
    // Radio button logic for vectorization methods
    const oneHotCheckbox = document.getElementById('one-hot');
    const bowCheckbox = document.getElementById('bow');
    const tfidfCheckbox = document.getElementById('tfidf');
    const ngramsCheckbox = document.getElementById('ngrams');

    // Đảm bảo chỉ chọn một phương pháp vector hóa một lúc
    if (oneHotCheckbox && bowCheckbox) {
        oneHotCheckbox.addEventListener('change', function() {
            if (this.checked) {
                bowCheckbox.checked = false;
                if (tfidfCheckbox) tfidfCheckbox.checked = false;
                if (ngramsCheckbox) ngramsCheckbox.checked = false;
                updateSelectedCount();
            }
        });

        bowCheckbox.addEventListener('change', function() {
            if (this.checked) {
                oneHotCheckbox.checked = false;
                if (tfidfCheckbox) tfidfCheckbox.checked = false;
                if (ngramsCheckbox) ngramsCheckbox.checked = false;
                updateSelectedCount();
            }
        });

        if (tfidfCheckbox) {
            tfidfCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    oneHotCheckbox.checked = false;
                    bowCheckbox.checked = false;
                    if (ngramsCheckbox) ngramsCheckbox.checked = false;
                    updateSelectedCount();
                }
            });
        }
        
        if (ngramsCheckbox) {
            ngramsCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    oneHotCheckbox.checked = false;
                    bowCheckbox.checked = false;
                    if (tfidfCheckbox) tfidfCheckbox.checked = false;
                    updateSelectedCount();
                }
            });
        }
    }
    
    // Hiển thị/ẩn tùy chọn nhiễu dữ liệu
    dataNoiseCheckbox?.addEventListener('change', function() {
        noiseOptions.style.display = this.checked ? 'block' : 'none';
        updateSelectedCount();
    });
    
    // Hiển thị/ẩn tùy chọn ký tự đặc biệt tùy chỉnh
    const removeSpecialCharsCheckbox = document.getElementById('remove-special-chars');
    const customSpecialCharsContainer = document.querySelector('.custom-special-chars');
    
    removeSpecialCharsCheckbox?.addEventListener('change', function() {
        customSpecialCharsContainer.style.display = this.checked ? 'block' : 'none';
        updateSelectedCount();
    });
    
    // Hiển thị/ẩn tùy chọn N-Grams
    ngramsCheckbox?.addEventListener('change', function() {
        const ngramsOptions = document.querySelector('.ngrams-options');
        if (ngramsOptions) {
            ngramsOptions.style.display = this.checked ? 'block' : 'none';
        }
        updateSelectedCount();
    });
    
    // Cập nhật giá trị hiển thị cho thanh trượt tỷ lệ nhiễu
    noisePercent?.addEventListener('input', function() {
        noisePercentValue.textContent = this.value;
    });
    
    // Nút xóa văn bản đầu vào
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
    });
    
    // Nút lấy văn bản mẫu
    sampleBtn.addEventListener('click', function() {
        const category = categorySelect.value || 'tích_cực';
        
        console.log('Đang lấy văn bản mẫu cho danh mục:', category);
        
        fetch(`/api/sample_text?category=${category}`)
            .then(response => {
                console.log('Phản hồi từ server:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Dữ liệu nhận được:', data);
                if (data.success) {
                    inputText.value = data.text;
                    console.log('Đã cập nhật text area với văn bản mẫu');
                } else {
                    console.error('Lỗi:', data.error);
                }
            })
            .catch(error => {
                console.error('Lỗi khi lấy văn bản mẫu:', error);
            });
    });
    
    // Cập nhật số lượng tùy chọn đã chọn trong mỗi tab
    function updateSelectedCount() {
        const tabGroups = {
            'augmentation': document.querySelectorAll('#augmentation-content input[type="checkbox"]:checked'),
            'cleaning': document.querySelectorAll('#cleaning-content input[type="checkbox"]:checked'),
            'vectorization': document.querySelectorAll('#vectorization-content input[type="checkbox"]:checked'),
            'analysis': document.querySelectorAll('#analysis-content input[type="checkbox"]:checked')
        };
        
        for (const [group, elements] of Object.entries(tabGroups)) {
            const badge = document.getElementById(`${group}-badge`);
            if (badge) {
                badge.textContent = elements.length;
            }
        }
        
        // Cập nhật tổng số tùy chọn đã chọn
        const totalSelected = document.querySelectorAll('.tab-pane input[type="checkbox"]:checked').length;
        document.querySelector('.selected-count').textContent = totalSelected;
    }
    
    // Thêm các sự kiện cho các checkbox tùy chọn
    document.querySelectorAll('.tab-pane input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedCount);
    });
    
    // Nút chọn tất cả trong mỗi tab
    document.querySelectorAll('.select-all-btn').forEach(button => {
        button.addEventListener('click', function() {
            const group = this.dataset.group;
            document.querySelectorAll(`#${group}-content input[type="checkbox"]`).forEach(checkbox => {
                checkbox.checked = true;
            });
            updateSelectedCount();
        });
    });
    
    // Nút bỏ chọn tất cả trong mỗi tab
    document.querySelectorAll('.clear-all-btn').forEach(button => {
        button.addEventListener('click', function() {
            const group = this.dataset.group;
            document.querySelectorAll(`#${group}-content input[type="checkbox"]`).forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedCount();
        });
    });
    
    // Thêm hàm hiển thị loading khi đang xử lý
    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="text-muted mt-3">Đang xử lý văn bản...</p>
            </div>
        `;
    }
    
    // Thêm hàm ẩn hiệu ứng loading
    function hideLoading() {
        // Không làm gì vì sẽ được thay thế bởi displayResults hoặc thông báo lỗi
    }
    
    // Xử lý sự kiện khi nút "Xử lý" được nhấn
    processBtn.addEventListener('click', async function() {
        // Hiển thị hiệu ứng loading
        showLoading();
        
        // Lấy văn bản đầu vào
        const inputText = document.getElementById('input-text').value.trim();
        
        // Kiểm tra có văn bản không
        if (!inputText) {
            // Ẩn hiệu ứng loading
            hideLoading();
            
            // Hiển thị thông báo lỗi
            resultsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Vui lòng nhập văn bản để xử lý
                </div>
            `;
            return;
        }
        
        // Thu thập các tùy chọn xử lý
        const processingOptions = {
            cleaning: {},
            augmentation: {},
            vectorization: {},
            classification: {}
        };
        
        // Kiểm tra các tùy chọn phân loại
        const useLatestModel = document.getElementById('use-latest-model')?.checked || false;
        const cleanBeforeClassify = document.getElementById('clean-before-classify')?.checked || false;
        const showProbabilities = document.getElementById('show-probabilities')?.checked || false;
        
        // Nếu tùy chọn phân loại được chọn
        if (useLatestModel) {
            processingOptions.classification = {
                useLatestModel: true,
                cleanText: cleanBeforeClassify,
                showProbabilities: showProbabilities
            };
        }
        
        // Tùy chọn làm sạch
        document.querySelectorAll('#cleaning-content input[type="checkbox"]:checked').forEach(checkbox => {
            if (checkbox.id === 'remove-special-chars') {
                const customChars = document.getElementById('custom-special-chars')?.value.trim();
                processingOptions.cleaning[checkbox.id] = true;
                if (customChars) {
                    processingOptions.cleaning['custom-special-chars'] = customChars;
                }
            } else {
                processingOptions.cleaning[checkbox.id] = true;
            }
        });
        
        // Tùy chọn tăng cường
        document.querySelectorAll('#augmentation-content input[type="checkbox"]:checked').forEach(checkbox => {
            processingOptions.augmentation[checkbox.id] = true;
        });
        
        // Tùy chọn vector hóa
        document.querySelectorAll('#vectorization-content input[type="checkbox"]:checked').forEach(checkbox => {
            processingOptions.vectorization[checkbox.id] = true;
        });
        
        // Kiểm tra xem có tùy chọn phân loại văn bản được chọn không
        const hasClassificationOptions = useLatestModel;
        
        // Nếu tùy chọn phân loại được chọn, gọi API phân loại
        if (hasClassificationOptions) {
            // Hiển thị hiệu ứng loading
            showLoading();
            
            try {
                // Gọi hàm phân loại văn bản với mô hình mới nhất
                const result = await classifyTextWithLatestModel(inputText, cleanBeforeClassify);
                
                // Ẩn hiệu ứng loading
                hideLoading();
                
                if (result.status === 'success') {
                    // Hiển thị kết quả phân loại
                    const resultHTML = renderClassificationResults(result, showProbabilities);
                    resultsContainer.innerHTML = resultHTML;
                    
                    // Kích hoạt các nút tải xuống và xóa kết quả
                    downloadResultsBtn.disabled = false;
                    clearResultsBtn.disabled = false;
                } else {
                    // Hiển thị thông báo lỗi
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            ${result.message || 'Đã xảy ra lỗi khi phân loại văn bản'}
                        </div>
                    `;
                }
            } catch (error) {
                // Ẩn hiệu ứng loading
                hideLoading();
                
                console.error('Lỗi khi phân loại văn bản:', error);
                
                // Hiển thị thông báo lỗi
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Lỗi khi phân loại văn bản: ${error.message}
                    </div>
                `;
            }
            
            return;
        }
        
        // Kiểm tra xem có tùy chọn vector hóa được chọn không
        const hasVectorizationOptions = Object.values(processingOptions.vectorization).some(value => value === true);
        
        // Nếu chỉ có tùy chọn vector hóa, gọi API endpoint mới
        if (hasVectorizationOptions && 
            !Object.values(processingOptions.cleaning).some(value => value === true) && 
            !Object.values(processingOptions.augmentation).some(value => value === true)) {
            
            // Xác định loại vector hóa
            let vectorType = 'onehot'; // Mặc định
            if (processingOptions.vectorization['one-hot']) {
                vectorType = 'onehot';
            } else if (processingOptions.vectorization['bow']) {
                vectorType = 'bow';
            } else if (processingOptions.vectorization['tfidf']) {
                vectorType = 'tfidf';
            } else if (processingOptions.vectorization['ngrams']) {
                vectorType = 'ngrams';
            }
            
            // Lấy giá trị ngram min và max nếu vector hóa là ngrams
            let ngram_min = 2;
            let ngram_max = 3;
            if (vectorType === 'ngrams') {
                ngram_min = document.getElementById('ngram-min')?.value || 2;
                ngram_max = document.getElementById('ngram-max')?.value || 3;
            }
            
            // Gọi API vector hóa
            vectorizeText(inputText, vectorType, ngram_min, ngram_max)
                .then(data => {
                    // Xử lý kết quả và hiển thị
                    const resultHTML = createVectorizationResultHTML(data, vectorType);
                    resultsContainer.innerHTML = resultHTML;
                    
                    // Kích hoạt các nút tải xuống và xóa kết quả
                    downloadResultsBtn.disabled = false;
                    clearResultsBtn.disabled = false;
                    
                    // Thêm tương tác cho các kết quả
                    addResultItemInteractions();
                })
                .catch(error => {
                    // Hiển thị thông báo lỗi
                    resultsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Lỗi khi vector hóa văn bản: ${error.message}
                        </div>
                    `;
                });
            
            return;
        }
        
        // Các tùy chọn khác (nếu có), sử dụng API cũ
        const requestData = {
            text: inputText,
            options: processingOptions,
            num_samples: document.getElementById('num-samples')?.value || 3
        };
        
        // Ghi log dữ liệu gửi đi để debug
        console.log('Sending data:', JSON.stringify(requestData));
        
        // Gọi API xử lý văn bản
        fetch('/process_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Hiển thị kết quả
                displayResults(data);
                
                // Lưu vào lịch sử
                addToHistory(data);
                
                // Cập nhật UI lịch sử
                updateHistoryUI();
            } else {
                // Hiển thị thông báo lỗi
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        ${data.error || 'Đã xảy ra lỗi khi xử lý văn bản'}
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Hiển thị thông báo lỗi
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Lỗi khi xử lý văn bản: ${error.message}
                </div>
            `;
        });
    });
    
    // Thêm hiệu ứng khi hover vào các kết quả
    function addResultItemInteractions() {
        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.borderLeftWidth = '6px';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.borderLeftWidth = '4px';
            });
        });
    }
    
    // Hiển thị kết quả xử lý
    function displayResults(data) {
        console.log("Hiển thị kết quả:", data);
        
        // Reset kết quả
        resultsContainer.innerHTML = '';
        
        // Kiểm tra lỗi
        if (!data || data.error) {
            const errorMessage = data && data.error ? data.error : 'Lỗi không xác định khi xử lý văn bản';
            resultsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i> ${errorMessage}
                </div>
            `;
            return;
        }
        
        // Thông tin xử lý
        let processingInfo = '';
        if (data.processing_time) {
            processingInfo += `<span class="badge bg-info me-2"><i class="fas fa-clock me-1"></i> ${data.processing_time}s</span>`;
        }
        if (data.steps && data.steps.length) {
            processingInfo += data.steps.map(step => 
                `<span class="badge bg-secondary me-2"><i class="fas fa-check-circle me-1"></i> ${step}</span>`
            ).join('');
        }
        
        // Lấy văn bản gốc từ input hoặc từ dữ liệu trả về
        const originalText = data.original_text || document.getElementById('input-text').value.trim();
        
        // Hiển thị văn bản gốc
        const originalTextCard = document.createElement('div');
        originalTextCard.className = 'card mb-3';
        originalTextCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5><i class="fas fa-file-alt me-2"></i> Văn bản gốc</h5>
                <button class="btn btn-sm btn-outline-primary continue-process-btn" data-text="${encodeURIComponent(originalText)}">
                    <i class="fas fa-redo-alt me-1"></i> Tiếp tục xử lý
                </button>
            </div>
            <div class="card-body">
                <div id="original-text-display" class="result-text">${originalText}</div>
            </div>
        `;
        resultsContainer.appendChild(originalTextCard);
        
        // Xác định văn bản đã xử lý
        let processedText = '';
        if (data.result && data.result.processed_text) {
            processedText = data.result.processed_text;
        } else if (data.processed_text) {
            processedText = data.processed_text;
        } else if (data.result && data.result.text_processing && data.result.text_processing.final_text) {
            processedText = data.result.text_processing.final_text;
        } else if (data.result && data.result.cleaned_text) {
            processedText = data.result.cleaned_text;
        }
        
        // Hiển thị văn bản đã xử lý nếu có
        if (processedText && processedText !== originalText) {
            const processedTextCard = document.createElement('div');
            processedTextCard.className = 'card mb-3';
            processedTextCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5><i class="fas fa-magic me-2"></i> Văn bản đã xử lý</h5>
                    <div>
                        <button id="compare-texts-btn" class="btn btn-sm btn-outline-primary me-2">
                            <i class="fas fa-exchange-alt me-1"></i> So sánh thay đổi
                        </button>
                        <button class="btn btn-sm btn-outline-success continue-process-btn" data-text="${encodeURIComponent(processedText)}">
                            <i class="fas fa-redo-alt me-1"></i> Tiếp tục xử lý
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="processed-text" class="result-text">${processedText}</div>
                </div>
            `;
            resultsContainer.appendChild(processedTextCard);
            
            // Thêm sự kiện cho nút so sánh
            document.getElementById('compare-texts-btn').addEventListener('click', function() {
                compareTexts(originalText, processedText);
            });
        }
        
        // Hiển thị văn bản đã tăng cường nếu có
        if (data.augmented_texts && data.augmented_texts.length > 0) {
            const augmentedTextsCard = document.createElement('div');
            augmentedTextsCard.className = 'card mb-3';
            
            let augmentedTextsHtml = `
                <div class="card-header">
                    <h5><i class="fas fa-random me-2"></i> Văn bản đã tăng cường</h5>
                </div>
                <div class="card-body">
                    <div class="accordion" id="augmentedTextsAccordion">
            `;
            
            data.augmented_texts.forEach((text, index) => {
                augmentedTextsHtml += `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading${index}">
                            <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="collapse${index}">
                                Mẫu tăng cường #${index + 1}
                            </button>
                        </h2>
                        <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading${index}" data-bs-parent="#augmentedTextsAccordion">
                            <div class="accordion-body">
                                <div class="result-text">${text}</div>
                                <div class="mt-2 d-flex justify-content-between">
                                    <button class="btn btn-sm btn-outline-primary compare-augmented-btn" data-index="${index}">
                                        <i class="fas fa-exchange-alt me-1"></i> So sánh với gốc
                                    </button>
                                    <button class="btn btn-sm btn-outline-success continue-process-btn" data-text="${encodeURIComponent(text)}">
                                        <i class="fas fa-redo-alt me-1"></i> Tiếp tục xử lý
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            augmentedTextsHtml += `
                    </div>
                </div>
            `;
            
            augmentedTextsCard.innerHTML = augmentedTextsHtml;
            resultsContainer.appendChild(augmentedTextsCard);
            
            // Thêm sự kiện cho các nút so sánh
            document.querySelectorAll('.compare-augmented-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    compareTexts(originalText, data.augmented_texts[index]);
                });
            });
        }
        
        // Hiển thị thông tin xử lý
        if (processingInfo) {
            const infoCard = document.createElement('div');
            infoCard.className = 'card mb-3';
            infoCard.innerHTML = `
                <div class="card-header">
                    <h5><i class="fas fa-info-circle me-2"></i> Thông tin xử lý</h5>
                </div>
                <div class="card-body">
                    ${processingInfo}
                </div>
            `;
            resultsContainer.appendChild(infoCard);
        }
        
        // Xử lý kết quả vector hóa nếu có
        if (data.result && data.result.vectorization) {
            const vectorizationHTML = createVectorizationHTML(data.result.vectorization);
            if (vectorizationHTML) {
                const vectorCard = document.createElement('div');
                vectorCard.className = 'card mb-3';
                vectorCard.innerHTML = `
                    <div class="card-header">
                        <h5><i class="fas fa-table me-2"></i> Vector hóa</h5>
                    </div>
                    <div class="card-body">${vectorizationHTML}</div>
                `;
                resultsContainer.appendChild(vectorCard);
            }
        }
        
        // Kiểm tra cấu trúc dữ liệu cũ (trước khi tái cấu trúc phản hồi API)
        if (data.method && data.vocab && data.vectors) {
            const vectorizationData = {
                method: data.method,
                vocabulary: data.vocab,
                vectors: data.vectors
            };
            
            const vectorizationHTML = createVectorizationHTML(vectorizationData);
            if (vectorizationHTML) {
                const vectorCard = document.createElement('div');
                vectorCard.className = 'card mb-3';
                vectorCard.innerHTML = `
                    <div class="card-header">
                        <h5><i class="fas fa-table me-2"></i> Vector hóa</h5>
                    </div>
                    <div class="card-body">${vectorizationHTML}</div>
                `;
                resultsContainer.appendChild(vectorCard);
            }
        }
        
        // Hiển thị kết quả xử lý khác nếu có
        if (data.result && !processedText) {
            const resultHTML = createProcessedResultHTML(data.result);
            if (resultHTML) {
                resultsContainer.innerHTML += resultHTML;
            }
        }
        
        // Hiển thị các kết quả cụ thể theo quy trình cũ
        if (data.processed_results && Array.isArray(data.processed_results)) {
            data.processed_results.forEach(result => {
                const resultHTML = createProcessedResultHTML(result);
                if (resultHTML) {
                    resultsContainer.innerHTML += resultHTML;
                }
            });
        }
        
        // Nếu không có kết quả nào được hiển thị
        if (resultsContainer.innerHTML === '') {
            resultsContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <i class="fas fa-info-circle me-2"></i> Không có kết quả xử lý nào để hiển thị
                </div>
            `;
        }
        
        // Bật các nút tải xuống và xóa
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-btn');
        
        if (downloadBtn) downloadBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        
        if (downloadResultsBtn) downloadResultsBtn.disabled = false;
        if (clearResultsBtn) clearResultsBtn.disabled = false;
        
        // Thêm tương tác cho các kết quả
        addResultItemInteractions();
        
        // Thêm sự kiện cho các nút tiếp tục xử lý
        setupContinueProcessing();
    }
    
    // Thiết lập sự kiện cho các nút tiếp tục xử lý
    function setupContinueProcessing() {
        document.querySelectorAll('.continue-process-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Lấy văn bản từ thuộc tính data-text
                const textToContinue = decodeURIComponent(this.getAttribute('data-text'));
                
                // Đặt văn bản vào ô nhập liệu
                const inputTextArea = document.getElementById('input-text');
                inputTextArea.value = textToContinue;
                
                // Cuộn lên đầu trang
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Highlight ô nhập liệu để thu hút sự chú ý
                inputTextArea.classList.add('highlight-input');
                setTimeout(() => {
                    inputTextArea.classList.remove('highlight-input');
                }, 1500);
                
                // Reset các tùy chọn (tuỳ chọn)
                // Bỏ ghi chú dòng dưới nếu muốn reset tất cả tùy chọn
                // resetAllOptions();
                
                // Hiển thị thông báo nhỏ
                showToast('Đã chọn văn bản để tiếp tục xử lý', 'success');
            });
        });
    }
    
    // Hiển thị thông báo nhỏ
    function showToast(message, type = 'info') {
        // Tạo element thông báo
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Thêm vào container
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            // Tạo container nếu chưa có
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
            container.appendChild(toastEl);
        } else {
            toastContainer.appendChild(toastEl);
        }
        
        // Hiển thị toast
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
        
        // Xóa toast khỏi DOM sau khi biến mất
        toastEl.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
    
    // Hàm so sánh hai văn bản và làm nổi bật các thay đổi
    function compareTexts(originalText, processedText) {
        console.log("So sánh văn bản...");
        
        // Kiểm tra dữ liệu đầu vào
        if (!originalText || !processedText) {
            console.error("Thiếu dữ liệu để so sánh");
            return;
        }
        
        // Tìm sự khác biệt giữa hai văn bản
        const differences = findTextDifferences(originalText, processedText);
        
        // Tạo và hiển thị container chứa kết quả so sánh
        const comparisonContainer = document.createElement('div');
        comparisonContainer.className = 'comparison-container mt-4';
        comparisonContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-exchange-alt me-2"></i> So sánh thay đổi</h5>
                </div>
                <div class="card-body">
                    <div class="text-compared">${differences}</div>
                    <div class="text-diff-legend mt-3">
                        <div class="legend-item">
                            <div class="legend-color legend-deleted"></div>
                            <span>Đã xóa</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color legend-added"></div>
                            <span>Đã thêm</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Xóa container cũ nếu đã tồn tại
        const existingComparison = document.querySelector('.comparison-container');
        if (existingComparison) {
            existingComparison.remove();
        }
        
        // Thêm kết quả so sánh vào container chứa kết quả
        document.getElementById('results-container').appendChild(comparisonContainer);
    }
    
    // Hàm tách văn bản thành các từ, giữ lại khoảng trắng và dấu câu
    function splitTextIntoWords(text) {
        if (!text) return [];
        
        const tokens = [];
        let currentWord = '';
        let currentWhitespace = '';
        
        // Duyệt qua từng ký tự
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (/\s/.test(char)) { // Khoảng trắng
                if (currentWord) {
                    tokens.push(currentWord);
                    currentWord = '';
                }
                currentWhitespace += char;
            } else { // Ký tự thường
                if (currentWhitespace) {
                    tokens.push(currentWhitespace);
                    currentWhitespace = '';
                }
                
                // Dấu câu
                if (/[.,;:!?()[\]{}'"<>\/\-+*=&^%$#@~`|]/.test(char)) {
                    if (currentWord) {
                        tokens.push(currentWord);
                        currentWord = '';
                    }
                    tokens.push(char);
                } else {
                    currentWord += char;
                }
            }
        }
        
        // Thêm từ cuối cùng nếu có
        if (currentWord) {
            tokens.push(currentWord);
        }
        if (currentWhitespace) {
            tokens.push(currentWhitespace);
        }
        
        return tokens;
    }
    
    // Hàm tìm sự khác nhau giữa hai văn bản
    function findTextDifferences(original, processed) {
        console.log("Tìm sự khác nhau giữa hai văn bản");
        
        // Tách văn bản thành các từ để so sánh
        const originalWords = splitTextIntoWords(original);
        const processedWords = splitTextIntoWords(processed);
        
        // Tìm sự thay đổi giữa hai danh sách từ
        const diffResult = findWordDifferences(originalWords, processedWords);
        
        return diffResult;
    }
    
    // Hàm tìm sự khác nhau giữa hai mảng từ
    function findWordDifferences(originalWords, processedWords) {
        console.log("Số từ trong văn bản gốc:", originalWords.length);
        console.log("Số từ trong văn bản đã xử lý:", processedWords.length);
        
        let result = '';
        let i = 0, j = 0;
        
        while (i < originalWords.length || j < processedWords.length) {
            if (i >= originalWords.length) {
                // Nếu đã duyệt hết văn bản gốc, thêm các từ còn lại từ văn bản đã xử lý
                while (j < processedWords.length) {
                    result += `<span class="text-added">${processedWords[j]}</span>`;
                    j++;
                }
                break;
            }
            
            if (j >= processedWords.length) {
                // Nếu đã duyệt hết văn bản đã xử lý, đánh dấu các từ còn lại từ văn bản gốc là đã xóa
                while (i < originalWords.length) {
                    result += `<span class="text-deleted">${originalWords[i]}</span>`;
                    i++;
                }
                break;
            }
            
            if (originalWords[i] === processedWords[j]) {
                // Từ giống nhau, giữ nguyên
                result += processedWords[j];
                i++;
                j++;
            } else {
                // Kiểm tra xem từ có bị xóa hay thêm mới
                const nextOriginalIndex = originalWords.indexOf(processedWords[j], i);
                const nextProcessedIndex = processedWords.indexOf(originalWords[i], j);
                
                if (nextProcessedIndex === -1 || (nextOriginalIndex !== -1 && nextOriginalIndex - i <= nextProcessedIndex - j)) {
                    // Từ trong văn bản gốc không có trong văn bản đã xử lý hoặc xuất hiện trước từ được thêm vào
                    result += `<span class="text-deleted">${originalWords[i]}</span>`;
                    i++;
                } else {
                    // Từ mới được thêm vào văn bản đã xử lý
                    result += `<span class="text-added">${processedWords[j]}</span>`;
                    j++;
                }
            }
        }
        
        return result;
    }
    
    // Hàm tạo HTML cho kết quả vector hóa
    function createVectorizationHTML(vectorization) {
        let html = '';
        
        try {
            // Kiểm tra dữ liệu
            if (!vectorization) {
                console.error("Invalid vectorization data:", vectorization);
                return `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Dữ liệu vector hóa không hợp lệ.
                    </div>
                `;
            }
            
            // Kiểm tra từ điển - hỗ trợ cả 'vocabulary' và 'vocab'
            const vocabulary = vectorization.vocabulary || vectorization.vocab || {};
            // Kiểm tra vectors
            const vectors = vectorization.vectors || [];
            
            if (Object.keys(vocabulary).length === 0 || vectors.length === 0) {
                console.error("Missing vocabulary or vectors:", vectorization);
                return `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Dữ liệu vector hóa không đầy đủ (thiếu từ điển hoặc vectors).
                    </div>
                `;
            }
            
            console.log("Processing vocabulary:", vocabulary);
            console.log("Processing vectors:", vectors);
            
            // Tạo HTML cho từ điển dưới dạng bảng
            let vocabHTML = '<h5><i class="fas fa-book me-2"></i> Từ điển</h5>';
            vocabHTML += '<div class="table-responsive mb-4">';
            vocabHTML += '<table class="table table-sm table-bordered table-hover vocab-table">';
            vocabHTML += '<thead class="table-light"><tr><th>Từ</th><th>Chỉ mục</th></tr></thead>';
            vocabHTML += '<tbody>';
            
            // Sắp xếp từ trong từ điển theo thứ tự chỉ mục tăng dần
            const vocabEntries = Object.entries(vocabulary).sort((a, b) => a[1] - b[1]);
            for (const [word, index] of vocabEntries) {
                vocabHTML += `<tr><td>${word}</td><td>${index}</td></tr>`;
            }
            
            vocabHTML += '</tbody></table></div>';
            
            // Thêm từ điển vào kết quả
            html += `
                <div class="result-item">
                    ${vocabHTML}
                </div>
            `;
            
            // Nhóm các vectors theo phương pháp
            const methodGroups = {};
            
            // Kiểm tra kiểu dữ liệu vectors
            if (Array.isArray(vectors) && vectors.length > 0) {
                // Nếu vectors là mảng các object có thuộc tính method
                if (typeof vectors[0] === 'object' && vectors[0].method) {
                    vectors.forEach(vector => {
                        if (!methodGroups[vector.method]) {
                            methodGroups[vector.method] = [];
                        }
                        methodGroups[vector.method].push(vector);
                    });
                } else {
                    // Nếu vectors là mảng đơn giản, tạo một nhóm duy nhất
                    const method = vectorization.method || 'unknown';
                    methodGroups[method] = [{
                        method: method,
                        sentence: 'Toàn bộ văn bản',
                        vector: vectors
                    }];
                }
            } else if (typeof vectors === 'object' && !Array.isArray(vectors)) {
                // Trường hợp vectors là object, không phải mảng
                const method = vectorization.method || 'unknown';
                methodGroups[method] = [{
                    method: method,
                    sentence: 'Toàn bộ văn bản',
                    vector: vectors
                }];
            }
            
            // Tạo HTML cho các vectors nhóm theo phương pháp
            for (const [method, vectorGroup] of Object.entries(methodGroups)) {
                let iconClass = 'fas fa-vector-square';
                let methodTitle = 'Vector hóa';
                
                // Chọn biểu tượng và tiêu đề phù hợp với phương pháp
                switch (method.toLowerCase()) {
                    case 'onehot':
                        iconClass = 'fas fa-table';
                        methodTitle = 'One-Hot Encoding';
                        break;
                    case 'bow':
                        iconClass = 'fas fa-shopping-bag';
                        methodTitle = 'Bag of Words';
                        break;
                    case 'tfidf':
                        iconClass = 'fas fa-table';
                        methodTitle = 'TF-IDF';
                        break;
                }
                
                html += `
                    <div class="result-item">
                        <h5><i class="${iconClass} me-2"></i> ${methodTitle}</h5>
                        <div class="table-responsive mb-3">
                            <table class="table table-sm table-bordered table-hover vector-table">
                                <thead class="table-light">
                                    <tr>
                                        <th>Câu</th>
                                        <th>Vector</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                // Thêm mỗi vector vào bảng
                vectorGroup.forEach(vector => {
                    let vectorDisplay = '';
                    let vectorData = vector.vector;
                    
                    // Định dạng vector tùy theo loại
                    if (method.toLowerCase() === 'onehot') {
                        // Vector onehot thường là mảng
                        if (Array.isArray(vectorData)) {
                            vectorDisplay = formatArrayAsTable(vectorData);
                        } else {
                            vectorDisplay = formatObjectAsTable(vectorData);
                        }
                    } else {
                        // Vector bow và tfidf thường là object
                        if (typeof vectorData === 'object' && !Array.isArray(vectorData)) {
                            vectorDisplay = formatObjectAsTable(vectorData);
                        } else if (Array.isArray(vectorData)) {
                            vectorDisplay = formatArrayAsTable(vectorData);
                        } else {
                            vectorDisplay = JSON.stringify(vectorData);
                        }
                    }
                    
                    html += `
                        <tr>
                            <td>${vector.sentence || 'Câu không xác định'}</td>
                            <td>${vectorDisplay}</td>
                        </tr>
                    `;
                });
                
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error creating vectorization HTML:", error);
            html = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Lỗi khi tạo kết quả vector hóa: ${error.message}
                </div>
            `;
        }
        
        return html;
    }
    
    // Hàm định dạng mảng thành bảng HTML nhỏ
    function formatArrayAsTable(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return '[]';
        
        // Nếu mảng quá dài, chỉ hiển thị một phần
        const maxDisplay = 20;
        const isLong = arr.length > maxDisplay;
        
        let html = '<div class="vector-array">';
        html += '<table class="table table-sm table-bordered mb-0">';
        html += '<tr>';
        
        for (let i = 0; i < (isLong ? maxDisplay : arr.length); i++) {
            const value = arr[i];
            const isZero = value == 0; // Sử dụng == để so sánh cả số và chuỗi
            html += `<td data-value="${value}" class="${isZero ? 'value-zero' : 'value-nonzero'}">${value}</td>`;
        }
        
        if (isLong) {
            html += `<td>... ${arr.length - maxDisplay} phần tử khác</td>`;
        }
        
        html += '</tr>';
        html += '</table>';
        html += '</div>';
        
        return html;
    }
    
    // Hàm định dạng object thành bảng HTML
    function formatObjectAsTable(obj) {
        if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
        
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        
        // Nếu object có quá nhiều thuộc tính, chỉ hiển thị một phần
        const maxDisplay = 20;
        const isLong = keys.length > maxDisplay;
        
        // Sắp xếp keys theo thứ tự số
        const sortedKeys = keys.sort((a, b) => {
            // Nếu a và b đều là số, sắp xếp theo số
            if (!isNaN(a) && !isNaN(b)) {
                return parseInt(a) - parseInt(b);
            }
            // Ngược lại sắp xếp theo chuỗi
            return a.localeCompare(b);
        });
        
        const displayKeys = isLong ? sortedKeys.slice(0, maxDisplay) : sortedKeys;
        
        let html = '<div class="vector-object">';
        html += '<table class="table table-sm table-bordered mb-0">';
        html += '<thead><tr>';
        
        // Header cho chỉ mục
        for (const key of displayKeys) {
            html += `<th>${key}</th>`;
        }
        
        if (isLong) {
            html += `<th>...</th>`;
        }
        
        html += '</tr></thead>';
        html += '<tbody><tr>';
        
        // Giá trị
        for (const key of displayKeys) {
            const value = obj[key];
            const isZero = value == 0; // Sử dụng == để so sánh cả số và chuỗi
            html += `<td data-value="${value}" class="${isZero ? 'value-zero' : 'value-nonzero'}">${value}</td>`;
        }
        
        if (isLong) {
            html += `<td>+ ${keys.length - maxDisplay} phần tử khác</td>`;
        }
        
        html += '</tr></tbody>';
        html += '</table>';
        html += '</div>';
        
        return html;
    }
    
    // Hàm tạo HTML cho kết quả xử lý
    function createProcessedResultHTML(result) {
        let iconClass = 'fas fa-cog';
        
        // Chọn biểu tượng phù hợp với loại xử lý
        switch (result.type) {
            // Tăng cường dữ liệu
            case 'add_random_words':
                iconClass = 'fas fa-plus-circle';
                break;
            case 'swap_random_words':
                iconClass = 'fas fa-exchange-alt';
                break;
            case 'delete_random_words':
                iconClass = 'fas fa-minus-circle';
                break;
            case 'use_synonyms':
                iconClass = 'fas fa-retweet';
                break;
            case 'back_translation':
                iconClass = 'fas fa-language';
                break;
            
            // Làm sạch dữ liệu
            case 'lowercase':
                iconClass = 'fas fa-font';
                break;
            case 'abbreviation_correction':
                iconClass = 'fas fa-spell-check';
                break;
            case 'remove_special_chars':
                iconClass = 'fas fa-filter';
                break;
            case 'remove_extra_spaces':
                iconClass = 'fas fa-compress';
                break;
            case 'sentence_tokenization':
                iconClass = 'fas fa-paragraph';
                break;
            case 'word_tokenization':
                iconClass = 'fas fa-text-width';
                break;
            case 'stopwords_removal':
                iconClass = 'fas fa-ban';
                break;
            case 'pos_tagging':
                iconClass = 'fas fa-tags';
                break;
            case 'syntax_parsing':
                iconClass = 'fas fa-project-diagram';
                break;
            
            // Vector hóa
            case 'vectorization_onehot':
                iconClass = 'fas fa-vector-square';
                break;
            case 'vectorization_bow':
                iconClass = 'fas fa-shopping-bag';
                break;
            case 'vectorization_tfidf':
                iconClass = 'fas fa-table';
                break;
        }
        
        // Định dạng đặc biệt cho kết quả tách từ/câu và vector hóa
        let resultText = result.text;
        if (result.type === 'word_tokenization') {
            resultText = formatTokenizedText(result.text);
        } else if (result.type === 'pos_tagging') {
            resultText = formatPOSTaggedText(result.text);
        } else if (result.type.startsWith('vectorization_')) {
            // Định dạng kết quả vector hóa với màu sắc và định dạng
            resultText = formatVectorizationResult(result.text);
        }
        
        return `
            <div class="result-item">
                <h5><i class="${iconClass}"></i> ${result.title}</h5>
                <div class="result-text ${result.type}">${resultText}</div>
            </div>
        `;
    }
    
    // Định dạng văn bản đã tách từ
    function formatTokenizedText(text) {
        const tokens = text.split(' | ');
        return tokens.map(token => `<span class="token">${token}</span>`).join(' ');
    }
    
    // Định dạng văn bản đã gán nhãn từ loại
    function formatPOSTaggedText(text) {
        return text.replace(/(\w+)\(([A-Z])\)/g, '<span class="pos-tag pos-$2" title="$2">$1</span>');
    }
    
    // Hàm để định dạng kết quả vector hóa
    function formatVectorizationResult(data, resultType) {
        let resultHTML = '';
        
        if (resultType === 'onehot') {
            resultHTML += createOneHotTable(data);
        } else if (resultType === 'bow') {
            resultHTML += createBagOfWordsTable(data);
        } else if (resultType === 'tfidf') {
            resultHTML += createTfIdfTable(data);
        } else if (resultType === 'ngrams') {
            resultHTML += createNgramsTable(data);
        }
        
        return resultHTML;
    }
    
    // Hàm để tạo HTML cho kết quả vector hóa
    function createVectorizationResultHTML(data, vectorType) {
        // Container HTML
        let resultHTML = `
            <div class="result-section">
                <div class="result-header mb-4">
                    <h4 class="result-title">
                        <i class="fas fa-vector-square me-2"></i> 
                        ${vectorType === 'bow_example' ? 'Ví dụ ma trận Bag of Words' : 'Kết quả vector hóa'}
                    </h4>
                    <div class="result-meta">
                        <span class="badge bg-info"><i class="fas fa-clock me-1"></i> ${data.processing_time}s</span>
                    </div>
                </div>`;
                
        if (vectorType !== 'bow_example') {
            resultHTML += `
                <div class="result-original mb-4">
                    <h5><i class="fas fa-file-alt me-2"></i> Văn bản gốc</h5>
                    <div class="result-text original-text">${data.original_text}</div>
                </div>`;
        }
        
        resultHTML += `
                <div class="result-items">
                    <div class="result-item">
                        <h5>
                            <i class="fas fa-table me-2"></i> 
                            ${vectorType === 'onehot' ? 'One-Hot Encoding' : 
                             vectorType === 'bow' ? 'Bag of Words' : 
                             vectorType === 'tfidf' ? 'TF-IDF' : 
                             'Bag of Words Example'}
                        </h5>
                        <div class="result-text">${formatVectorizationResult(data, vectorType)}</div>
                    </div>
                </div>
            </div>`;
        
        return resultHTML;
    }
    
    // Nút tải xuống kết quả
    downloadResultsBtn.addEventListener('click', function() {
        const resultTexts = [];
        
        // Lấy văn bản gốc
        const originalText = document.querySelector('.result-original .result-text');
        if (originalText) {
            resultTexts.push('=== VĂN BẢN GỐC ===\n' + originalText.textContent + '\n\n');
        }
        
        // Lấy các kết quả xử lý
        document.querySelectorAll('.result-item').forEach(item => {
            const title = item.querySelector('h5').textContent;
            const text = item.querySelector('.result-text').textContent;
            resultTexts.push(`=== ${title} ===\n${text}\n\n`);
        });
        
        // Tạo file để tải xuống
        const blob = new Blob([resultTexts.join('')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ket_qua_xu_ly.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Nút xóa kết quả
    clearResultsBtn.addEventListener('click', function() {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line empty-icon"></i>
                <p class="text-muted">Các kết quả xử lý sẽ hiển thị ở đây...</p>
                <small>Chọn các tùy chọn xử lý và nhấn nút "Xử lý" để bắt đầu</small>
            </div>
        `;
        
        downloadResultsBtn.disabled = true;
        clearResultsBtn.disabled = true;
    });
    
    // Khởi tạo ban đầu
    document.querySelectorAll('.tab-pane input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectedCount();
    
    // Kích hoạt tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Xử lý đóng mở nhóm tùy chọn
    document.querySelectorAll('.option-group-header').forEach(header => {
        header.addEventListener('click', function() {
            const icon = this.querySelector('.fas');
            if (icon.classList.contains('fa-chevron-down')) {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });
    });
    
    // Lưu trạng thái và khôi phục khi tải lại trang
    function saveOptionGroupStates() {
        const states = {};
        document.querySelectorAll('.option-group-content').forEach(content => {
            states[content.id] = content.classList.contains('show');
        });
        localStorage.setItem('optionGroupStates', JSON.stringify(states));
    }
    
    function restoreOptionGroupStates() {
        const states = JSON.parse(localStorage.getItem('optionGroupStates'));
        if (states) {
            Object.entries(states).forEach(([id, isOpen]) => {
                const content = document.getElementById(id);
                if (content) {
                    if (isOpen) {
                        content.classList.add('show');
                        const header = content.previousElementSibling;
                        if (header) {
                            const icon = header.querySelector('.fas');
                            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                        }
                    } else {
                        content.classList.remove('show');
                    }
                }
            });
        }
    }
    
    // Lưu trạng thái khi có sự thay đổi
    document.querySelectorAll('.option-group-header').forEach(header => {
        header.addEventListener('click', saveOptionGroupStates);
    });
    
    // Khôi phục trạng thái khi tải trang
    restoreOptionGroupStates();
    
    // Xử lý chuyển đổi chế độ xem
    document.querySelectorAll('.view-mode-toggle .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const viewMode = this.dataset.view;
            const optionsGrid = this.closest('.tab-pane').querySelector('.options-grid');
            
            // Cập nhật active button
            this.closest('.btn-group').querySelectorAll('.btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Cập nhật layout
            if (viewMode === 'list') {
                optionsGrid.style.gridTemplateColumns = '1fr';
            } else {
                optionsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            }
            
            // Lưu preference
            localStorage.setItem('optionsViewMode', viewMode);
        });
    });
    
    // Khôi phục chế độ xem đã lưu
    const savedViewMode = localStorage.getItem('optionsViewMode');
    if (savedViewMode) {
        document.querySelectorAll('.view-mode-toggle .btn').forEach(btn => {
            if (btn.dataset.view === savedViewMode) {
                btn.click();
            }
        });
    }
    
    // Mobile drawer handling
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileToggle = document.getElementById('mobile-options-toggle');
    const mobileDrawerClose = document.getElementById('close-mobile-drawer');
    const mobileProcessBtn = document.getElementById('mobile-process-btn');
    const mobileClearBtn = document.getElementById('mobile-clear-btn');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            mobileDrawer.classList.add('show');
            document.body.classList.add('drawer-open');
            
            // Clone current tab content to drawer
            const activeTab = document.querySelector('.tab-pane.active');
            if (activeTab) {
                const drawerContent = document.querySelector('.mobile-drawer-content');
                drawerContent.innerHTML = '';
                drawerContent.appendChild(activeTab.cloneNode(true));
                
                // Re-bind events for cloned content
                initOptionHandlers(drawerContent);
            }
        });
    }
    
    if (mobileDrawerClose) {
        mobileDrawerClose.addEventListener('click', function() {
            mobileDrawer.classList.remove('show');
            document.body.classList.remove('drawer-open');
        });
    }
    
    // Close drawer when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileDrawer.classList.contains('show') && 
            !mobileDrawer.contains(e.target) && 
            e.target !== mobileToggle) {
            mobileDrawer.classList.remove('show');
            document.body.classList.remove('drawer-open');
        }
    });
    
    // Mobile process button
    if (mobileProcessBtn) {
        mobileProcessBtn.addEventListener('click', function() {
            processBtn.click();
        });
    }
    
    // Mobile clear button
    if (mobileClearBtn) {
        mobileClearBtn.addEventListener('click', function() {
            clearBtn.click();
        });
    }
    
    // Helper function to initialize option handlers for cloned content
    function initOptionHandlers(container) {
        // Re-bind event listeners for checkboxes in the cloned content
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const originalId = checkbox.id;
            checkbox.id = `mobile-${originalId}`;
            
            checkbox.addEventListener('change', function() {
                // Sync with original checkbox
                const originalCheckbox = document.getElementById(originalId);
                if (originalCheckbox) {
                    originalCheckbox.checked = this.checked;
                    // Trigger change event on original
                    const event = new Event('change');
                    originalCheckbox.dispatchEvent(event);
                }
            });
        });
        
        // Re-bind other events as needed...
    }
    
    // Responsive behavior for tab content based on screen size
    function adjustForScreenSize() {
        if (window.innerWidth < 768) {
            // Mobile view adjustments
            document.querySelectorAll('.options-grid').forEach(grid => {
                grid.style.gridTemplateColumns = '1fr';
            });
            
            // Show mobile action bar
            document.querySelector('.mobile-actions-bar')?.classList.add('show');
            
            // Adjust textarea height for better mobile experience
            document.getElementById('input-text').rows = 5;
        } else {
            // Desktop view adjustments
            document.querySelectorAll('.options-grid').forEach(grid => {
                const viewMode = localStorage.getItem('optionsViewMode') || 'compact';
                if (viewMode === 'compact') {
                    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
                } else {
                    grid.style.gridTemplateColumns = '1fr';
                }
            });
            
            // Hide mobile action bar
            document.querySelector('.mobile-actions-bar')?.classList.remove('show');
            
            // Reset textarea height
            document.getElementById('input-text').rows = 8;
        }
    }
    
    // Initial adjustment and add resize listener
    adjustForScreenSize();
    window.addEventListener('resize', adjustForScreenSize);
    
    // Thêm xử lý file upload
    const fileUpload = document.getElementById('file-upload');

    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Hiển thị loading
        showLoading();
        
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                inputText.value = data.content;
                Swal.fire({
                    icon: 'success',
                    title: 'Tải file thành công',
                    text: 'Nội dung file đã được tải lên',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: data.error
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Có lỗi xảy ra khi tải file'
            });
        })
        .finally(() => {
            // Clear file input
            fileUpload.value = '';
            // Ẩn loading
            resultsContainer.innerHTML = '';
        });
    });

    // Khai báo biến toàn cục để lưu lịch sử xử lý
    let processingHistory = [];
    const MAX_HISTORY_ITEMS = 10;

    // Hàm thêm kết quả xử lý vào lịch sử
    function addToHistory(data) {
        // Tạo đối tượng lịch sử
        const historyItem = {
            timestamp: new Date().toISOString(),
            originalText: data.original_text || data.text || '',
            processedText: data.processed_text || '',
            augmentedTexts: data.augmented_texts || [],
            options: getSelectedOptions(), // Lưu các tùy chọn đã chọn
            id: Date.now() // ID duy nhất cho mục lịch sử
        };
        
        // Thêm vào đầu mảng (để mục mới nhất ở trên cùng)
        processingHistory.unshift(historyItem);
        
        // Giới hạn số lượng mục lịch sử
        if (processingHistory.length > MAX_HISTORY_ITEMS) {
            processingHistory = processingHistory.slice(0, MAX_HISTORY_ITEMS);
        }
        
        // Lưu vào localStorage
        saveHistoryToLocalStorage();
        
        // Cập nhật UI lịch sử
        updateHistoryUI();
    }

    // Lưu lịch sử vào localStorage
    function saveHistoryToLocalStorage() {
        localStorage.setItem('textProcessingHistory', JSON.stringify(processingHistory));
    }

    // Tải lịch sử từ localStorage
    function loadHistoryFromLocalStorage() {
        const savedHistory = localStorage.getItem('textProcessingHistory');
        if (savedHistory) {
            processingHistory = JSON.parse(savedHistory);
            updateHistoryUI();
        }
    }

    // Xóa tất cả lịch sử
    function clearHistory() {
        processingHistory = [];
        localStorage.removeItem('textProcessingHistory');
        updateHistoryUI();
    }

    // Lấy thông tin các tùy chọn đã chọn
    function getSelectedOptions() {
        const options = {
            cleaning: {},
            augmentation: {},
            vectorization: {}
        };
        
        // Lấy tùy chọn làm sạch
        document.querySelectorAll('#cleaning-content input[type="checkbox"]:checked').forEach(checkbox => {
            if (checkbox.id === 'remove-special-chars') {
                const customChars = document.getElementById('custom-special-chars')?.value.trim();
                options.cleaning[checkbox.id] = true;
                if (customChars) {
                    options.cleaning['custom-special-chars'] = customChars;
                }
            } else {
                options.cleaning[checkbox.id] = true;
            }
        });
        
        // Lấy tùy chọn tăng cường
        document.querySelectorAll('#augmentation-content input[type="checkbox"]:checked').forEach(checkbox => {
            options.augmentation[checkbox.id] = true;
        });
        
        // Lấy tùy chọn vector hóa
        document.querySelectorAll('#vectorization-content input[type="checkbox"]:checked').forEach(checkbox => {
            options.vectorization[checkbox.id] = true;
        });
        
        // Lấy số lượng mẫu
        const numSamplesInput = document.getElementById('num_samples');
        if (numSamplesInput) {
            options.num_samples = parseInt(numSamplesInput.value, 10);
        }
        
        return options;
    }

    // Áp dụng các tùy chọn đã lưu
    function applyOptions(options) {
        // Reset tất cả tùy chọn
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Áp dụng tùy chọn làm sạch
        for (const [key, value] of Object.entries(options.cleaning || {})) {
            const checkbox = document.getElementById(key);
            if (checkbox) checkbox.checked = value;
        }
        
        // Áp dụng tùy chọn tăng cường
        for (const [key, value] of Object.entries(options.augmentation || {})) {
            const checkbox = document.getElementById(key);
            if (checkbox) checkbox.checked = value;
        }
        
        // Áp dụng tùy chọn vector hóa
        for (const [key, value] of Object.entries(options.vectorization || {})) {
            const checkbox = document.getElementById(key);
            if (checkbox) checkbox.checked = value;
        }
        
        // Đặt số lượng mẫu
        const numSamplesInput = document.getElementById('num_samples');
        if (numSamplesInput && options.num_samples) {
            numSamplesInput.value = options.num_samples;
        }
        
        // Cập nhật UI hiển thị số lượng tùy chọn đã chọn
        updateSelectedCount();
    }

    // Cập nhật UI hiển thị lịch sử
    function updateHistoryUI() {
        const historyContainer = document.getElementById('history-container');
        if (!historyContainer) return;
        
        // Xóa nội dung cũ
        historyContainer.innerHTML = '';
        
        // Nếu không có lịch sử, hiển thị thông báo
        if (processingHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-history text-center p-4">
                    <i class="fas fa-history fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Chưa có lịch sử xử lý nào</p>
                </div>
            `;
            return;
        }
        
        // Tạo danh sách lịch sử
        const historyList = document.createElement('div');
        historyList.className = 'list-group';
        
        // Thêm từng mục lịch sử
        processingHistory.forEach((item, index) => {
            // Tạo chuỗi hiển thị thời gian
            const date = new Date(item.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Đảm bảo originalText là một chuỗi hợp lệ
            const originalText = item.originalText || '';
            
            // Tạo mục lịch sử
            const historyItem = document.createElement('div');
            historyItem.className = 'list-group-item list-group-item-action';
            historyItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <h6 class="mb-1 text-truncate" style="max-width: 70%;">${originalText.substring(0, 50)}${originalText.length > 50 ? '...' : ''}</h6>
                    <small class="text-muted">${formattedDate}</small>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <small class="text-muted">
                        <i class="fas fa-magic me-1"></i> ${countSelectedOptions(item.options)} tùy chọn
                        ${item.augmentedTexts.length ? `<span class="ms-2"><i class="fas fa-random me-1"></i> ${item.augmentedTexts.length} mẫu</span>` : ''}
                    </small>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary load-history" data-index="${index}">
                            <i class="fas fa-redo-alt"></i> Tải lại
                        </button>
                        <button class="btn btn-sm btn-outline-danger remove-history" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
        
        // Thêm nút xóa tất cả
        const clearAllBtn = document.createElement('button');
        clearAllBtn.className = 'btn btn-sm btn-outline-danger mt-3 w-100';
        clearAllBtn.innerHTML = '<i class="fas fa-trash-alt me-2"></i> Xóa tất cả lịch sử';
        clearAllBtn.addEventListener('click', clearHistory);
        
        // Thêm vào container
        historyContainer.appendChild(historyList);
        historyContainer.appendChild(clearAllBtn);
        
        // Thêm sự kiện cho các nút
        addHistoryButtonEvents();
    }

    // Đếm số lượng tùy chọn đã chọn trong một đối tượng options
    function countSelectedOptions(options) {
        let count = 0;
        
        // Đếm tùy chọn làm sạch
        count += Object.values(options.cleaning || {}).filter(Boolean).length;
        
        // Đếm tùy chọn tăng cường
        count += Object.values(options.augmentation || {}).filter(Boolean).length;
        
        // Đếm tùy chọn vector hóa
        count += Object.values(options.vectorization || {}).filter(Boolean).length;
        
        return count;
    }

    // Thêm sự kiện cho các nút trong lịch sử
    function addHistoryButtonEvents() {
        // Sự kiện nút tải lại
        document.querySelectorAll('.load-history').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const historyItem = processingHistory[index];
                
                // Đặt văn bản gốc vào textarea
                document.getElementById('input-text').value = historyItem.originalText;
                
                // Áp dụng các tùy chọn đã lưu
                applyOptions(historyItem.options);
                
                // Hiển thị thông báo
                showToast('Đã tải lịch sử xử lý', 'success');
                
                // Cuộn lên đầu trang
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Đóng modal lịch sử nếu đang mở
                const historyModal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
                if (historyModal) {
                    historyModal.hide();
                }
            });
        });
        
        // Sự kiện nút xóa
        document.querySelectorAll('.remove-history').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                
                // Xóa khỏi mảng
                processingHistory.splice(index, 1);
                
                // Lưu vào localStorage
                saveHistoryToLocalStorage();
                
                // Cập nhật UI
                updateHistoryUI();
                
                // Hiển thị thông báo
                showToast('Đã xóa mục lịch sử', 'info');
            });
        });
    }

    // Khi trang được tải hoàn tất
    document.addEventListener('DOMContentLoaded', function() {
        // Kiểm tra nếu có DOM elements
        if (!processBtn || !inputText || !resultsContainer) {
            console.error('Không tìm thấy các DOM elements cần thiết');
            return;
        }
        
        // Khởi tạo tooltips
        initTooltips();
        
        // Khởi tạo các chức năng khác
        initSampleText();
        initFileUpload();
        initThemeToggle();
        initHistoryFeature();
        initWordCounting();
        
        // Hiển thị thông báo chào mừng
        displayWelcomeMessage();
    });
    
    // Add missing functions
    
    // Display welcome message
    function displayWelcomeMessage() {
        // Check if this is first time visit
        const hasVisited = localStorage.getItem('hasVisitedBefore');
        if (!hasVisited) {
            // Show welcome message using the toast function
            showToast('Chào mừng đến với ứng dụng xử lý văn bản! Chọn một phương thức vector hóa và nhấn "Xử lý" để bắt đầu.', 'success');
            // Set flag for next time
            localStorage.setItem('hasVisitedBefore', 'true');
        }
    }
    
    // Initialize tooltips
    function initTooltips() {
        // If bootstrap tooltips are available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }
    
    // Initialize sample text functionality
    function initSampleText() {
        // Placeholder if needed
    }
    
    // Initialize file upload functionality
    function initFileUpload() {
        // Placeholder if needed
    }
    
    // Initialize theme toggle
    function initThemeToggle() {
        // Placeholder if needed
    }
    
    // Initialize history feature
    function initHistoryFeature() {
        // Placeholder if needed
    }
    
    // Initialize word counting
    function initWordCounting() {
        // Placeholder if needed
    }

    // Create One-Hot Table function
    function createOneHotTable(data) {
        try {
            let html = '<div class="table-responsive mt-3">';
            
            if (data.vectors && Array.isArray(data.vectors)) {
                html += '<h6>Ma trận One-Hot:</h6>';
                html += '<table class="table table-sm table-bordered table-hover vector-table">';
                html += '<thead class="table-light"><tr><th>#</th>';
                
                // Tạo tiêu đề cột từ từ vựng
                if (data.vocabulary) {
                    if (Array.isArray(data.vocabulary)) {
                        data.vocabulary.forEach(word => {
                            html += `<th>${word}</th>`;
                        });
                    } else {
                        Object.keys(data.vocabulary).forEach(word => {
                            html += `<th>${word}</th>`;
                        });
                    }
                }
                
                html += '</tr></thead><tbody>';
                
                // Thêm hàng cho mỗi vector
                data.vectors.forEach((vector, idx) => {
                    html += `<tr><td>${idx}</td>`;
                    vector.forEach(value => {
                        const cellClass = value > 0 ? 'bg-primary text-white' : '';
                        html += `<td class="${cellClass}">${value}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error("Error creating One-Hot table:", error);
            return `<div class="alert alert-danger">Lỗi tạo bảng One-Hot: ${error.message}</div>`;
        }
    }

    // Create Bag of Words Table function
    function createBagOfWordsTable(data) {
        try {
            let html = '<div class="table-responsive mt-3">';
            
            if (data.vectors && Array.isArray(data.vectors)) {
                html += '<h6>Ma trận Bag of Words:</h6>';
                html += '<table class="table table-sm table-bordered table-hover vector-table">';
                
                // Tạo hàng tiêu đề với các từ trong từ điển
                html += '<thead class="table-light"><tr><th>#</th>';
                
                // Tạo tiêu đề cột từ từ vựng (từ điển từ)
                if (data.vocabulary) {
                    const vocab = Array.isArray(data.vocabulary) 
                        ? data.vocabulary 
                        : Object.keys(data.vocabulary).sort();
                    
                    vocab.forEach(word => {
                        html += `<th>${word}</th>`;
                    });
                }
                
                html += '</tr></thead><tbody>';
                
                // Hiển thị câu gốc nếu có
                if (data.sentences && Array.isArray(data.sentences)) {
                    // Trường hợp có nhiều câu
                    data.sentences.forEach((sentence, idx) => {
                        html += `<tr><td>${idx}</td>`;
                        
                        // Thêm vector tương ứng với câu này
                        if (data.vectors[idx]) {
                            data.vectors[idx].forEach(value => {
                                // Định dạng ô với giá trị 0/1 
                                const cellClass = value > 0 ? 'bg-primary text-white' : '';
                                html += `<td class="${cellClass}">${value}</td>`;
                            });
                        }
                        
                        html += '</tr>';
                    });
                    
                    // Thêm phần hiển thị các câu gốc bên dưới bảng
                    html += '</tbody></table>';
                    html += '<div class="mt-3">';
                    html += '<h6>Các câu gốc:</h6>';
                    html += '<ol class="ps-3">';
                    data.sentences.forEach(sentence => {
                        html += `<li>"${sentence}"</li>`;
                    });
                    html += '</ol>';
                    html += '</div>';
                } else {
                    // Trường hợp chỉ có một văn bản, hiển thị như trước đây
                    data.vectors.forEach((vector, idx) => {
                        html += `<tr><td>${idx}</td>`;
                        vector.forEach(value => {
                            // Định dạng ô với giá trị 0/1
                            const cellClass = value > 0 ? 'bg-primary text-white' : '';
                            html += `<td class="${cellClass}">${value}</td>`;
                        });
                        html += '</tr>';
                    });
                    html += '</tbody></table>';
                }
            } else {
                html += '<div class="alert alert-warning">Không có dữ liệu ma trận để hiển thị.</div>';
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error("Error creating Bag of Words table:", error);
            return `<div class="alert alert-danger">Lỗi tạo bảng Bag of Words: ${error.message}</div>`;
        }
    }

    // Create TF-IDF Table function
    function createTfIdfTable(data) {
        try {
            let html = '<div class="table-responsive mt-3">';
            
            if (data.vectors && Array.isArray(data.vectors)) {
                html += '<h6>Ma trận TF-IDF:</h6>';
                html += '<table class="table table-sm table-bordered table-hover vector-table">';
                html += '<thead class="table-light"><tr><th>#</th>';
                
                // Tạo tiêu đề cột từ từ vựng
                if (data.vocabulary) {
                    if (Array.isArray(data.vocabulary)) {
                        data.vocabulary.forEach(word => {
                            html += `<th>${word}</th>`;
                        });
                    } else {
                        Object.keys(data.vocabulary).forEach(word => {
                            html += `<th>${word}</th>`;
                        });
                    }
                }
                
                html += '</tr></thead><tbody>';
                
                // Thêm hàng cho mỗi vector
                data.vectors.forEach((vector, idx) => {
                    html += `<tr><td>${idx}</td>`;
                    vector.forEach(value => {
                        // Format value để hiển thị tối đa 4 chữ số thập phân
                        const formattedValue = parseFloat(value).toFixed(4);
                        // Định dạng ô với giá trị > 0
                        const cellClass = value > 0 ? 'bg-info text-white' : '';
                        html += `<td class="${cellClass}" title="${value}">${formattedValue}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error("Error creating TF-IDF table:", error);
            return `<div class="alert alert-danger">Lỗi tạo bảng TF-IDF: ${error.message}</div>`;
        }
    }

    // Hàm để gọi API vector hóa
    async function vectorizeText(text, vectorType, ngram_min, ngram_max) {
        try {
            // Hiển thị indicator loading
            console.log(`Đang vector hóa văn bản với phương pháp: ${vectorType}`);
            
            // Chuẩn bị dữ liệu gửi lên API
            const requestData = {
                text: text,
                vector_type: vectorType,
                ngram_min: ngram_min,
                ngram_max: ngram_max
            };
            
            // Gọi API vector hóa
            const response = await fetch('/api/vectorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // Kiểm tra response status
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Chuyển đổi response thành JSON
            const data = await response.json();
            
            // Kiểm tra status trong response
            if (data.status !== 'success') {
                throw new Error(data.message || 'Có lỗi xảy ra khi vector hóa văn bản');
            }
            
            // Chuyển đổi dữ liệu phù hợp với các hàm tạo bảng
            return {
                original_text: data.original_text,
                vocabulary: data.feature_names,
                vectors: data.matrix,
                sentences: data.sentences || [data.original_text],
                processing_time: data.processing_time,
                status: 'success'
            };
        } catch (error) {
            console.error('Error in vectorizeText:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    // Create N-Grams Table function
    function createNgramsTable(data) {
        try {
            let html = '<div class="table-responsive mt-3">';
            
            if (data.status === 'error') {
                return `<div class="alert alert-danger">${data.error}</div>`;
            }
            
            // Hiển thị thông tin về phạm vi n-gram
            if (data.ngram_range) {
                html += `<div class="alert alert-info mb-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Ma trận Bag of N-Grams (n từ ${data.ngram_range[0]} đến ${data.ngram_range[1]})
                </div>`;
            }
            
            if (data.vectors && Array.isArray(data.vectors)) {
                html += '<h6>Ma trận Bag of N-Grams:</h6>';
                html += '<table class="table table-sm table-bordered table-hover vector-table">';
                
                // Tạo hàng tiêu đề với các từ/n-grams trong từ điển
                html += '<thead class="table-light"><tr><th>#</th>';
                
                // Tạo tiêu đề cột từ từ vựng (các n-grams)
                if (data.vocabulary) {
                    const vocab = Array.isArray(data.vocabulary) 
                        ? data.vocabulary 
                        : Object.keys(data.vocabulary).sort();
                    
                    vocab.forEach(ngram => {
                        html += `<th>${ngram}</th>`;
                    });
                }
                
                html += '</tr></thead><tbody>';
                
                // Hiển thị câu gốc nếu có
                if (data.sentences && Array.isArray(data.sentences)) {
                    // Trường hợp có nhiều câu
                    data.sentences.forEach((sentence, idx) => {
                        html += `<tr><td>${idx+1}</td>`;
                        
                        // Thêm vector tương ứng với câu này
                        if (data.vectors[idx]) {
                            data.vectors[idx].forEach(value => {
                                // Định dạng ô với giá trị
                                let cellClass = '';
                                if (value > 0) {
                                    // Màu sắc khác nhau dựa trên giá trị
                                    if (value === 1) {
                                        cellClass = 'bg-primary text-white';
                                    } else if (value > 1) {
                                        cellClass = 'bg-success text-white';
                                    }
                                }
                                html += `<td class="${cellClass}">${value}</td>`;
                            });
                        }
                        
                        html += '</tr>';
                    });
                    
                    // Thêm phần hiển thị các câu gốc bên dưới bảng
                    html += '</tbody></table>';
                    html += '<div class="mt-4">';
                    html += '<h6><i class="fas fa-file-alt me-2"></i> Các câu gốc:</h6>';
                    html += '<ol class="ps-3">';
                    data.sentences.forEach(sentence => {
                        html += `<li>"${sentence}"</li>`;
                    });
                    html += '</ol>';
                    html += '</div>';
                } else {
                    // Trường hợp chỉ có một văn bản, hiển thị như trước đây
                    data.vectors.forEach((vector, idx) => {
                        html += `<tr><td>${idx+1}</td>`;
                        vector.forEach(value => {
                            // Định dạng ô với giá trị
                            let cellClass = '';
                            if (value > 0) {
                                // Màu sắc khác nhau dựa trên giá trị
                                if (value === 1) {
                                    cellClass = 'bg-primary text-white';
                                } else if (value > 1) {
                                    cellClass = 'bg-success text-white';
                                }
                            }
                            html += `<td class="${cellClass}">${value}</td>`;
                        });
                        html += '</tr>';
                    });
                    html += '</tbody></table>';
                }
            } else {
                html += '<div class="alert alert-warning">Không có dữ liệu ma trận để hiển thị.</div>';
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error("Error creating N-Grams table:", error);
            return `<div class="alert alert-danger">Lỗi tạo bảng N-Grams: ${error.message}</div>`;
        }
    }

    // Mobile drawer toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            mobileDrawer.classList.add('show');
            document.body.classList.add('drawer-open');
        });
    }
    
    // Initialize custom special chars field visibility based on checkbox state
    const initRemoveSpecialCharsField = document.getElementById('remove-special-chars');
    const initCustomSpecialCharsContainer = document.querySelector('.custom-special-chars');
    
    if (initRemoveSpecialCharsField && initCustomSpecialCharsContainer) {
        initCustomSpecialCharsContainer.style.display = initRemoveSpecialCharsField.checked ? 'block' : 'none';
    }
    
    // Khởi tạo lịch sử xử lý
    loadHistoryFromLocalStorage();
    
    // Thiết lập thông báo chào mừng
    if (document.getElementById('welcome-message')) {
        displayWelcomeMessage();
    }
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize theme toggle
    initThemeToggle();

    // Hàm để gọi API phân loại văn bản
    async function classifyText(text, modelType = 'naive_bayes', useCleanText = true) {
        try {
            console.log(`Đang phân loại văn bản với mô hình: ${modelType}`);
            
            // Hiển thị thông báo loading trong container kết quả
            const loadingHTML = `
                <div class="card mb-4 loading-message">
                    <div class="card-body text-center py-5">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <h5>Đang xử lý mô hình ${modelType}...</h5>
                        <p class="text-muted">Quá trình này có thể mất vài giây nếu cần huấn luyện mô hình mới.</p>
                    </div>
                </div>
            `;
            $('#results-container').html(loadingHTML);
            
            // Chuẩn bị dữ liệu gửi lên API
            const requestData = {
                text: text,
                model_type: modelType,
                clean_text: useCleanText,
                use_saved_model: true
            };
            
            // Gọi API phân loại
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // Xóa thông báo loading
            $('.loading-message').remove();
            
            // Kiểm tra response status
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Chuyển đổi response thành JSON
            const data = await response.json();
            
            // Kiểm tra status trong response
            if (data.status !== 'success') {
                throw new Error(data.message || 'Có lỗi xảy ra khi phân loại văn bản');
            }
            
            return data;
        } catch (error) {
            console.error('Error in classifyText:', error);
            // Xóa thông báo loading nếu có lỗi
            $('.loading-message').remove();
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    // Hàm để gọi API huấn luyện mô hình phân loại
    async function trainClassifier(filePath, modelType = 'naive_bayes', textColumn = 'review', labelColumn = 'sentiment') {
        try {
            console.log(`Đang huấn luyện mô hình ${modelType} với dữ liệu từ ${filePath}`);
            
            // Chuẩn bị dữ liệu gửi lên API
            const requestData = {
                file_path: filePath,
                model_type: modelType,
                text_column: textColumn,
                label_column: labelColumn,
                save_model: true
            };
            
            // Gọi API huấn luyện
            const response = await fetch('/api/train_classifier', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            // Kiểm tra response status
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Chuyển đổi response thành JSON
            const data = await response.json();
            
            // Kiểm tra status trong response
            if (data.status !== 'success') {
                throw new Error(data.message || 'Có lỗi xảy ra khi huấn luyện mô hình');
            }
            
            return data;
        } catch (error) {
            console.error('Error in trainClassifier:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    // Hàm tạo HTML cho kết quả phân loại
    function createClassificationResultHTML(data) {
        try {
            let html = '<div class="card mb-4">';
            html += '<div class="card-header bg-primary bg-gradient text-white">';
            html += '<div class="d-flex align-items-center">';
            html += '<i class="fas fa-tag me-2"></i>';
            html += '<h6 class="mb-0">Kết quả phân loại văn bản</h6>';
            html += `<span class="badge bg-light text-dark ms-auto">${data.processing_time}s</span>`;
            html += '</div></div>';
            html += '<div class="card-body">';
            
            // Nếu có lỗi
            if (data.status === 'error') {
                html += `<div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Lỗi: ${data.error || data.message}
                </div>`;
                html += '</div></div>';
                return html;
            }
            
            // Hiển thị kết quả dự đoán
            if (data.prediction) {
                const prediction = data.prediction;
                const label = prediction.predicted_label;
                
                html += `<div class="alert alert-success mb-4">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle me-2 fs-4"></i>
                        <div>
                            <h6 class="mb-0">Nhãn được dự đoán:</h6>
                            <div class="fs-4 fw-bold mt-2">${label}</div>
                        </div>
                    </div>
                </div>`;
                
                // Hiển thị phân phối xác suất
                if (prediction.probabilities) {
                    // Tính phần trăm chính xác từ xác suất cao nhất (lấy giá trị xác suất lớn nhất)
                    const probabilities = prediction.probabilities;
                    const maxProb = Math.max(...Object.values(probabilities).map(p => parseFloat(p)));
                    const accuracy = maxProb * 100;
                    
                    // Hiển thị độ chính xác (Accuracy) ở đây
                    html += '<div class="row g-3 mb-4">';
                    html += '<div class="col-md-6 mx-auto">';
                    html += '<div class="card h-100 border-0 bg-light">';
                    html += '<div class="card-body text-center">';
                    html += '<h5 class="text-muted mb-2">Độ chính xác (Accuracy)</h5>';
                    html += `<div class="fs-1 fw-bold text-success">${accuracy.toFixed(2)}%</div>`;
                    html += '</div></div></div>';
                    html += '</div>';
                    
                    html += '<h6 class="mb-3">Phân phối xác suất các nhãn:</h6>';
                    html += '<div class="chart-container" style="position: relative; height: 200px; width: 100%;">';
                    html += '<canvas id="probability-chart"></canvas>';
                    html += '</div>';
                    
                    // Chart sẽ được khởi tạo sau bằng JavaScript
                    
                    // Hiển thị dạng bảng các xác suất
                    html += '<div class="table-responsive mt-4">';
                    html += '<table class="table table-sm table-bordered table-hover">';
                    html += '<thead class="table-light"><tr><th>Nhãn</th><th>Xác suất</th></tr></thead>';
                    html += '<tbody>';
                    
                    const sortedLabels = Object.keys(probabilities).sort((a, b) => probabilities[b] - probabilities[a]);
                    
                    sortedLabels.forEach(label => {
                        const prob = probabilities[label];
                        const probPercent = (prob * 100).toFixed(2);
                        const isMax = label === prediction.predicted_label;
                        const rowClass = isMax ? 'table-primary' : '';
                        
                        html += `<tr class="${rowClass}">
                            <td>${label}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="progress flex-grow-1 me-2" style="height: 20px;">
                                        <div class="progress-bar ${isMax ? 'bg-success' : 'bg-info'}" 
                                             role="progressbar" 
                                             style="width: ${probPercent}%;" 
                                             aria-valuenow="${probPercent}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                        </div>
                                    </div>
                                    <span class="text-nowrap">${probPercent}%</span>
                                </div>
                            </td>
                        </tr>`;
                    });
                    
                    html += '</tbody></table>';
                    html += '</div>';
                }
                
                // Hiển thị văn bản đầu vào và văn bản đã làm sạch
                html += '<div class="card mt-4">';
                html += '<div class="card-header bg-light"><h6 class="mb-0">Văn bản đầu vào:</h6></div>';
                html += '<div class="card-body">';
                html += '<div class="mb-3">';
                html += '<div class="form-control form-control-sm overflow-auto" style="max-height: 150px;">';
                html += data.original_text;
                html += '</div>';
                html += '</div>';
                
                if (data.clean_text && data.clean_text !== data.original_text) {
                    html += '<h6 class="mb-2">Văn bản sau khi làm sạch:</h6>';
                    html += '<div class="form-control form-control-sm overflow-auto" style="max-height: 150px;">';
                    html += data.clean_text;
                    html += '</div>';
                }
                
                html += '</div></div>'; // Đóng card văn bản
            }
            
            // Hiển thị kết quả huấn luyện nếu có
            if (data.training_result) {
                const training = data.training_result;
                
                html += '<div class="card mt-4">';
                html += '<div class="card-header bg-light"><h6 class="mb-0">Kết quả huấn luyện mô hình:</h6></div>';
                html += '<div class="card-body">';
                
                // Hiển thị các chỉ số đánh giá
                html += '<div class="row g-3 mb-4">';
                
                // Accuracy
                html += '<div class="col-md-3 col-6">';
                html += '<div class="card h-100 border-0 bg-light">';
                html += '<div class="card-body text-center">';
                html += '<h6 class="text-muted mb-2">Độ chính xác</h6>';
                html += `<div class="fs-3 fw-bold">${(training.accuracy * 100).toFixed(2)}%</div>`;
                html += '</div></div></div>';
                
                // Precision
                html += '<div class="col-md-3 col-6">';
                html += '<div class="card h-100 border-0 bg-light">';
                html += '<div class="card-body text-center">';
                html += '<h6 class="text-muted mb-2">Precision</h6>';
                html += `<div class="fs-3 fw-bold">${(training.precision * 100).toFixed(2)}%</div>`;
                html += '</div></div></div>';
                
                // Recall
                html += '<div class="col-md-3 col-6">';
                html += '<div class="card h-100 border-0 bg-light">';
                html += '<div class="card-body text-center">';
                html += '<h6 class="text-muted mb-2">Recall</h6>';
                html += `<div class="fs-3 fw-bold">${(training.recall * 100).toFixed(2)}%</div>`;
                html += '</div></div></div>';
                
                // F1 Score
                html += '<div class="col-md-3 col-6">';
                html += '<div class="card h-100 border-0 bg-light">';
                html += '<div class="card-body text-center">';
                html += '<h6 class="text-muted mb-2">F1 Score</h6>';
                html += `<div class="fs-3 fw-bold">${(training.f1 * 100).toFixed(2)}%</div>`;
                html += '</div></div></div>';
                
                html += '</div>'; // Close row
                
                // Thêm thông tin về mô hình
                html += '<div class="row mb-4">';
                html += '<div class="col-md-6">';
                html += '<h6 class="mb-2">Thông tin mô hình:</h6>';
                html += '<ul class="list-group">';
                html += `<li class="list-group-item d-flex justify-content-between">
                    <span>Loại mô hình:</span>
                    <span class="fw-bold">${data.model_type}</span>
                </li>`;
                html += `<li class="list-group-item d-flex justify-content-between">
                    <span>Số lượng đặc trưng:</span>
                    <span class="fw-bold">${training.feature_count.toLocaleString()}</span>
                </li>`;
                html += `<li class="list-group-item d-flex justify-content-between">
                    <span>Số mẫu huấn luyện:</span>
                    <span class="fw-bold">${training.train_samples.toLocaleString()}</span>
                </li>`;
                html += `<li class="list-group-item d-flex justify-content-between">
                    <span>Số mẫu kiểm thử:</span>
                    <span class="fw-bold">${training.test_samples.toLocaleString()}</span>
                </li>`;
                html += '</ul>';
                html += '</div>';
                
                // Hiển thị ma trận nhầm lẫn
                if (training.confusion_matrix && training.labels) {
                    html += '<div class="col-md-6">';
                    html += '<h6 class="mb-2">Ma trận nhầm lẫn:</h6>';
                    html += '<div class="table-responsive">';
                    html += '<table class="table table-sm table-bordered confusion-matrix">';
                    html += '<thead class="table-light"><tr><th></th>';
                    
                    // Thêm tiêu đề cho các nhãn
                    training.labels.forEach(label => {
                        html += `<th>${label}</th>`;
                    });
                    html += '</tr></thead><tbody>';
                    
                    // Thêm dữ liệu của ma trận
                    training.confusion_matrix.forEach((row, idx) => {
                        html += `<tr><th>${training.labels[idx]}</th>`;
                        row.forEach(value => {
                            // Màu nền tùy thuộc vào giá trị
                            let bgClass = 'bg-light';
                            if (value > 0) {
                                const intensity = Math.min(Math.floor(value / 10), 9);
                                bgClass = `bg-info-subtle`;
                                
                                // Nếu là giá trị chính xác (diagonal)
                                if (idx === row.indexOf(value) && value > 0) {
                                    bgClass = 'bg-success-subtle';
                                }
                            }
                            html += `<td class="${bgClass}">${value}</td>`;
                        });
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                    html += '</div></div>';
                }
                
                html += '</div>'; // Close row
                
                html += '</div></div>'; // Close card
            }
            
            html += '</div></div>'; // Close main card
            return html;
        } catch (error) {
            console.error("Error creating classification result HTML:", error);
            return `<div class="alert alert-danger">Lỗi khi tạo kết quả phân loại: ${error.message}</div>`;
        }
    }

    // Hàm khởi tạo biểu đồ xác suất
    function initProbabilityChart(probabilities) {
        const ctx = document.getElementById('probability-chart');
        if (!ctx) return;
        
        const labels = Object.keys(probabilities);
        const data = labels.map(label => probabilities[label] * 100);
        const backgroundColor = labels.map((_, i) => {
            const hue = (i * 120) % 360;
            return `hsla(${hue}, 70%, 60%, 0.7)`;
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Xác suất (%)',
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Xác suất (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Nhãn'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Xác suất: ${context.raw.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Mở rộng hàm processForm để xử lý phân loại văn bản
    async function processForm() {
        // Hiển thị indicator loading
        showLoading();
        
        // Xóa kết quả trước đó nếu người dùng nhấn nút xử lý nhiều lần
        $('#results-container').empty();
        
        // Lấy văn bản đầu vào
        const inputText = $('#input-text').val().trim();
        if (!inputText) {
            hideLoading();
            showToast('Vui lòng nhập văn bản để xử lý', 'warning');
            return;
        }
        
        // Lấy tất cả các tùy chọn đã chọn
        const selectedOptions = getSelectedOptions();
        
        // Kiểm tra có tùy chọn nào được chọn không
        if (!selectedOptions || !Object.values(selectedOptions).some(group => Object.values(group).some(Boolean))) {
            hideLoading();
            showToast('Vui lòng chọn ít nhất một tùy chọn xử lý', 'warning');
            return;
        }
        
        console.log('Các tùy chọn đã chọn:', selectedOptions);
        
        // Thêm sự lựa chọn vào lịch sử
        addToHistory({
            text: inputText,
            options: selectedOptions,
            timestamp: new Date().toISOString()
        });
        
        // Cập nhật hiển thị số lượng tùy chọn đã chọn
        const totalSelected = countSelectedOptions(selectedOptions);
        $('.selected-count').text(totalSelected);

        // Kiểm tra nếu có phân loại văn bản được chọn
        const hasClassificationSelected = $('#naive-bayes').is(':checked') ||
                                         $('#logistic-regression').is(':checked') ||
                                         $('#svm').is(':checked') ||
                                         $('#knn').is(':checked') ||
                                         $('#decision-tree').is(':checked');

        // Nếu có tùy chọn phân loại được chọn, xử lý phân loại trước
        if (hasClassificationSelected) {
            try {
                // Lấy mô hình được chọn
                let modelType = 'naive_bayes'; // Mặc định
                
                if ($('#logistic-regression').is(':checked')) {
                    modelType = 'logistic_regression';
                } else if ($('#svm').is(':checked')) {
                    modelType = 'svm';
                } else if ($('#knn').is(':checked')) {
                    modelType = 'knn';
                } else if ($('#decision-tree').is(':checked')) {
                    modelType = 'decision_tree';
                }
                
                // Gọi API phân loại
                const classificationResult = await classifyText(
                    inputText,
                    modelType,
                    true // Sử dụng văn bản đã làm sạch
                );
                
                // Tạo HTML và hiển thị kết quả
                const classificationHTML = createClassificationResultHTML(classificationResult);
                
                const resultBlock = $('<div>').addClass('result-block classification-result')
                    .attr('data-result-type', 'classification')
                    .append(classificationHTML);
                
                $('#results-container').append(resultBlock);
                
                // Khởi tạo biểu đồ nếu có dữ liệu xác suất
                if (classificationResult.status === 'success' && 
                    classificationResult.prediction && 
                    classificationResult.prediction.probabilities) {
                    setTimeout(() => {
                        initProbabilityChart(classificationResult.prediction.probabilities);
                    }, 100);
                }
                
                // Hiển thị nút kiểm thử mô hình
                $('#model-training-results').show();
                
                // Thêm sự kiện cho nút dự đoán
                $('#test-model-btn').off('click').on('click', async function() {
                    const testText = $('#test-model-input').val().trim();
                    if (!testText) {
                        showToast('Vui lòng nhập văn bản để dự đoán', 'warning');
                        return;
                    }
                    
                    // Hiển thị loading
                    $('#test-model-btn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Đang xử lý...');
                    
                    try {
                        // Gọi API dự đoán
                        const predictionResult = await classifyText(
                            testText,
                            modelType,
                            true
                        );
                        
                        // Hiển thị kết quả
                        if (predictionResult.status === 'success') {
                            const prediction = predictionResult.prediction;
                            let resultHTML = `<div class="alert alert-success">
                                <h6 class="mb-2">Kết quả dự đoán:</h6>
                                <div class="fs-4 fw-bold">${prediction.predicted_label}</div>
                            </div>`;
                            
                            // Hiển thị xác suất
                            resultHTML += '<div class="table-sm mt-2">';
                            resultHTML += '<table class="table table-sm table-bordered">';
                            resultHTML += '<thead><tr><th>Nhãn</th><th>Xác suất</th></tr></thead>';
                            resultHTML += '<tbody>';
                            
                            const probabilities = prediction.probabilities;
                            const sortedLabels = Object.keys(probabilities).sort((a, b) => probabilities[b] - probabilities[a]);
                            
                            sortedLabels.forEach(label => {
                                const prob = probabilities[label];
                                const probPercent = (prob * 100).toFixed(2);
                                const isMax = label === prediction.predicted_label;
                                const rowClass = isMax ? 'table-primary' : '';
                                
                                resultHTML += `<tr class="${rowClass}">
                                    <td>${label}</td>
                                    <td>${probPercent}%</td>
                                </tr>`;
                            });
                            
                            resultHTML += '</tbody></table>';
                            resultHTML += '</div>';
                            
                            $('#model-prediction-result').html(resultHTML).show();
                        } else {
                            $('#model-prediction-result')
                                .html(`<div class="alert alert-danger">Lỗi: ${predictionResult.error}</div>`)
                                .show();
                        }
                    } catch (error) {
                        $('#model-prediction-result')
                            .html(`<div class="alert alert-danger">Lỗi: ${error.message}</div>`)
                            .show();
                    } finally {
                        // Khôi phục nút
                        $('#test-model-btn').prop('disabled', false).html('<i class="fas fa-magic me-1"></i> Dự đoán');
                    }
                });
            } catch (error) {
                console.error('Error in text classification:', error);
                $('#results-container').append(
                    $('<div>').addClass('alert alert-danger')
                        .html(`<i class="fas fa-exclamation-triangle me-2"></i>Lỗi khi phân loại văn bản: ${error.message}`)
                );
            }
            
            // Cập nhật giao diện
            $('#download-results-btn, #clear-results-btn').prop('disabled', false);
            $('.empty-state').hide();
            hideLoading();
            return; // Dừng xử lý, không hiển thị kết quả vector hóa
        }

        // Nếu có tùy chọn vector hóa được chọn và không có phân loại
        if (selectedOptions.vectorization) {
            try {
                // Tạo HTML hiển thị kết quả vector hóa
                const vectorizationHTML = createVectorizationHTML(selectedOptions.vectorization);
                const vectorizationResult = $('<div>').addClass('result-block vectorization-result')
                    .attr('data-result-type', 'vectorization')
                    .append(vectorizationHTML);
                
                // Thêm vào container kết quả
                $('#results-container').append(vectorizationResult);
                
                // Nếu có option one-hot encoding
                if (selectedOptions.vectorization['one-hot']) {
                    const oneHotResult = await vectorizeText(inputText, 'onehot');
                    
                    if (oneHotResult.status === 'success') {
                        const oneHotTable = createOneHotTable(oneHotResult);
                        $('.onehot-result-container').html(oneHotTable);
                    } else {
                        $('.onehot-result-container').html(`<div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>${oneHotResult.error || 'Lỗi khi vector hóa văn bản'}
                        </div>`);
                    }
                }
                
                // Nếu có option bag of words
                if (selectedOptions.vectorization['bow']) {
                    const bowResult = await vectorizeText(inputText, 'bow');
                    
                    if (bowResult.status === 'success') {
                        const bowTable = createBagOfWordsTable(bowResult);
                        $('.bow-result-container').html(bowTable);
                    } else {
                        $('.bow-result-container').html(`<div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>${bowResult.error || 'Lỗi khi vector hóa văn bản'}
                        </div>`);
                    }
                }
                
                // Nếu có option TF-IDF
                if (selectedOptions.vectorization['tfidf']) {
                    const tfidfResult = await vectorizeText(inputText, 'tfidf');
                    
                    if (tfidfResult.status === 'success') {
                        const tfidfTable = createTfIdfTable(tfidfResult);
                        $('.tfidf-result-container').html(tfidfTable);
                    } else {
                        $('.tfidf-result-container').html(`<div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>${tfidfResult.error || 'Lỗi khi vector hóa văn bản'}
                        </div>`);
                    }
                }
                
                // Nếu có option N-grams
                if (selectedOptions.vectorization['ngrams']) {
                    // Lấy các tham số n-gram từ UI (nếu có)
                    const ngram_min = parseInt($('#ngram-min').val()) || 2;
                    const ngram_max = parseInt($('#ngram-max').val()) || 3;
                    
                    const ngramsResult = await vectorizeText(inputText, 'ngrams', ngram_min, ngram_max);
                    
                    if (ngramsResult.status === 'success') {
                        const ngramsTable = createNgramsTable(ngramsResult);
                        $('.ngrams-result-container').html(ngramsTable);
                    } else {
                        $('.ngrams-result-container').html(`<div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>${ngramsResult.error || 'Lỗi khi vector hóa văn bản'}
                        </div>`);
                    }
                }
                
            } catch (error) {
                console.error('Error in vectorization:', error);
                $('#results-container').append(
                    $('<div>').addClass('alert alert-danger')
                        .html(`<i class="fas fa-exclamation-triangle me-2"></i>Lỗi khi vector hóa văn bản: ${error.message}`)
                );
            }
        }
        
        // Cập nhật giao diện
        $('#download-results-btn, #clear-results-btn').prop('disabled', false);
        $('.empty-state').hide();
        hideLoading();
    }

    // Thêm hàm để rebind event cho tất cả các checkbox
    function rebindCheckboxEvents() {
        // Đặt cờ để đánh dấu đang trong quá trình rebinding để tránh vòng lặp vô hạn
        if (window.isRebinding) return;
        window.isRebinding = true;
        
        // Đảm bảo tất cả checkbox đều có sự kiện change
        document.querySelectorAll('.tab-pane input[type="checkbox"]:not([data-bound])').forEach(checkbox => {
            // Đánh dấu checkbox đã được xử lý
            checkbox.setAttribute('data-bound', 'true');
            
            // Gán event listener
            checkbox.addEventListener('change', function() {
                updateSelectedCount();
                
                // Xử lý logic radio button cho vectorization methods
                if (this.id === 'one-hot' && this.checked) {
                    if (document.getElementById('bow')) document.getElementById('bow').checked = false;
                    if (document.getElementById('tfidf')) document.getElementById('tfidf').checked = false;
                    if (document.getElementById('ngrams')) document.getElementById('ngrams').checked = false;
                } else if (this.id === 'bow' && this.checked) {
                    if (document.getElementById('one-hot')) document.getElementById('one-hot').checked = false;
                    if (document.getElementById('tfidf')) document.getElementById('tfidf').checked = false;
                    if (document.getElementById('ngrams')) document.getElementById('ngrams').checked = false;
                } else if (this.id === 'tfidf' && this.checked) {
                    if (document.getElementById('one-hot')) document.getElementById('one-hot').checked = false;
                    if (document.getElementById('bow')) document.getElementById('bow').checked = false;
                    if (document.getElementById('ngrams')) document.getElementById('ngrams').checked = false;
                } else if (this.id === 'ngrams' && this.checked) {
                    if (document.getElementById('one-hot')) document.getElementById('one-hot').checked = false;
                    if (document.getElementById('bow')) document.getElementById('bow').checked = false;
                    if (document.getElementById('tfidf')) document.getElementById('tfidf').checked = false;
                    
                    // Hiển thị tùy chọn N-Grams
                    const ngramsOptions = document.querySelector('.ngrams-options');
                    if (ngramsOptions) {
                        ngramsOptions.style.display = 'block';
                    }
                }
                
                // Hiển thị/ẩn tùy chọn nhiễu dữ liệu
                if (this.id === 'data-noise') {
                    const noiseOptions = document.getElementById('noise-options');
                    if (noiseOptions) {
                        noiseOptions.style.display = this.checked ? 'block' : 'none';
                    }
                }
                
                // Hiển thị/ẩn tùy chọn ký tự đặc biệt
                if (this.id === 'remove-special-chars') {
                    const customSpecialCharsContainer = document.querySelector('.custom-special-chars');
                    if (customSpecialCharsContainer) {
                        customSpecialCharsContainer.style.display = this.checked ? 'block' : 'none';
                    }
                }
            });
        });
        
        // Cập nhật số lượng tùy chọn đã chọn
        updateSelectedCount();
        
        // Xóa cờ rebinding
        window.isRebinding = false;
    }
    
    // Gọi rebind khi document load
    rebindCheckboxEvents();
    
    // Hàm phân loại văn bản sử dụng mô hình mới nhất
    async function classifyTextWithLatestModel(text, cleanText = true) {
        try {
            console.log('Đang phân loại văn bản...');
            
            // Lấy thể loại mô hình từ dropdown
            const modelCategorySelect = document.getElementById('model-category-select');
            let modelCategory = modelCategorySelect ? modelCategorySelect.value : '';
            
            // Nếu thể loại là 'general', lấy giá trị từ dropdown thể loại tùy chỉnh
            if (modelCategory === 'general') {
                const customCategoryDropdown = document.getElementById('custom-category-dropdown');
                const customCategory = customCategoryDropdown ? customCategoryDropdown.value : '';
                if (customCategory) {
                    modelCategory = customCategory;
                }
            }
            
            console.log('Thể loại mô hình:', modelCategory);

            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text,
                    clean_text: cleanText,
                    model_category: modelCategory
                })
            });
            
            // Kiểm tra HTTP status
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Chuyển đổi response sang JSON
            const data = await response.json();
            
            // Kiểm tra status trong response
            if (data.status !== 'success') {
                console.error('API error:', data.message);
                return {
                    status: 'error',
                    message: data.message || 'Lỗi không xác định khi phân loại văn bản'
                };
            }
            
            // Trả về kết quả
            return data;
        } catch (error) {
            console.error('Error classifying text:', error);
            return {
                status: 'error',
                message: error.message || 'Lỗi khi phân loại văn bản'
            };
        }
    }

    // Hàm tải danh sách thể loại mô hình
    async function loadModelCategories() {
        try {
            const response = await fetch('/api/model_categories');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.categories) {
                return data.categories;
            } else {
                console.error('Error loading model categories:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error loading model categories:', error);
            return [];
        }
    }

    // Hàm cập nhật dropdown thể loại tùy chỉnh
    async function updateCustomCategoryDropdown() {
        const customCategoryDropdown = document.getElementById('custom-category-dropdown');
        if (!customCategoryDropdown) return;
        
        // Xóa các tùy chọn hiện có
        customCategoryDropdown.innerHTML = '<option value="">Đang tải danh sách thể loại...</option>';
        
        // Tải danh sách thể loại
        const categories = await loadModelCategories();
        
        // Nếu không có thể loại nào
        if (categories.length === 0) {
            customCategoryDropdown.innerHTML = '<option value="">Không có thể loại nào</option>';
            return;
        }
        
        // Cập nhật dropdown
        customCategoryDropdown.innerHTML = '<option value="">-- Chọn thể loại --</option>';
        
        // Thêm các tùy chọn
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = `${category.name} (${category.model_count} mô hình)`;
            customCategoryDropdown.appendChild(option);
        });
    }

    // Thêm sự kiện cho dropdown thể loại mô hình
    const modelCategorySelect = document.getElementById('model-category-select');
    if (modelCategorySelect) {
        modelCategorySelect.addEventListener('change', function() {
            const customCategoryContainer = document.getElementById('custom-category-dropdown-container');
            if (this.value === 'general' && customCategoryContainer) {
                customCategoryContainer.style.display = 'block';
                updateCustomCategoryDropdown();
            } else if (customCategoryContainer) {
                customCategoryContainer.style.display = 'none';
            }
        });
    }

    // Hàm render kết quả phân loại văn bản
    function renderClassificationResults(result, showProbabilities = true) {
        // Kiểm tra dữ liệu
        if (!result || result.status !== 'success' || !result.predicted_label) {
            return `<div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Không thể hiển thị kết quả phân loại văn bản
            </div>`;
        }
        
        const label = result.predicted_label;
        
        let html = `
            <div class="card mb-4 classification-result">
                <div class="card-header bg-primary text-white">
                    <h5><i class="fas fa-tag me-2"></i> Kết quả phân loại văn bản</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <h5 class="mb-2">Nhãn được dự đoán:</h5>
                        <div class="alert alert-success fs-4 fw-bold text-center">${label}</div>
                    </div>
        `;
        
        // Hiển thị xác suất nếu được yêu cầu và có dữ liệu
        if (showProbabilities && result.probabilities) {
            html += `<div class="mt-4">
                <h5 class="mb-3">Phân phối xác suất:</h5>
                <div class="table-responsive">
                    <table class="table table-bordered table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Nhãn</th>
                                <th>Xác suất</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Sắp xếp các nhãn theo xác suất giảm dần
            const sortedLabels = Object.keys(result.probabilities).sort(
                (a, b) => result.probabilities[b] - result.probabilities[a]
            );
            
            // Thêm hàng cho mỗi nhãn
            sortedLabels.forEach(lbl => {
                const prob = result.probabilities[lbl];
                const probPercent = (prob * 100).toFixed(2);
                const isHighest = lbl === label;
                
                html += `
                    <tr class="${isHighest ? 'table-success' : ''}">
                        <td>${lbl}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="progress flex-grow-1 me-2" style="height: 20px;">
                                    <div class="progress-bar ${isHighest ? 'bg-success' : 'bg-primary'}" 
                                         role="progressbar" 
                                         style="width: ${probPercent}%;" 
                                         aria-valuenow="${probPercent}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                    </div>
                                </div>
                                <span>${probPercent}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            </div>`;
        }
        
        // Thông tin về mô hình và thời gian xử lý
        html += `
            <div class="mt-4">
                <div class="d-flex justify-content-between flex-wrap">
                    <span><i class="fas fa-info-circle me-1"></i> Loại mô hình: <strong>${result.model_type || 'Mô hình gần nhất'}</strong></span>
                    <span><i class="fas fa-folder me-1"></i> Thể loại: <strong>${result.model_category || 'general'}</strong></span>
                    <span><i class="fas fa-clock me-1"></i> Thời gian xử lý: <strong>${result.processing_time || '0.00'}s</strong></span>
                </div>
            </div>
        `;
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    

});

