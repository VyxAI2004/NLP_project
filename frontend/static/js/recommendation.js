// Wait for the DOM to be fully loaded
$(document).ready(function() {

    // --- Cache DOM Element Selectors ---
    const methodRadios = $('input[name="recommendation_method"]');
    const inputSections = $('.input-section');
    const clearInputButtons = $('.clear-input-btn');
    const getRecommendationsButton = $('#get-recommendations');
    const recommendationsContainer = $('#recommendations-container');
    const resultsViewButtons = $('.results .btn-group .btn[data-view]'); // More specific selector
    const clearResultsButton = $('#clear-results-btn'); // Assuming this is the correct ID in your final HTML
    const darkModeToggle = $('#dark-mode-toggle');
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));

    // --- State Variables ---
    let lastResults = []; // Store the last fetched results
    let currentView = 'card'; // Default view ('card' or 'list')

    // --- Core Functions ---

    /**
     * Switches the visible input section based on the selected recommendation method.
     */
    function switchInputSection() {
        const selectedMethod = $('input[name="recommendation_method"]:checked').val();
        inputSections.removeClass('active'); // Hide all sections
        $(`#input-${selectedMethod}`).addClass('active'); // Show the relevant section
        console.log(`Switched to input section for: ${selectedMethod}`);
    }

    /**
     * Clears the input fields targeted by a specific clear button.
     * @param {jQuery.Event} event - The click event object.
     */
    function clearInputFields(event) {
        const targets = $(event.currentTarget).data('target'); // Get target input selectors (e.g., "#cb-movie-input")
        if (targets) {
            try {
                $(targets).val(''); // Clear the value of the target inputs/textareas
                console.log(`Cleared input fields: ${targets}`);
            } catch (e) {
                console.error(`Error clearing fields with selector "${targets}":`, e);
            }
        }
    }

    /**
     * Fetches recommendations from the backend based on user input.
     */
    function fetchRecommendations() {
        const selectedMethod = $('input[name="recommendation_method"]:checked').val();
        let inputData = {};
        const activeSection = $(`.input-section.active`); // Get the currently visible input section

        // Collect data specifically from the active section
        if (selectedMethod === 'content-based') {
            inputData.movie_description = activeSection.find('#cb-movie-input').val().trim();
            if (!inputData.movie_description) {
                Swal.fire('Thiếu thông tin', 'Vui lòng nhập tên phim hoặc mô tả thể loại.', 'warning');
                return;
            }
        } else if (selectedMethod === 'collaborative') {
            inputData.user_id = activeSection.find('#cf-user-id').val().trim();
            if (!inputData.user_id) {
                Swal.fire('Thiếu thông tin', 'Vui lòng nhập User ID.', 'warning');
                return;
            }
        } else if (selectedMethod === 'context-aware') {
            inputData.location = activeSection.find('#ca-location').val().trim();
            inputData.time = activeSection.find('#ca-time').val().trim(); // Time is optional
            if (!inputData.location) {
                Swal.fire('Thiếu thông tin', 'Vui lòng nhập vị trí của bạn.', 'warning');
                return;
            }
        } else {
            console.error("Invalid recommendation method selected:", selectedMethod);
            Swal.fire('Lỗi', 'Phương pháp đề xuất không hợp lệ.', 'error');
            return;
        }

        console.log(`Fetching recommendations for method "${selectedMethod}" with data:`, inputData);

        // Display loading indicator
        showLoadingState();

        // --- !!! AJAX Call Placeholder !!! ---
        // Replace the following setTimeout with your actual AJAX call using $.ajax or fetch
        // Example using fetch:
        /*
        fetch('/api/recommend', { // Replace with your actual API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any other headers like CSRF tokens if needed
            },
            body: JSON.stringify({ method: selectedMethod, data: inputData })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Recommendations received:", data);
            lastResults = data.recommendations || []; // Adjust based on your API response structure
            renderRecommendations(lastResults, currentView);
            clearResultsButton.prop('disabled', lastResults.length === 0);
        })
        .catch(error => {
            console.error('Error fetching recommendations:', error);
            Swal.fire('Lỗi', 'Không thể lấy đề xuất từ máy chủ. Vui lòng thử lại.', 'error');
            renderEmptyState("Đã xảy ra lỗi khi tải đề xuất."); // Show error state
            clearResultsButton.prop('disabled', true);
        });
        */

        // --- Using setTimeout for Demonstration ---
        setTimeout(() => {
            // Generate fake results based on method for demo
            let fakeResults = [];
             if (selectedMethod === 'context-aware') {
                 fakeResults = [
                     { title: "Rạp Galaxy Nguyễn Du", description: "Địa chỉ: 116 Nguyễn Du, Quận 1. Gần vị trí của bạn.", image: "https://via.placeholder.com/150/ffcc00/000000?text=Rạp+1", type: "cinema" },
                     { title: "Rạp BHD Star Bitexco", description: "Địa chỉ: Tòa nhà Bitexco, Quận 1. Có suất chiếu tối nay.", image: "https://via.placeholder.com/150/ff9933/000000?text=Rạp+2", type: "cinema" },
                     { title: "Rạp CGV Vincom Thủ Đức", description: "Địa chỉ: Vincom Thủ Đức. Nhiều lựa chọn phim.", image: "https://via.placeholder.com/150/ff6600/000000?text=Rạp+3", type: "cinema" }
                 ];
             } else { // Content-Based or Collaborative
                 fakeResults = [
                    { title: "Phim Đề Xuất A", description: "Mô tả ngắn gọn về phim A. Thể loại: Hành động.", image: "https://via.placeholder.com/150/007bff/ffffff?text=Phim+A", type: "movie" },
                    { title: "Phim Đề Xuất B", description: "Mô tả ngắn gọn về phim B. Thể loại: Hài hước.", image: "https://via.placeholder.com/150/28a745/ffffff?text=Phim+B", type: "movie" },
                    { title: "Phim Đề Xuất C", description: "Mô tả ngắn gọn về phim C. Thể loại: Viễn tưởng.", image: "https://via.placeholder.com/150/ffc107/000000?text=Phim+C", type: "movie" }
                 ];
             }
            lastResults = fakeResults;
            renderRecommendations(lastResults, currentView);
             clearResultsButton.prop('disabled', lastResults.length === 0);
         }, 1500); // Simulate network delay
        // --- End Demonstration Code ---
    }

    /**
     * Displays a loading spinner in the results container.
     */
    function showLoadingState() {
        recommendationsContainer.html(`
            <div class="text-center my-5 py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Đang tìm kiếm đề xuất...</p>
            </div>
        `);
    }

    /**
     * Renders the empty state message in the results container.
     * @param {string} message - Optional message to display.
     * @param {string} subMessage - Optional sub-message.
     */
    function renderEmptyState(message = "Không tìm thấy đề xuất phù hợp", subMessage = "Vui lòng thử lại với thông tin khác.") {
         recommendationsContainer.html(`
            <div class="empty-state text-center my-5 py-5">
                <i class="fas fa-box-open fa-4x mb-4 text-muted"></i>
                <h4 class="text-muted">${message}</h4>
                <p class="text-muted small">${subMessage}</p>
            </div>
        `);
    }

    /**
     * Renders the recommendation results in the specified view format.
     * @param {Array} results - Array of recommendation objects.
     * @param {string} viewType - 'card' or 'list'.
     */
    function renderRecommendations(results, viewType) {
        recommendationsContainer.empty(); // Clear previous results

        if (!results || results.length === 0) {
            renderEmptyState(); // Show default empty state
            return;
        }

        // Add appropriate classes for card/list view layout
        recommendationsContainer.removeClass('row row-cols-1 row-cols-md-2 g-4 list-group list-group-flush'); // Clear previous layout classes
        if (viewType === 'card') {
            recommendationsContainer.addClass('row row-cols-1 row-cols-md-2 g-4');
        } else {
            recommendationsContainer.addClass('list-group list-group-flush');
        }

        // Build HTML for each item
        results.forEach(item => {
            let itemHtml = '';
            const detailButton = `<button class="btn btn-sm btn-outline-primary mt-2 show-detail-btn">Chi tiết</button>`; // Example detail button class

            if (viewType === 'card') {
                itemHtml = `
                    <div class="col">
                        <div class="card h-100 recommendation-item">
                            ${item.image ? `<img src="${item.image}" class="card-img-top" alt="${item.title || 'Recommendation Image'}" style="max-height: 180px; object-fit: cover;">` : ''}
                            <div class="card-body d-flex flex-column">
                                <h6 class="card-title">${item.title || 'Đề xuất'}</h6>
                                <p class="card-text small flex-grow-1">${item.description || 'Không có mô tả.'}</p>
                                ${detailButton}
                            </div>
                            <!-- Optional Footer -->
                        </div>
                    </div>
                `;
            } else { // viewType === 'list'
                itemHtml = `
                    <li class="list-group-item d-flex justify-content-between align-items-start recommendation-item">
                        ${item.image ? `<img src="${item.image}" alt="${item.title || 'Recommendation Image'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">` : ''}
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">${item.title || 'Đề xuất'}</div>
                            <p class="mb-1 small">${item.description || 'Không có mô tả.'}</p>
                            ${detailButton}
                        </div>
                        <!-- Optional: Badge, etc. -->
                    </li>
                `;
            }
            recommendationsContainer.append(itemHtml);
        });
        // Add event listener for dynamically created detail buttons (if needed)
        $('.show-detail-btn').on('click', function() {
            // Find the parent item data or index if needed
            // const itemTitle = $(this).closest('.recommendation-item').find('.card-title, .fw-bold').text();
            Swal.fire('Chi tiết', `Bạn đã nhấp vào nút chi tiết. Logic chi tiết sẽ được thêm vào đây.`, 'info');
        });
    }

    /**
     * Handles clicks on the view toggle buttons.
     * @param {jQuery.Event} event - The click event object.
     */
    function handleViewToggle(event) {
        currentView = $(event.currentTarget).data('view');
        resultsViewButtons.removeClass('active');
        $(event.currentTarget).addClass('active');
        renderRecommendations(lastResults, currentView); // Re-render with the current results and new view
        console.log(`Switched results view to: ${currentView}`);
    }

    /**
     * Clears the displayed results and resets the state.
     */
    function clearDisplayedResults() {
        lastResults = [];
        renderRecommendations(lastResults, currentView); // Render empty state
        clearResultsButton.prop('disabled', true);
        console.log("Cleared recommendation results.");
    }

    /**
     * Initializes Bootstrap tooltips.
     */
    function initializeTooltips() {
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        console.log("Tooltips initialized.");
    }

    /**
     * Initializes dark mode based on localStorage and handles toggle clicks.
     */
    function initializeDarkMode() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            $('body').addClass('dark-mode');
             darkModeToggle.find('i').removeClass('fa-moon').addClass('fa-sun');
        }

         darkModeToggle.on('click', function() {
            $('body').toggleClass('dark-mode');
            const icon = $(this).find('i');
            const isDarkMode = $('body').hasClass('dark-mode');

            if (isDarkMode) {
                icon.removeClass('fa-moon').addClass('fa-sun');
                localStorage.setItem('darkMode', 'enabled');
                console.log("Dark mode enabled");
            } else {
                icon.removeClass('fa-sun').addClass('fa-moon');
                localStorage.setItem('darkMode', 'disabled');
                console.log("Dark mode disabled");
            }
        });
    }


    // --- Attach Event Listeners ---
    methodRadios.on('change', switchInputSection);
    clearInputButtons.on('click', clearInputFields);
    getRecommendationsButton.on('click', fetchRecommendations);
    resultsViewButtons.on('click', handleViewToggle);
    clearResultsButton.on('click', clearDisplayedResults);


    // --- Initial Page Setup ---
    switchInputSection(); // Show the correct input section initially
    initializeTooltips();
    initializeDarkMode();
    console.log("Recommendation page script loaded and initialized.");

}); // End $(document).ready