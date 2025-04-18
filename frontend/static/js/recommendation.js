// Wait for the DOM to be fully loaded
$(document).ready(function() {

    // --- Cache DOM Element Selectors ---
    const methodRadios = $('input[name="recommendation_method"]');
    const inputSections = $('.input-section');
    const clearInputButtons = $('.clear-input-btn');
    const getRecommendationsButton = $('#get-recommendations');
    const resultsContainer = $('#results-container');
    const clearResultsButton = $('#clear-results-btn');
    const downloadResultsBtn = $('#download-results-btn');
    const darkModeToggle = $('#dark-mode-toggle');
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const moviesContainer = $('#movies-to-rate');

    // --- State Variables ---
    let userRatings = {}; // Store user ratings for movies
    let movieMetadata = {}; // Will be loaded from the backend

    // --- Initialize Page ---
    loadMoviesFromBackend();
    initializeUIHandlers();

    /**
     * Load movies from the backend instead of using hardcoded data
     */
    function loadMoviesFromBackend() {
        // Show loading indicator
        moviesContainer.html('<div class="text-center py-4"><div class="spinner-border text-primary"></div><p class="mt-3">Đang tải danh sách phim...</p></div>');
        
        // Fetch movies from the backend
        fetch('/api/movies/list')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Update movie metadata with server data
                    data.movies.forEach(movie => {
                        movieMetadata[movie.Id] = {
                            id: movie.Id,
                            title: movie.Title,
                            genres: parseGenres(movie.Genres),
                            voteAverage: movie.Vote_Average
                        };
                    });
                    
                    // Render movie cards
                    renderMovieCards(data.movies);
                    
                    // Add Clear All Ratings button above movies container
                    if (!$('#clear-all-ratings').length) {
                        moviesContainer.before(`
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0">Đánh giá phim</h5>
                                <button id="clear-all-ratings" class="btn btn-sm btn-outline-danger" disabled>
                                    <i class="fas fa-times me-1"></i> Xóa tất cả đánh giá
                                </button>
                            </div>
                        `);
                        
                        // Add event handler for clear all ratings button
                        $('#clear-all-ratings').on('click', clearAllRatings);
                    }
                    
                    // Initialize star ratings
                    initializeStarRatings();
                    
                    console.log(`Loaded ${data.movies.length} movies from backend`);
                } else {
                    // Show error message
                    moviesContainer.html(`<div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Không thể tải danh sách phim: ${data.message || 'Lỗi không xác định'}
                    </div>`);
                }
            })
            .catch(error => {
                console.error('Error loading movies:', error);
                
                // Use the hardcoded movies as fallback
                moviesContainer.html(`<div class="alert alert-warning mb-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Không thể kết nối đến máy chủ. Đang sử dụng dữ liệu mẫu.
                </div>`);
                
                // If loading fails, use the hardcoded movies from the HTML
                // The star rating will be initialized by the existing code
                initializeStarRatings();
            });
    }
    
    /**
     * Parse genres from string format to array
     */
    function parseGenres(genresStr) {
        // Nếu là mảng thì trả về luôn
        if (Array.isArray(genresStr)) {
            return genresStr;
        }
        
        // Nếu là chuỗi thì thử parse thành mảng
        if (typeof genresStr === 'string') {
            try {
                // Kiểm tra nếu chuỗi có dạng mảng
                if (genresStr.startsWith('[') && genresStr.endsWith(']')) {
                    // Thử chuyển từ chuỗi sang mảng
                    const cleanedGenres = genresStr.replace(/'/g, '"');
                    return JSON.parse(cleanedGenres);
                }
                
                // Nếu là chuỗi ngăn cách bởi dấu phẩy
                if (genresStr.includes(',')) {
                    return genresStr.split(',').map(g => g.trim());
                }
                
                // Nếu là một từ
                return [genresStr.trim()];
            } catch (e) {
                console.error('Lỗi parse thể loại:', e);
                // Nếu không parse được, trả về dạng mảng với một phần tử
                return [genresStr.trim()];
            }
        }
        
        // Nếu không có thể loại
        return ['Không có thể loại'];
    }
    
    /**
     * Render movie cards for rating
     */
    function renderMovieCards(movies) {
        if (!movies || movies.length === 0) {
            moviesContainer.html('<div class="alert alert-warning">Không có phim nào để đánh giá</div>');
            return;
        }
        
        const scrollContainerHeight = 300; 
        
        // Create a wrapper with movies-container class for CSS targeting
        let html = `<div class="movies-container">`;
        html += `<div class="movies-scroll-container" style="max-height: ${scrollContainerHeight}px; overflow-y: auto; padding-right: 10px;">`;
        html += '<div class="row g-3">'; // Sử dụng g-3 để có spacing đồng đều
        
        movies.forEach(movie => {
            const genres = parseGenres(movie.Genres);
            
            // Limit genres to first 3 to avoid overflow
            const displayGenres = genres.slice(0, 3);
            if (genres.length > 3) {
                displayGenres.push('...');
            }
            
            const genreText = displayGenres.join(', ');
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card movie-rating-card">
                        <div class="card-body">
                            <h6 class="card-title" title="${movie.Title}">${movie.Title}</h6>
                            <p class="card-text small text-muted" title="${genres.join(', ')}">Thể loại: ${genreText}</p>
                            <div class="star-rating" data-movie-id="${movie.Id}">
                                <i class="far fa-star" data-rating="1"></i>
                                <i class="far fa-star" data-rating="2"></i>
                                <i class="far fa-star" data-rating="3"></i>
                                <i class="far fa-star" data-rating="4"></i>
                                <i class="far fa-star" data-rating="5"></i>
                                <span class="ms-2 rating-text">Chưa đánh giá</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>'; // Close row
        html += '</div>'; // Close scroll container
        
        
        moviesContainer.html(html);
        
        // Initialize star ratings
        initializeStarRatings();
        
        // Clear ratings button
        $('#clear-ratings-btn').on('click', function() {
            clearAllRatings();
        });
    }

    /**
     * Initialize star rating functionality
     */
    function initializeStarRatings() {
        // Handle star hover and click events
        $('.star-rating i').hover(
            function() {
                // Hover in
                const rating = $(this).data('rating');
                const stars = $(this).parent().find('i');
                
                // Fill in stars up to the hovered one
                stars.each(function(index) {
                    if (index < rating) {
                        $(this).removeClass('far').addClass('fas');
                    } else {
                        $(this).removeClass('fas').addClass('far');
                    }
                });
            },
            function() {
                // Hover out - reset to current rating
                const starContainer = $(this).parent();
                const movieId = starContainer.data('movie-id');
                const stars = starContainer.find('i');
                
                // Get user rating for this movie (if any)
                const userRating = userRatings[movieId] || 0;
                
                // Reset stars based on current rating
                stars.each(function(index) {
                    if (index < userRating) {
                        $(this).removeClass('far').addClass('fas');
                    } else {
                        $(this).removeClass('fas').addClass('far');
                    }
                });
            }
        );

        // Handle star click
        $('.star-rating i').click(function() {
            const rating = $(this).data('rating');
            const starContainer = $(this).parent();
            const movieId = starContainer.data('movie-id');
            const ratingText = starContainer.find('.rating-text');
            
            // Save the rating
            userRatings[movieId] = rating;
            
            // Update the UI
            starContainer.find('i').each(function(index) {
                if (index < rating) {
                    $(this).removeClass('far').addClass('fas');
                } else {
                    $(this).removeClass('fas').addClass('far');
                }
            });
            
            // Update rating text
            ratingText.text(getRatingText(rating));
            
            // Enable the recommend button if there's at least one rating
            if (Object.keys(userRatings).length > 0) {
                getRecommendationsButton.prop('disabled', false);
                $('#clear-all-ratings').prop('disabled', false);
            }
            
            console.log(`Movie ID: ${movieId}, Rating: ${rating}`);
        });
    }

    /**
     * Clear all movie ratings
     */
    function clearAllRatings() {
        // Reset all stars to empty
        $('.star-rating i').removeClass('fas').addClass('far');
        
        // Reset all rating text
        $('.rating-text').text('Chưa đánh giá');
        
        // Clear the ratings object
        userRatings = {};
        
        // Disable buttons that depend on ratings
        getRecommendationsButton.prop('disabled', true);
        $('#clear-all-ratings').prop('disabled', true);
        
        console.log('Cleared all movie ratings');
    }

    /**
     * Get rating display text based on rating value
     */
    function getRatingText(rating) {
        switch(rating) {
            case 1: return "Rất không thích";
            case 2: return "Không thích";
            case 3: return "Bình thường";
            case 4: return "Thích";
            case 5: return "Rất thích";
            default: return "Chưa đánh giá";
        }
    }

    /**
     * Initialize UI handlers for form elements
     */
    function initializeUIHandlers() {
        // Method selection radio buttons
        methodRadios.on('change', function() {
            switchInputSection();
        });

        // Clear input buttons
        clearInputButtons.on('click', function(e) {
            const target = $(this).data('target');
            $(target).val('');
        });

        // Get recommendations button
        getRecommendationsButton.on('click', function() {
            fetchRecommendations();
        });

        // Clear results button
        clearResultsButton.on('click', function() {
            clearResults();
        });

        // Toggle between compact and expanded view
        resultsContainer.on('click', '.toggle-view-btn', function() {
            const container = $('.recommendation-items');
            const isCompact = container.hasClass('compact-view');
            
            if (isCompact) {
                // Expand view
                container.removeClass('compact-view').css('max-height', 'none');
                $(this).html('<i class="fas fa-compress me-1"></i> Thu gọn danh sách');
            } else {
                // Compact view
                container.addClass('compact-view').css('max-height', '500px');
                $(this).html('<i class="fas fa-expand me-1"></i> Xem tất cả');
            }
        });
    }

    /**
     * Switch between input sections based on selected method
     */
    function switchInputSection() {
        const selectedMethod = $('input[name="recommendation_method"]:checked').val();
        inputSections.removeClass('active');
        $(`#input-${selectedMethod}`).addClass('active');
    }

    /**
     * Fetch recommendations based on selected method and inputs
     */
    function fetchRecommendations() {
        const selectedMethod = $('input[name="recommendation_method"]:checked').val();
        let requestData = {};
        let errorMessage = null;

        // Prepare data based on the selected method
        if (selectedMethod === 'content-based') {
            // Check if user has rated movies
            const ratedMovies = Object.keys(userRatings).length;
            if (ratedMovies === 0) {
                errorMessage = "Vui lòng đánh giá ít nhất một bộ phim để nhận đề xuất nội dung tương tự.";
            }
            
            requestData = {
                method: 'content-based',
                user_ratings: userRatings
            };
        } else if (selectedMethod === 'collaborative') {
            const userId = $('#cf-user-id').val().trim();
            if (!userId) {
                errorMessage = "Vui lòng nhập ID người dùng.";
            }
            
            requestData = {
                method: 'collaborative',
                user_id: userId
            };
        } else if (selectedMethod === 'context-aware') {
            const location = $('#ca-location').val().trim();
            if (!location) {
                errorMessage = "Vui lòng nhập vị trí của bạn.";
            }
            
            requestData = {
                method: 'context-aware',
                location: location,
                time: $('#ca-time').val().trim()
            };
        }

        // Show error if needed
        if (errorMessage) {
            Swal.fire({
                title: 'Thiếu thông tin',
                text: errorMessage,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Show loading state
        showLoadingState();

        // Call the backend API
        fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // If the response uses 'recommendations' (content-based endpoint), convert to 'items' format
                if (data.recommendations && !data.items) {
                    data.items = data.recommendations.map(rec => ({
                        id: rec.movie_id,
                        title: rec.title,
                        genres: rec.genres,
                        predictedRating: rec.predicted_rating,
                        score: rec.score
                    }));
                }
                
                displayResults(data);
            } else {
                // Show error
                resultsContainer.html(`
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${data.message || 'Có lỗi xảy ra khi tạo đề xuất'}
                    </div>
                `);
            }
        })
        .catch(error => {
            console.error('Error fetching recommendations:', error);
            resultsContainer.html(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Lỗi kết nối: Không thể kết nối đến máy chủ để lấy đề xuất
                </div>
            `);
        })
    }

    /**
     * Show loading state in results container
     */
    function showLoadingState() {
        resultsContainer.html(`
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang xử lý...</span>
                </div>
                <h5 class="mt-3 text-muted">Đang tạo đề xuất...</h5>
                <p class="text-muted small">Vui lòng đợi trong giây lát</p>
            </div>
        `);
    }

    /**
     * Đảm bảo tất cả card phim đề xuất có chiều cao đồng nhất
     */
    function ensureConsistentCardHeight() {
        // Cố định chiều cao cho tất cả card
        $('.recommendation-card').css('height', '450px');
        $('.recommendation-item').css('height', '450px');
        
        // Đảm bảo card body sử dụng hết không gian
        $('.recommendation-card .card-body').css('height', '100%');
        
        // Log kích thước để debug
        console.log('Đã thiết lập chiều cao card đề xuất: 450px');
    }

    /**
     * Display recommendation results
     */
    function displayResults(data) {
        if (!data.success && !data.status) {
            resultsContainer.html(`
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${data.message || 'Có lỗi xảy ra khi tạo đề xuất'}
                </div>
            `);
            clearResultsButton.prop('disabled', false);
            downloadResultsBtn.prop('disabled', true);
            return;
        }
        
        // Enable buttons
        clearResultsButton.prop('disabled', false);
        downloadResultsBtn.prop('disabled', false);
        
        // Build results HTML
        let html = `
            <div class="recommendation-results">
                <div class="alert alert-success mb-4">
                    <i class="fas fa-check-circle me-2"></i>
                    ${data.message || 'Đã tạo đề xuất thành công!'}
                </div>
        `;
        
        if (data.recommendations && data.recommendations.length > 0) {
            html += `<div class="recommendation-items">`;
            
            // Tạo card cho mỗi phim đề xuất
            data.recommendations.forEach((movie, index) => {
                const rank = index + 1;
                let genres = [];
                
                // Xử lý thể loại phim
                if (movie.genres) {
                    genres = parseGenres(movie.genres);
                }
                
                // Tính toán màu dựa trên độ phù hợp
                const matchScore = parseFloat(movie.match_score) || 0;
                let matchColor = '';
                let degValue = Math.round(matchScore * 3.6); // Chuyển % thành độ (360 độ = 100%)
                
                if (matchScore >= 80) {
                    matchColor = '#198754'; // success - xanh lá
                } else if (matchScore >= 60) {
                    matchColor = '#fd7e14'; // warning - cam
                } else {
                    matchColor = '#dc3545'; // danger - đỏ
                }
                
                // Tạo HTML cho card đơn giản
                html += `
                    <div class="recommendation-item">
                        <div class="card recommendation-card">
                            <div class="card-body">
                                <h5 class="card-title">${movie.title || 'Không có tiêu đề'}</h5>
                                
                                <div class="recommendation-rank">
                                    <span class="badge bg-primary">${rank}</span>
                                </div>
                                
                                <div class="genres">
                                    ${genres.map(genre => `<span class="badge bg-secondary me-1">${genre}</span>`).join('')}
                                </div>
                                
                                <div class="overview">
                                    <div class="overview-title">Tóm tắt:</div>
                                    <div class="overview-text">${movie.overview || 'Không có mô tả.'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        } else {
            html += `
                <div class="alert alert-warning">
                    <i class="fas fa-info-circle me-2"></i>
                    Không tìm thấy đề xuất phù hợp.
                </div>
            `;
        }
        
        // Thêm thông tin về phương pháp đề xuất
        if (data.method) {
            html += `
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Phương pháp đề xuất: <strong>${getMethodDisplayName(data.method)}</strong>
                    </small>
                </div>
            `;
        }
        
        html += `</div>`;
        
        // Hiển thị kết quả
        resultsContainer.html(html);
        
        // Đảm bảo kích thước card đồng nhất sau khi render
        setTimeout(ensureConsistentCardHeight, 100);
        
        // Cuộn đến khu vực kết quả
        $('html, body').animate({
            scrollTop: resultsContainer.offset().top - 100
        }, 500);
    }
    
    /**
     * Get display name for recommendation method
     */
    function getMethodDisplayName(method) {
        switch (method) {
            case 'content-based': return 'Đề xuất dựa trên nội dung';
            case 'collaborative': return 'Lọc cộng tác';
            case 'context-aware': return 'Đề xuất theo ngữ cảnh';
            default: return method;
        }
    }
    
    /**
     * Clear results
     */
    function clearResults() {
        resultsContainer.html(`
            <div class="empty-state">
                <i class="fas fa-chart-line empty-icon"></i>
                <p class="text-muted">Các kết quả xử lý sẽ hiển thị ở đây...</p>
                <small>Chọn các tùy chọn xử lý và nhấn nút "Xử lý" để bắt đầu</small>
            </div>
        `);
        
        clearResultsButton.prop('disabled', true);
        downloadResultsBtn.prop('disabled', true);
    }
    
    // Initialize by showing the correct input section
    switchInputSection();

    // Initialize tooltips if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    console.log("Recommendation page script loaded and initialized.");

}); // End $(document).ready