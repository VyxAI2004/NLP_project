/**
 * Chatbot.js - JavaScript for AI Chatbot functionality
 * NLP Project - Enhanced AIChat UI
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Core UI elements (sidebar, input resize, focus)
    initCoreUI();

    // Initialize Chat Functionality (sending messages, bot response simulation)
    initChat();

    // Initialize Dark Mode Toggle
    initDarkMode();

    // Initialize Animations and Visual Effects (AOS, Particles, Ripple)
    initAnimationsAndEffects();

    // Initialize Welcome Screen Features (Toast, Get Started Button, Suggestions)
    initWelcomeFeatures();

    // Initialize Advanced Chat Features (from the separate JS block)
    initAdvancedChatFeatures();

    // Initialize the Clear History feature
    initClearHistory();

    // Initialize the Collapsed Sidebar feature
    initCollapsedSidebar();

    // Initialize Context Switcher
    initContextSwitcher();

    console.log("Chatbot UI Initialized");
});

// --- Initialization Functions ---

function initCoreUI() {
    // Sidebar Toggle Logic (using .active class as it's more robustly implemented)
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.aichat-sidebar');
    const container = document.querySelector('.aichat-container'); // Needed for overlay
    const newChat = document.querySelector('.aichat-new-chat')
    const sectionChat = document.querySelector('.aichat-sidebar-section')

    if (menuToggle && sidebar && container) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active'); // Toggle the .active class
            
            // Thêm chức năng thu gọn navbar khi nhấn nút menu-toggle
            sidebar.classList.toggle('collapsed');
            container.classList.toggle('sidebar-collapsed');
            this.classList.toggle('active'); // Toggle active state on button itself
            
            if(sidebar.classList.contains('active')) {
                newChat.classList.add('hide')
                sectionChat.classList.add('hide')
            } else {
                newChat.classList.remove('hide')
                sectionChat.classList.remove('hide')
            }
           
            // Handle overlay on mobile
            if (window.innerWidth < 768) {
                if (sidebar.classList.contains('active')) {
                    container.classList.add('overlay-active');
                } else {
                    container.classList.remove('overlay-active');
                }
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const isMobile = window.innerWidth < 768;
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuToggle = menuToggle.contains(event.target);

            if (isMobile && sidebar.classList.contains('active') && !isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('active');
                sidebar.classList.remove('collapsed');
                container.classList.remove('sidebar-collapsed');
                menuToggle.classList.remove('active');
                container.classList.remove('overlay-active');
            }
        });

        // Handle resize events
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                container.classList.remove('overlay-active'); // Remove overlay on desktop
                // Optional: Decide if sidebar should close on resize for medium screens
                // if (sidebar.classList.contains('active') && window.innerWidth < 1200) {
                //     sidebar.classList.remove('active');
                //     menuToggle.classList.remove('active');
                // }
            } else {
                // Re-apply overlay if needed on mobile resize
                if (sidebar.classList.contains('active')) {
                    container.classList.add('overlay-active');
                } else {
                    container.classList.remove('overlay-active');
                }
            }
        });
    } else {
        console.warn("Sidebar toggle elements not found.");
    }

    // Auto-resize textarea
    const textarea = document.getElementById('user-input');
    if (textarea) {
        textarea.addEventListener('input', autoResizeTextarea);
        // Initial resize check in case of pre-filled content
        autoResizeTextarea.call(textarea);
    }

    // Input focus effect
    const inputWrapper = document.querySelector('.aichat-input-wrapper');
    if (textarea && inputWrapper) {
        textarea.addEventListener('focus', () => inputWrapper.classList.add('input-focused'));
        textarea.addEventListener('blur', () => inputWrapper.classList.remove('input-focused'));
    }
}

function initChat() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatForm || !userInput || !sendButton || !chatMessages) {
        console.error("Chat form elements not found. Chat functionality disabled.");
        return;
    }

    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSendMessage();
    });

    // Handle send button click
    sendButton.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent form submission if type="submit"
        handleSendMessage();
    });

     // Focus input on page load (after potential animations)
     setTimeout(() => userInput.focus(), 500);
}

function initDarkMode() {
    const toggleButton = document.getElementById('dark-mode-toggle');
    if (!toggleButton) return;

    // Apply initial dark mode state
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        toggleButton.querySelector('i')?.classList.replace('fa-moon', 'fa-sun');
        updateParticlesColor(true); // Update particles for dark mode
    } else {
        updateParticlesColor(false); // Update particles for light mode
    }


    toggleButton.addEventListener('click', function() {
        document.body.classList.add('theme-transitioning');

        setTimeout(() => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            const icon = toggleButton.querySelector('i');

            if (isDarkMode) {
                icon?.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('darkMode', 'enabled');
                updateParticlesColor(true);
            } else {
                icon?.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('darkMode', 'disabled');
                updateParticlesColor(false);
            }

            // Remove transitioning class slightly after styles apply
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, 50);
        }, 10); // Short delay to allow transition class to take effect
    });
}

function initAnimationsAndEffects() {
    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init();
    } else {
        console.warn("AOS library not found.");
    }

    // Initialize Particles.js
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', { /* Particle config object from HTML */
            "particles": { /* ... copy the full config from your HTML ... */
                "number": {"value": 80,"density": {"enable": true,"value_area": 800}},
                "color": {"value": "#4285f4"}, // Initial color, will be updated by initDarkMode
                "shape": {"type": "circle","stroke": {"width": 0,"color": "#000000"}},
                "opacity": {"value": 0.5,"random": false},
                "size": {"value": 3,"random": true},
                "line_linked": {"enable": true,"distance": 150,"color": "#4285f4","opacity": 0.4,"width": 1}, // Initial color
                "move": {"enable": true,"speed": 2,"direction": "none","random": false,"straight": false,"out_mode": "out","bounce": false}
            },
            "interactivity": { /* ... copy the full config from your HTML ... */
                "detect_on": "canvas", "events": {"onhover": {"enable": true, "mode": "grab"}, "onclick": {"enable": true, "mode": "push"}, "resize": true},
                "modes": {"grab": {"distance": 140, "line_linked": {"opacity": 1}}, "push": {"particles_nb": 4}}
            },
            "retina_detect": true
        });
        // Ensure colors are set correctly based on initial dark mode state
        updateParticlesColor(document.body.classList.contains('dark-mode'));
    } else {
        console.warn("Particles.js library or target element not found.");
    }

    // Initialize Ripple Effect for buttons
    const rippleButtons = document.querySelectorAll('.ripple');
    rippleButtons.forEach(button => {
        button.addEventListener('click', createRipple);
        // Add position relative if not already set, required for absolute positioned ripple
        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        button.style.overflow = 'hidden'; // Ensure ripple stays within bounds
    });
}

function initWelcomeFeatures() {
    // Handle Welcome Toast
    const welcomeToast = document.getElementById('welcome-toast'); // Assuming toast exists in HTML
    const closeToastBtn = document.getElementById('close-toast'); // Assuming close button exists
    if (welcomeToast) {
        setTimeout(() => welcomeToast.classList.add('show'), 1000);
        setTimeout(() => welcomeToast.classList.remove('show'), 6000);
        if (closeToastBtn) {
            closeToastBtn.addEventListener('click', () => welcomeToast.classList.remove('show'));
        }
    }

    // Handle "Get Started" Button
    const getStartedBtn = document.querySelector('.get-started-btn'); // Assuming button exists
    const userInput = document.getElementById('user-input');
    if (getStartedBtn && userInput) {
        getStartedBtn.addEventListener('click', () => {
            userInput.focus();
            userInput.setAttribute('placeholder', 'Bạn muốn hỏi điều gì?');
            // Optional smooth scroll to input
            userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // Handle Suggestion Chips (Ensure these exist in your HTML structure)
    const suggestionChips = document.querySelectorAll('.suggestion-chip'); // Ensure class name matches
    if (suggestionChips.length > 0 && userInput) {
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', function() {
                userInput.value = this.textContent.trim();
                userInput.focus();
                // Trigger input event for auto-resize and potentially other listeners
                userInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

                // Optional: Add visual feedback
                this.classList.add('animate__animated', 'animate__pulse');
                setTimeout(() => this.classList.remove('animate__animated', 'animate__pulse'), 1000);
            });
        });
    } else if (!userInput) {
         console.warn("User input element not found for suggestion chips.");
    }
    // Note: The welcome screen itself is handled within sendMessage/addMessage
}

function initAdvancedChatFeatures() {
    // Initialize features from the more complex JS block if needed
    setupVoiceInput(); // Requires SpeechRecognition API
    initKeyboardShortcuts();
    initConversations(); // Requires localStorage implementation
    // Note: Suggestion cards from the complex block are handled by initWelcomeFeatures using .suggestion-chip
    animateWelcomeSection(); // Adds initial fade-in to welcome elements
}

function initClearHistory() {
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            // Show confirmation dialog
            Swal.fire({
                title: 'Xóa lịch sử trò chuyện?',
                text: 'Bạn có chắc chắn muốn xóa tất cả lịch sử trò chuyện? Hành động này không thể hoàn tác.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Xác nhận xóa',
                cancelButtonText: 'Hủy bỏ'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Clear conversation history from localStorage
                    localStorage.removeItem('chatHistory');
                    localStorage.removeItem('conversations');
                    
                    // Clear conversation list in the sidebar
                    const conversationList = document.querySelector('.aichat-conversation-list');
                    if (conversationList) {
                        // Keep only the first item (active conversation)
                        const activeConversation = conversationList.querySelector('.aichat-conversation-item.active');
                        if (activeConversation) {
                            const clonedActive = activeConversation.cloneNode(true);
                            conversationList.innerHTML = '';
                            conversationList.appendChild(clonedActive);
                        } else {
                            conversationList.innerHTML = '';
                        }
                    }
                    
                    // Clear the current chat messages
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        // Keep only the welcome screen
                        const welcomeScreen = chatMessages.querySelector('.welcome-screen');
                        if (welcomeScreen) {
                            chatMessages.innerHTML = '';
                            chatMessages.appendChild(welcomeScreen);
                        } else {
                            chatMessages.innerHTML = '';
                            // If welcome screen was removed, we might want to recreate it
                            startNewChat();
                        }
                    }
                    
                    // Show success notification
                    showToast('Đã xóa lịch sử trò chuyện', 'success');
                }
            });
        });
    }
}

function initCollapsedSidebar() {
    const collapseSidebarBtn = document.getElementById('collapse-sidebar-btn');
    const sidebar = document.querySelector('.aichat-sidebar');
    const container = document.querySelector('.aichat-container');
    
    if (collapseSidebarBtn && sidebar && container) {
        // Check if sidebar state is stored in localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            container.classList.add('sidebar-collapsed');
            collapseSidebarBtn.querySelector('i').classList.replace('fa-chevron-left', 'fa-chevron-right');
        }
        
        collapseSidebarBtn.addEventListener('click', function() {
            const isNowCollapsed = sidebar.classList.toggle('collapsed');
            container.classList.toggle('sidebar-collapsed', isNowCollapsed);
            
            // Update icon
            const icon = this.querySelector('i');
            if (isNowCollapsed) {
                icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                localStorage.setItem('sidebarCollapsed', 'true');
            } else {
                icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                localStorage.setItem('sidebarCollapsed', 'false');
            }
        });
    }
}

// --- Core Chat Logic ---

function handleSendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();

    if (message === '') return;

    removeWelcomeScreen(); // Remove welcome message on first send
    addMessage('user', message);

    userInput.value = '';
    autoResizeTextarea.call(userInput); // Reset height after clearing

    showTypingIndicator();

    // Lấy conversation_id từ localStorage hoặc tạo mới nếu chưa có
    let conversationId = localStorage.getItem('current_conversation_id');
    
    // Make an API call to our chatbot backend
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            message: message,
            conversation_id: conversationId 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        hideTypingIndicator();
        if (data.error) {
            // Handle error from API
            addMessage('bot', 'Xin lỗi, đã xảy ra lỗi: ' + data.error);
        } else {
            // Handle successful response
            addMessage('bot', data.reply);
            
            // Lưu conversation_id từ phản hồi
            if (data.conversation_id) {
                localStorage.setItem('current_conversation_id', data.conversation_id);
            }
            
            addToHistory(message, data.reply); // Add to conversation history
        }
    })
    .catch(error => {
        hideTypingIndicator();
        console.error('Error:', error);
        addMessage('bot', 'Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau.');
    });
}

function addMessage(sender, text, isHTML = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    // Remove welcome screen if it's still somehow visible
    removeWelcomeScreen();

    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender === 'user' ? 'aichat-user-message' : 'aichat-bot-message');
    // Add animation class from animate.css (ensure library is linked)
    messageDiv.classList.add('animate__animated', 'animate__fadeInUp');

    if (sender === 'user') {
        const p = document.createElement('p');
        p.textContent = text; // Use textContent for user input to prevent XSS
        messageDiv.appendChild(p);
    } else {
        // Bot message structure with badge and content area
        const botBadge = document.createElement('div');
        botBadge.className = 'aichat-bot-badge';
        botBadge.innerHTML = '<div class="aichat-logo"></div>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'aichat-message-content';
        
        // Hiển thị văn bản dạng thường không xử lý markdown
        const p = document.createElement('p');
        
        if (isHTML) {
            // Nếu đánh dấu là HTML, chúng ta vẫn giữ nguyên nội dung
            p.innerHTML = text;
        } else {
            // Trường hợp bình thường, sử dụng textContent để tránh XSS
            p.textContent = text;
        }
        
        contentDiv.appendChild(p);
        
        messageDiv.appendChild(botBadge);
        messageDiv.appendChild(contentDiv);
        
        // Thêm action buttons sau một khoảng thời gian ngắn
        setTimeout(() => {
            createAndSetupActionButtons(contentDiv);
        }, 300);
    }

    chatMessages.appendChild(messageDiv);
    scrollToBottom(chatMessages);
}

// Function to generate a demo response (unchanged, but ready to use markdown)
function generateDemoResponse(userMessage) {
    // Simple response logic from the original JS block
    let response;
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = 'Xin chào! Tôi là trợ lý AI VYxAI. Tôi có thể giúp gì cho bạn?';
    } else if (lowerMessage.includes('chatbot') || lowerMessage.includes('tạo')) {
        response = `
            <p>Để xây dựng một chatbot AI, bạn có thể theo các bước sau:</p>
            <ol>
                <li><strong>Chọn nền tảng:</strong> Dialogflow, MS Bot Framework, OpenAI API...</li>
                <li><strong>Thiết kế luồng:</strong> Xác định ý định & phản hồi.</li>
                <li><strong>Xây dựng tri thức:</strong> Dữ liệu & câu trả lời.</li>
                <li><strong>Tích hợp API:</strong> Kết nối dịch vụ ngoài.</li>
                <li><strong>Kiểm thử:</strong> Thử nghiệm nhiều tình huống.</li>
                <li><strong>Triển khai:</strong> Đưa lên web/app/platform.</li>
            </ol>
            <p>Bạn muốn biết thêm chi tiết về bước nào không?</p>
        `; // Keep HTML for this response
         addMessage('bot', response, true); // Pass isHTML = true
         addToHistory(userMessage, response); // Add to history
         return; // Exit function early as message is added
    } else if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank')) {
        response = 'Không có gì! Rất vui được giúp đỡ bạn. Bạn có câu hỏi nào khác không?';
    } else {
        // Default response for demo
        response = `Tôi nhận được: "${escapeHTML(userMessage)}". Đây là bản demo, tôi chưa thể xử lý yêu cầu phức tạp.`;
    }

    addMessage('bot', response); // isHTML defaults to false
    addToHistory(userMessage, response); // Add to history
}

function extractTextForCopy(element) {
    // Get all text nodes, excluding the action buttons text
    let text = '';
    
    // First, get normal paragraph text
    element.querySelectorAll('p').forEach(p => {
        if (!p.closest('.aichat-message-actions')) {
            text += p.textContent.trim() + '\n\n';
        }
    });
    
    // Handle other block elements like lists, etc.
    element.querySelectorAll('ol, ul, h1, h2, h3, h4, h5, h6, blockquote').forEach(block => {
        if (!block.closest('.aichat-message-actions')) {
            text += block.textContent.trim() + '\n\n';
        }
    });
    
    // Handle code blocks specially - format with ```
    element.querySelectorAll('pre > code').forEach(codeBlock => {
        const language = codeBlock.className.split('-')[1] || '';
        if (codeBlock) {
            const codeText = codeBlock.textContent;
            text += '```' + language + '\n' + codeText + '\n```\n\n';
        }
    });
    
    return text.trim();
}

// Initialize marked.js and highlight.js with options
document.addEventListener('DOMContentLoaded', function() {
    // Configure marked.js to use highlight.js
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-', // highlight.js css prefix
        gfm: true, // Use GitHub Flavored Markdown
        breaks: true, // Convert line breaks to <br>
    });
    
    // Other initialization code...
});

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages || document.getElementById('typing-indicator')) return; // Prevent multiple indicators

    const typingHTML = `
        <div class="aichat-bot-message aichat-typing-indicator animate__animated animate__fadeInUp" id="typing-indicator">
             <div class="aichat-bot-badge">
                 <div class="aichat-logo"></div>
             </div>
             <div class="aichat-typing-dots">
                 <span class="aichat-dot"></span>
                 <span class="aichat-dot"></span>
                 <span class="aichat-dot"></span>
             </div>
         </div>
    `;
    // Use insertAdjacentHTML for potentially better performance than creating elements
    chatMessages.insertAdjacentHTML('beforeend', typingHTML);
    scrollToBottom(chatMessages);
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        // Optional: Add fade-out animation before removing
        typingIndicator.classList.remove('animate__fadeInUp');
        typingIndicator.classList.add('animate__fadeOutDown');
        setTimeout(() => typingIndicator.remove(), 500); // Remove after animation
    }
}


// --- UI Helpers ---

function autoResizeTextarea() {
    this.style.height = 'auto'; // Reset height
    let scrollHeight = this.scrollHeight;
    const maxHeight = 150; // Max height in pixels

    if (scrollHeight > maxHeight) {
        this.style.height = maxHeight + 'px';
        this.style.overflowY = 'auto'; // Enable scrollbar if max height reached
    } else {
        this.style.height = scrollHeight + 'px';
        this.style.overflowY = 'hidden'; // Hide scrollbar if not needed
    }
}

function removeWelcomeScreen() {
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.classList.add('animate__animated', 'animate__fadeOut');
        // Remove after animation completes (adjust time based on animation duration)
        setTimeout(() => {
            welcomeScreen.remove();
        }, 500); // Corresponds to Animate.css default duration
    }
}

function scrollToBottom(element) {
    if (element) {
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function updateParticlesColor(isDarkMode) {
    if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
        const particles = window.pJSDom[0].pJS.particles;
        const newColor = isDarkMode ? '#78a9ff' : '#4285f4'; // Dark and Light mode colors

        particles.color.value = newColor;
        particles.line_linked.color = newColor;

        // We need to redraw particles for changes to take effect
        window.pJSDom[0].pJS.fn.particlesDraw();
    }
}

function createRipple(event) {
    const button = event.currentTarget;

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    // Calculate position relative to the button, not the viewport
    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple-effect"); // Ensure this class is styled in CSS

    // Remove any existing ripple effect span before adding a new one
    const existingRipple = button.querySelector(".ripple-effect");
    if (existingRipple) {
        existingRipple.remove();
    }

    button.appendChild(circle);

    // Clean up the ripple span after the animation completes
    setTimeout(() => {
        circle.remove();
    }, 600); // Match the animation duration in CSS
}

function escapeHTML(str) {
    if (!str) return '';
    return str
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "")
         .replace(/'/g, "'");
}

function showToast(message, type = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            text: message,
            icon: type,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    } else {
        console.warn('SweetAlert2 not found. Cannot show toast:', message);
        // Basic fallback (optional)
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// --- Advanced Features (from separate JS block - integrated/adapted) ---

function setupVoiceInput() {
    const micButton = document.querySelector('.aichat-input-actions .fa-microphone'); // More specific selector
    const userInput = document.getElementById('user-input');

    if (!micButton || !userInput) {
        console.warn("Microphone button or user input not found for voice input.");
        return;
    }

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech Recognition API not supported in this browser.");
        micButton.parentElement.style.display = 'none'; // Hide the button if not supported
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after first phrase
    recognition.interimResults = true; // Show results as they come
    recognition.lang = 'vi-VN'; // Set language

    let isListening = false;

    micButton.parentElement.addEventListener('click', () => {
        if (!isListening) {
            try {
                recognition.start();
                micButton.classList.remove('fa-microphone'); // Use FontAwesome classes directly
                micButton.classList.add('fa-stop-circle', 'text-danger'); // Change icon to stop
                isListening = true;
                showToast('Đang nghe...', 'info');
            } catch (error) {
                console.error("Speech recognition start error:", error);
                showToast('Không thể bắt đầu ghi âm.', 'error');
                isListening = false; // Reset state
                micButton.classList.remove('fa-stop-circle', 'text-danger');
                micButton.classList.add('fa-microphone');
            }
        } else {
            recognition.stop();
            // Icon reset is handled in onend
        }
    });

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript;
            } else {
                // Show interim results dynamically (optional)
                // userInput.value = transcript + event.results[i][0].transcript;
            }
        }
        if (transcript) {
            userInput.value = transcript; // Set final transcript
            userInput.dispatchEvent(new Event('input')); // Trigger resize/other listeners
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Lỗi ghi âm: ';
        if (event.error === 'no-speech') {
            errorMessage += 'Không phát hiện giọng nói.';
        } else if (event.error === 'audio-capture') {
            errorMessage += 'Không tìm thấy micro.';
        } else if (event.error === 'not-allowed') {
            errorMessage += 'Quyền truy cập micro bị từ chối.';
        } else {
            errorMessage += event.error;
        }
        showToast(errorMessage, 'error');
        isListening = false;
        micButton.classList.remove('fa-stop-circle', 'text-danger');
        micButton.classList.add('fa-microphone');
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('fa-stop-circle', 'text-danger');
        micButton.classList.add('fa-microphone');
    };
}

function initKeyboardShortcuts() {
    const userInput = document.getElementById('user-input');
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + / to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === '/' && userInput) {
            e.preventDefault();
            userInput.focus();
        }

        // Enter to send (handled by form submit), Shift+Enter for newline
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement === userInput) {
             e.preventDefault(); // Prevent default newline
             handleSendMessage(); // Trigger send message
        }

        // Escape key to start new chat (only if not focused on input/textarea)
        if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                startNewChat(); // Assuming startNewChat function exists/is needed
            } else if (activeElement === userInput) {
                userInput.blur(); // Blur input if escape is pressed while focused
            }
        }
    });
}

function initConversations() {
    displayConversationHistory(); // Display history on load

     // Add event listener for the "New Chat" button
     const newChatButton = document.querySelector('.aichat-new-chat-btn');
     if (newChatButton) {
         newChatButton.addEventListener('click', startNewChat);
     }
}

function displayConversationHistory() {
     const conversations = getConversationsFromStorage();
     const conversationList = document.querySelector('.aichat-conversation-list'); // Target the UL

     if (!conversationList) return;

     // Clear existing items except potentially a placeholder/template
     conversationList.innerHTML = ''; // Clear previous list completely for simplicity

     if (conversations.length === 0) {
         // Optionally show a message if history is empty
         conversationList.innerHTML = '<li class="aichat-conversation-item disabled"><small>Chưa có lịch sử trò chuyện.</small></li>';
         return;
     }

     // Determine which conversation is active (e.g., the latest one or based on an ID)
     // For now, let's make the first one (most recent) active by default
     const activeConversationId = conversations[0]?.id;

     conversations.forEach((convo, index) => {
         const item = document.createElement('li');
         item.className = 'aichat-conversation-item';
         item.dataset.conversationId = convo.id; // Store ID for loading

         if (convo.id === activeConversationId) {
            item.classList.add('active');
            // Optionally load the active conversation's messages here if needed on page load
            // loadConversation(convo);
         }

         // Simple structure, adjust if your HTML is different
         item.innerHTML = `
             <div class="aichat-conversation-icon">
                 <i class="fas fa-comment-alt"></i> <!-- Changed icon -->
             </div>
             <span>${escapeHTML(convo.title)}</span>
             <div class="aichat-conversation-delete" title="Xóa cuộc trò chuyện này">
                 <i class="fas fa-trash"></i>
             </div>
         `;

         item.addEventListener('click', function(e) {
             // Xử lý khi nhấp vào nút xóa
             if (e.target.closest('.aichat-conversation-delete')) {
                 e.stopPropagation(); // Ngăn không cho sự kiện click lan đến phần tử cha
                 deleteConversation(convo.id);
                 return;
             }
             
             // Remove active class from all items
             conversationList.querySelectorAll('.aichat-conversation-item').forEach(i => i.classList.remove('active'));
             // Add active class to the clicked item
             this.classList.add('active');
             // Load the selected conversation
             loadConversation(convo);
         });

         conversationList.appendChild(item);
     });
 }

function getConversationsFromStorage() {
    try {
        const stored = localStorage.getItem('vyxai_conversations');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading conversations from localStorage:", e);
        return [];
    }
}

function saveConversationsToStorage(conversations) {
    try {
        localStorage.setItem('vyxai_conversations', JSON.stringify(conversations));
    } catch (e) {
        console.error("Error saving conversations to localStorage:", e);
        showToast("Không thể lưu lịch sử trò chuyện.", "error");
    }
}

function addToHistory(userMessage, botResponse) {
     // Don't add if messages are empty
     if (!userMessage || !botResponse) return;

     const conversations = getConversationsFromStorage();

     // Simple title generation: first ~30 chars of user message
     const title = userMessage.length > 30 ? userMessage.substring(0, 27) + '...' : userMessage;

     // Check if the current chat is already saved (e.g., based on an active ID)
     // For this simple version, we'll assume each send starts adding to the *latest* conversation
     // or creates a new one if the chat was just cleared.
     // A more robust approach needs tracking the current conversation ID.

     // Let's assume we always add to the *most recent* conversation for simplicity here.
     // Or, better: Check if the last message matches, to avoid duplicates if called multiple times.

     const currentMessages = getCurrentChatMessages(); // Get messages currently on screen
     const isNewConversation = currentMessages.length <= 2; // User + Bot = 2 messages

     let targetConversation;

     if (!isNewConversation && conversations.length > 0) {
         targetConversation = conversations[0]; // Add to the most recent one
         // Prevent adding exact duplicate message pairs
         const lastBotMsg = targetConversation.messages[targetConversation.messages.length - 1];
         const secondLastUserMsg = targetConversation.messages[targetConversation.messages.length - 2];
         if (lastBotMsg?.sender === 'bot' && lastBotMsg?.text === botResponse &&
             secondLastUserMsg?.sender === 'user' && secondLastUserMsg?.text === userMessage) {
              console.log("Duplicate message pair detected, skipping history add.");
              return;
         }
     } else {
         // Create a new conversation object
         targetConversation = {
             id: Date.now(), // Simple unique ID
             title: title,
             messages: [],
             timestamp: new Date().toISOString()
         };
         conversations.unshift(targetConversation); // Add new conversation to the beginning
     }

     // Add the new messages
     targetConversation.messages.push({ sender: 'user', text: userMessage });
     // Determine if bot response contains significant HTML
     const containsHtmlTags = /<[a-z][\s\S]*>/i.test(botResponse);
     targetConversation.messages.push({ sender: 'bot', text: botResponse, isHTML: containsHtmlTags });

     // Update timestamp for the conversation
     targetConversation.timestamp = new Date().toISOString();

     // Limit history size (e.g., last 20 conversations)
     const maxHistory = 20;
     if (conversations.length > maxHistory) {
         conversations.splice(maxHistory); // Remove oldest conversations
     }

     saveConversationsToStorage(conversations);
     displayConversationHistory(); // Refresh the list in the sidebar
 }

function loadConversation(conversation) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages || !conversation || !conversation.messages) return;

    // Clear current messages displayed
    chatMessages.innerHTML = '';
    removeWelcomeScreen(); // Ensure welcome screen is gone

    // Add messages from the loaded conversation
    conversation.messages.forEach(msg => {
        addMessage(msg.sender, msg.text, msg.isHTML);
    });

    // Scroll to the bottom after loading
    // Use setTimeout to ensure rendering is complete before scrolling
    setTimeout(() => scrollToBottom(chatMessages), 100);

     // Update the active state in the sidebar (if not already handled by the click listener)
     const conversationList = document.querySelector('.aichat-conversation-list');
     if (conversationList) {
         conversationList.querySelectorAll('.aichat-conversation-item').forEach(item => {
             item.classList.toggle('active', item.dataset.conversationId == conversation.id);
         });
     }
}

function startNewChat() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const welcomeScreenHTML = `<!-- Paste your original welcome screen HTML here if you want it back -->
        <div class="welcome-screen animate__animated animate__fadeIn">
             <div class="welcome-animation" id="particles-js-placeholder"></div> <!-- Placeholder -->
             <div class="welcome-header">
                 <h1>Chào mừng đến với VYxAI</h1>
                 <div class="subtitle">Trợ lý AI thông minh của bạn</div>
                 <p class="lead">Hỏi tôi bất cứ điều gì hoặc chọn một gợi ý.</p>
                 <div class="system-message">
                    <i class="fas fa-brain"></i> Tôi sẽ nhớ ngữ cảnh cuộc trò chuyện của chúng ta.
                 </div>
             </div>
             <!-- Add suggestion chips/cards if they are part of the initial screen -->
        </div>`;

    if (chatMessages) {
        chatMessages.innerHTML = welcomeScreenHTML; // Reset to welcome screen
        // Re-initialize particles if they were part of the welcome screen
        // initAnimationsAndEffects(); // Or just the particles part if needed
    }

    if (userInput) {
        userInput.value = '';
        autoResizeTextarea.call(userInput);
        userInput.focus();
    }

    // Tạo cuộc trò chuyện mới bằng cách gọi API
    fetch('/api/chat/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.conversation_id) {
            // Lưu conversation_id mới
            localStorage.setItem('current_conversation_id', data.conversation_id);
            console.log('Đã tạo cuộc trò chuyện mới với ID:', data.conversation_id);
            
            // Thêm thông báo hệ thống
            setTimeout(() => {
                const systemMessage = document.createElement('div');
                systemMessage.className = 'system-message animate__animated animate__fadeIn';
                systemMessage.innerHTML = '<i class="fas fa-info-circle"></i> Cuộc trò chuyện mới đã bắt đầu. Tôi sẽ nhớ ngữ cảnh giữa các tin nhắn của bạn.';
                chatMessages.appendChild(systemMessage);
            }, 1000);
        }
    })
    .catch(error => {
        console.error('Lỗi khi tạo cuộc trò chuyện mới:', error);
    });

    // Reset active state in sidebar
    const conversationList = document.querySelector('.aichat-conversation-list');
    if (conversationList) {
        conversationList.querySelectorAll('.aichat-conversation-item').forEach(item => item.classList.remove('active'));
        // Optionally add an "active" class to a "New Chat" item if you have one
    }

    // Re-animate the welcome section if needed
    animateWelcomeSection();
}

function animateWelcomeSection() {
    // Animate elements within the welcome screen on load/new chat
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
         // Ensure parent has animation class
         welcomeScreen.classList.add('animate__animated', 'animate__fadeIn');

         // Stagger children animation (example)
         const animatedChildren = welcomeScreen.querySelectorAll('.welcome-header > *, .feature-card, .get-started-btn'); // Adjust selector
         animatedChildren.forEach((child, index) => {
             child.classList.add('animate__animated', 'animate__fadeInUp');
             child.style.animationDelay = `${index * 0.1}s`;
         });
    }
}

function createAndSetupActionButtons(contentElement) {
     // Create action buttons container
     const actionsDiv = document.createElement('div');
     actionsDiv.className = 'aichat-message-actions'; // Use class from your CSS

     // Define buttons
     const buttons = [
         { icon: 'fa-thumbs-up', title: 'Thích', action: 'like' },
         { icon: 'fa-thumbs-down', title: 'Không thích', action: 'dislike' },
         { icon: 'fa-copy', title: 'Sao chép', action: 'copy' },
         // { icon: 'fa-volume-up', title: 'Đọc', action: 'read' }, // Optional: Requires TTS
         // { icon: 'fa-share', title: 'Chia sẻ', action: 'share' } // Optional: Requires sharing logic
     ];

     buttons.forEach(btnInfo => {
         const button = document.createElement('button');
         button.className = 'aichat-action-btn ripple'; // Use classes from your CSS
         button.title = btnInfo.title;
         button.dataset.action = btnInfo.action; // Store action type

         const icon = document.createElement('i');
         icon.className = `fas ${btnInfo.icon}`; // Use Font Awesome classes
         button.appendChild(icon);

         // Add ripple effect listener
         button.addEventListener('click', createRipple);

         // Add specific action listener
         button.addEventListener('click', handleMessageAction);

         actionsDiv.appendChild(button);
     });

     contentElement.appendChild(actionsDiv);
}

function handleMessageAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const messageContentElement = button.closest('.aichat-message-content');
    const botMessageElement = button.closest('.aichat-bot-message'); // Get the whole message div

    if (!action || !messageContentElement || !botMessageElement) return;

    switch (action) {
        case 'like':
            button.classList.toggle('active');
            // Deactivate dislike button if active
            botMessageElement.querySelector('[data-action="dislike"]')?.classList.remove('active');
            showToast('Cảm ơn bạn đã đánh giá!', 'success');
            // TODO: Send feedback to backend (like)
            break;
        case 'dislike':
            button.classList.toggle('active');
             // Deactivate like button if active
            botMessageElement.querySelector('[data-action="like"]')?.classList.remove('active');
            showFeedbackForm(messageContentElement); // Show feedback modal/prompt
            // TODO: Send feedback to backend (dislike)
            break;
        case 'copy':
            // Extract text, trying to be smart about HTML
            const textToCopy = extractTextForCopy(messageContentElement);
             navigator.clipboard.writeText(textToCopy).then(() => {
                 showToast('Đã sao chép vào bộ nhớ đệm!', 'success');
                 // Optional: temporary visual feedback on the button
                 button.classList.add('copied');
                 setTimeout(() => button.classList.remove('copied'), 1500);
             }).catch(err => {
                 console.error('Copy failed:', err);
                 showToast('Sao chép thất bại.', 'error');
             });
            break;
         case 'read':
             // TODO: Implement Text-to-Speech
             showToast('Chức năng đọc chưa được hỗ trợ.', 'info');
             break;
         case 'share':
             // TODO: Implement sharing logic (e.g., using Web Share API)
             showToast('Chức năng chia sẻ chưa được hỗ trợ.', 'info');
             break;
    }
}

function showFeedbackForm(messageElement) {
    // Use SweetAlert2 for a nicer feedback form
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Góp ý cải thiện',
            input: 'textarea',
            inputLabel: 'Vui lòng cho biết lý do bạn không thích hoặc đề xuất cải thiện:',
            inputPlaceholder: 'Nhập góp ý của bạn ở đây...',
            showCancelButton: true,
            confirmButtonText: 'Gửi góp ý',
            cancelButtonText: 'Hủy',
            inputValidator: (value) => {
                if (!value) {
                    return 'Bạn cần nhập góp ý!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                console.log('Feedback submitted:', result.value);
                // TODO: Send feedback (result.value) and original message content to backend
                showToast('Cảm ơn bạn đã góp ý!', 'success');
            } else {
                 // User cancelled or didn't provide feedback, maybe deactivate the dislike button?
                 messageElement.querySelector('[data-action="dislike"]')?.classList.remove('active');
            }
        });
    } else {
        // Basic prompt fallback
        const feedback = prompt('Vui lòng cho biết lý do bạn không thích hoặc đề xuất cải thiện:');
        if (feedback) {
            console.log('Feedback submitted:', feedback);
            showToast('Cảm ơn bạn đã góp ý!', 'success');
        } else {
             messageElement.querySelector('[data-action="dislike"]')?.classList.remove('active');
        }
    }
}

function getCurrentChatMessages() {
    // Helper to get message data currently displayed (useful for history)
    const messages = [];
    const messageElements = document.querySelectorAll('#chat-messages .aichat-user-message, #chat-messages .aichat-bot-message');
    messageElements.forEach(el => {
        const isUser = el.classList.contains('aichat-user-message');
        const contentEl = el.querySelector(isUser ? 'p' : '.aichat-message-content');
        if (contentEl) {
             messages.push({
                 sender: isUser ? 'user' : 'bot',
                 text: isUser ? contentEl.textContent : contentEl.innerHTML // Store raw HTML for bot? Or process?
                 // Add isHTML flag if needed based on content
             });
        }
    });
    return messages;
}

// Thêm hàm mới để xóa một cuộc trò chuyện cụ thể
function deleteConversation(conversationId) {
    // Hiển thị hộp thoại xác nhận
    Swal.fire({
        title: 'Xóa cuộc trò chuyện?',
        text: 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            // Lấy danh sách conversation từ localStorage
            const conversations = getConversationsFromStorage();
            
            // Tìm và xóa cuộc trò chuyện có ID tương ứng
            const updatedConversations = conversations.filter(convo => convo.id !== conversationId);
            
            // Lưu lại danh sách đã cập nhật
            saveConversationsToStorage(updatedConversations);
            
            // Cập nhật giao diện
            displayConversationHistory();
            
            // Kiểm tra nếu cuộc trò chuyện đang hiển thị là cuộc trò chuyện bị xóa
            const currentMessages = document.getElementById('chat-messages');
            const activeItem = document.querySelector('.aichat-conversation-item.active');
            
            if (!activeItem) {
                // Nếu không còn cuộc trò chuyện nào, hiển thị màn hình chào mừng
                currentMessages.innerHTML = '';
                startNewChat();
            }
            
            // Hiển thị thông báo thành công
            showToast('Đã xóa cuộc trò chuyện', 'success');
        }
    });
}

// Thêm hàm để thay đổi ngữ cảnh chatbot
function changeChatbotContext(contextType = null, customInstruction = null) {
    /**
     * Thay đổi ngữ cảnh của chatbot để điều chỉnh cách chatbot phản hồi
     * 
     * @param {string} contextType - Loại ngữ cảnh có sẵn (default, expert, creative, concise, technical, educational, conversational)
     * @param {string} customInstruction - Hướng dẫn tùy chỉnh (sẽ ghi đè lên contextType nếu được cung cấp)
     * @returns {Promise} - Promise chứa kết quả thay đổi ngữ cảnh
     * 
     * Ví dụ sử dụng:
     * 1. Sử dụng ngữ cảnh có sẵn:
     *    changeChatbotContext('expert')
     *    .then(response => console.log('Đã thay đổi ngữ cảnh thành:', response.new_context))
     *    .catch(error => console.error('Lỗi:', error));
     * 
     * 2. Sử dụng hướng dẫn tùy chỉnh:
     *    changeChatbotContext(null, 'Bạn là chuyên gia về AI. Hãy trả lời một cách chuyên nghiệp')
     *    .then(response => console.log('Đã thay đổi ngữ cảnh thành:', response.new_context))
     *    .catch(error => console.error('Lỗi:', error));
     */
    
    // Dữ liệu gửi đi
    const data = {};
    
    // Nếu có contextType, thêm vào data
    if (contextType) {
        data.context_type = contextType;
    }
    
    // Nếu có customInstruction, thêm vào data (sẽ ghi đè lên contextType)
    if (customInstruction) {
        data.custom_instruction = customInstruction;
    }
    
    // Kiểm tra xem có dữ liệu hợp lệ không
    if (Object.keys(data).length === 0) {
        return Promise.reject(new Error('Phải cung cấp ít nhất một tham số: contextType hoặc customInstruction'));
    }
    
    // Gửi yêu cầu thay đổi ngữ cảnh
    return fetch('/api/chat/context', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Không thể thay đổi ngữ cảnh chatbot');
        }
        return response.json();
    })
    .then(data => {
        // Hiển thị thông báo thành công
        showToast('Đã thay đổi ngữ cảnh của chatbot thành công', 'success');
        
        // Thêm thông báo về việc thay đổi ngữ cảnh vào khung chat
        const systemMessage = `<div class="system-message">Đã thay đổi ngữ cảnh: ${data.new_context}</div>`;
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML += systemMessage;
            scrollToBottom(chatMessages);
        }
        
        return data;
    })
    .catch(error => {
        console.error('Lỗi khi thay đổi ngữ cảnh:', error);
        showToast('Không thể thay đổi ngữ cảnh: ' + error.message, 'error');
        throw error;
    });
}

// Hàm để tạo ngữ cảnh tùy chỉnh với các thành phần
function createCustomChatbotContext(options = {}) {
    /**
     * Tạo ngữ cảnh tùy chỉnh cho chatbot bằng cách kết hợp các thành phần
     * 
     * @param {Object} options - Các tùy chọn để tạo ngữ cảnh
     * @param {string} options.personality - Tính cách của chatbot
     * @param {string} options.expertise - Lĩnh vực chuyên môn
     * @param {string} options.responseStyle - Phong cách trả lời
     * @param {string} options.extraInstructions - Hướng dẫn bổ sung
     * @returns {Promise} - Promise chứa kết quả thay đổi ngữ cảnh
     * 
     * Ví dụ sử dụng:
     * createCustomChatbotContext({
     *     personality: 'vui vẻ và thân thiện',
     *     expertise: 'lập trình JavaScript',
     *     responseStyle: 'chi tiết với ví dụ cụ thể',
     *     extraInstructions: 'luôn cung cấp ví dụ code khi được hỏi về lập trình'
     * })
     * .then(response => console.log('Đã tạo ngữ cảnh mới:', response.new_context))
     * .catch(error => console.error('Lỗi:', error));
     */
    
    // Chuyển đổi tên tham số từ camelCase sang snake_case cho API
    const data = {
        personality: options.personality || null,
        expertise: options.expertise || null,
        response_style: options.responseStyle || null,
        extra_instructions: options.extraInstructions || null
    };
    
    // Lọc bỏ các giá trị null
    Object.keys(data).forEach(key => data[key] === null && delete data[key]);
    
    // Kiểm tra xem có dữ liệu hợp lệ không
    if (Object.keys(data).length === 0) {
        return Promise.reject(new Error('Phải cung cấp ít nhất một tham số tùy chọn'));
    }
    
    // Gửi yêu cầu tạo ngữ cảnh tùy chỉnh
    return fetch('/api/chat/context', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Không thể tạo ngữ cảnh tùy chỉnh');
        }
        return response.json();
    })
    .then(data => {
        // Hiển thị thông báo thành công
        showToast('Đã tạo và thiết lập ngữ cảnh tùy chỉnh thành công', 'success');
        
        // Thêm thông báo về việc thay đổi ngữ cảnh vào khung chat
        const systemMessage = `<div class="system-message">Đã thay đổi ngữ cảnh: ${data.new_context}</div>`;
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML += systemMessage;
            scrollToBottom(chatMessages);
        }
        
        return data;
    })
    .catch(error => {
        console.error('Lỗi khi tạo ngữ cảnh tùy chỉnh:', error);
        showToast('Không thể tạo ngữ cảnh tùy chỉnh: ' + error.message, 'error');
        throw error;
    });
}

// Hàm để lấy danh sách các ngữ cảnh có sẵn
function getAvailableChatbotContexts() {
    /**
     * Lấy danh sách các ngữ cảnh có sẵn cho chatbot
     * 
     * @returns {Promise} - Promise chứa danh sách các ngữ cảnh có sẵn
     * 
     * Ví dụ sử dụng:
     * getAvailableChatbotContexts()
     * .then(contexts => {
     *     console.log('Danh sách ngữ cảnh:', contexts);
     *     // Hiển thị danh sách ngữ cảnh trong giao diện
     *     displayContextOptions(contexts);
     * })
     * .catch(error => console.error('Lỗi:', error));
     */
    
    return fetch('/api/chat/available_contexts')
    .then(response => {
        if (!response.ok) {
            throw new Error('Không thể lấy danh sách ngữ cảnh');
        }
        return response.json();
    })
    .then(data => {
        return data.contexts;
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách ngữ cảnh:', error);
        showToast('Không thể lấy danh sách ngữ cảnh: ' + error.message, 'error');
        throw error;
    });
}

// Chức năng hiển thị dropdown ngữ cảnh
function initContextSwitcher() {
    /**
     * Khởi tạo chức năng chuyển đổi ngữ cảnh dạng dropdown
     */
    
    // Element cho dropdown ngữ cảnh
    const contextSwitcherBtn = document.getElementById('context-switcher-btn');
    const contextDropdownMenu = document.getElementById('context-dropdown-menu');
    
    if (!contextSwitcherBtn || !contextDropdownMenu) {
        console.warn('Không tìm thấy các thành phần dropdown ngữ cảnh');
        return;
    }
    
    // Chuẩn bị các icon cho các loại ngữ cảnh
    const contextIcons = {
        'default': 'fa-home',
        'expert': 'fa-chart-bar',
        'creative': 'fa-pen-fancy',
        'concise': 'fa-info-circle',
        'technical': 'fa-file-code',
        'educational': 'fa-chalkboard',
        'conversational': 'fa-comments',
        'custom': 'fa-edit'
    };
    
    // Hàm cập nhật nội dung nút với ngữ cảnh hiện tại
    function updateContextButtonText(contextType) {
        // Lấy tên ngữ cảnh dễ đọc
        const contextNames = {
            'default': 'Mặc định',
            'expert': 'Chuyên gia',
            'creative': 'Sáng tạo',
            'concise': 'Súc tích',
            'technical': 'Kỹ thuật',
            'educational': 'Giáo dục',
            'conversational': 'Trò chuyện',
            'custom': 'Tùy chỉnh'
        };
        
        // Cập nhật text trên nút
        const buttonSpan = contextSwitcherBtn.querySelector('span');
        if (buttonSpan) {
            buttonSpan.textContent = contextNames[contextType] || 'Suy luận';
        }
    }
    
    // Set up trạng thái ban đầu
    const currentContext = localStorage.getItem('currentContext') || 'default';
    updateContextButtonText(currentContext);
    
    // Đóng dropdown khi click bên ngoài
    document.addEventListener('click', function(e) {
        if (!contextSwitcherBtn.contains(e.target) && !contextDropdownMenu.contains(e.target)) {
            contextDropdownMenu.style.display = 'none';
        }
    });
    
    // Xử lý sự kiện click trên nút
    contextSwitcherBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Lấy vị trí của nút
        const buttonRect = contextSwitcherBtn.getBoundingClientRect();
        
        // Đặt vị trí cho dropdown menu
        contextDropdownMenu.style.left = buttonRect.left + 'px';
        contextDropdownMenu.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
        
        // Toggle hiển thị dropdown
        if (contextDropdownMenu.style.display === 'block') {
            contextDropdownMenu.style.display = 'none';
        } else {
            contextDropdownMenu.style.display = 'block';
            loadContextOptions();
        }
    });
    
    // Hàm tải danh sách các ngữ cảnh
    function loadContextOptions() {
        // Hiển thị loading
        contextDropdownMenu.innerHTML = `
            <div class="context-dropdown-loading">
                <i class="fas fa-spinner fa-spin"></i> Đang tải...
            </div>
        `;
        
        // Lấy danh sách ngữ cảnh từ API
        getAvailableChatbotContexts()
        .then(contexts => {
            // Tạo các item cho dropdown
            let dropdownHTML = '';
            
            // Lấy ngữ cảnh hiện tại để highlight
            const currentContext = localStorage.getItem('currentContext') || 'default';
            
            // Thêm các ngữ cảnh có sẵn
            Object.keys(contexts).forEach(key => {
                const isActive = key === currentContext ? 'active' : '';
                const iconClass = contextIcons[key] || 'fa-sliders-h';
                dropdownHTML += `
                    <div class="context-dropdown-item ${isActive}" data-context="${key}">
                        <i class="fas ${iconClass}"></i>
                        <span>${contexts[key]}</span>
                    </div>
                `;
            });
            
            // Thêm divider
            dropdownHTML += `<div class="context-dropdown-divider"></div>`;
            
            // Thêm tùy chọn "Tùy chỉnh..."
            dropdownHTML += `
                <div class="context-dropdown-item context-dropdown-custom" data-context="custom">
                    <i class="fas fa-edit"></i>
                    <span>Tùy chỉnh...</span>
                </div>
            `;
            
            // Cập nhật nội dung dropdown
            contextDropdownMenu.innerHTML = dropdownHTML;
            
            // Thêm sự kiện click cho mỗi item
            const dropdownItems = contextDropdownMenu.querySelectorAll('.context-dropdown-item');
            dropdownItems.forEach(item => {
                item.addEventListener('click', handleContextSelect);
            });
        })
        .catch(error => {
            console.error('Không thể tải danh sách ngữ cảnh:', error);
            contextDropdownMenu.innerHTML = `
                <div class="context-dropdown-loading">
                    <i class="fas fa-exclamation-circle"></i> Không thể tải danh sách
                </div>
            `;
        });
    }
    
    // Xử lý khi chọn ngữ cảnh
    function handleContextSelect(e) {
        const selectedContext = this.dataset.context;
        
        // Đóng dropdown
        contextDropdownMenu.style.display = 'none';
        
        // Nếu chọn "Tùy chỉnh..."
        if (selectedContext === 'custom') {
            showCustomContextForm();
            return;
        }
        
        // Hiển thị loading toast
        const loadingToast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        
        loadingToast.fire({
            icon: 'info',
            title: 'Đang thay đổi ngữ cảnh...'
        });
        
        // Cập nhật ngữ cảnh
        changeChatbotContext(selectedContext)
        .then(() => {
            // Đóng toast loading
            loadingToast.close();
            
            // Lưu ngữ cảnh hiện tại
            localStorage.setItem('currentContext', selectedContext);
            
            // Cập nhật text trên nút
            updateContextButtonText(selectedContext);
            
            // Hiển thị toast thành công
            setTimeout(() => {
                Swal.mixin({
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 2000,
                    icon: 'success',
                    title: 'Đã thay đổi ngữ cảnh thành công'
                }).fire();
                
                // Thêm hiệu ứng cho system message
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    const systemMessages = chatMessages.querySelectorAll('.system-message');
                    if (systemMessages.length > 0) {
                        const lastMessage = systemMessages[systemMessages.length - 1];
                        lastMessage.classList.add('animate__animated', 'animate__fadeIn');
                        setTimeout(() => {
                            lastMessage.classList.remove('animate__fadeIn');
                        }, 1000);
                    }
                }
            }, 300);
        })
        .catch(error => {
            // Đóng toast loading
            loadingToast.close();
            
            // Hiển thị toast lỗi
            Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                icon: 'error',
                title: 'Không thể thay đổi ngữ cảnh'
            }).fire();
        });
    }
}

// Hàm hiển thị form tùy chỉnh ngữ cảnh (vẫn giữ lại SweetAlert2 cho form này)
function showCustomContextForm() {
    /**
     * Hiển thị form để tạo ngữ cảnh tùy chỉnh
     */
    
    Swal.fire({
        title: 'Tạo ngữ cảnh',
        html: `
            <div class="mb-3">
                <label for="swal-context-textarea" class="form-label fw-medium">Nhập hướng dẫn tùy chỉnh:</label>
                <textarea id="swal-context-textarea" class="form-control" rows="3" placeholder="Ví dụ: Bạn là chuyên gia AI. Hãy trả lời chuyên nghiệp."></textarea>
            </div>
            <div class="text-muted small mb-2">Hoặc tạo từ các thành phần:</div>
            <div class="row">
                <div class="col-sm-6 mb-2">
                    <label for="swal-personality" class="form-label fw-medium small">Tính cách:</label>
                    <input type="text" id="swal-personality" class="form-control form-control-sm" placeholder="Vui vẻ và thân thiện">
                </div>
                <div class="col-sm-6 mb-2">
                    <label for="swal-expertise" class="form-label fw-medium small">Chuyên môn:</label>
                    <input type="text" id="swal-expertise" class="form-control form-control-sm" placeholder="Lập trình Python">
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6 mb-2">
                    <label for="swal-style" class="form-label fw-medium small">Phong cách trả lời:</label>
                    <input type="text" id="swal-style" class="form-control form-control-sm" placeholder="Chi tiết với ví dụ">
                </div>
                <div class="col-sm-6 mb-2">
                    <label for="swal-extra" class="form-label fw-medium small">Hướng dẫn bổ sung:</label>
                    <input type="text" id="swal-extra" class="form-control form-control-sm" placeholder="Luôn đưa ra code mẫu">
                </div>
            </div>
        `,
        showCancelButton: true,
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Áp dụng',
        customClass: {
            popup: 'context-switcher-popup',
            title: 'context-switcher-title',
            actions: 'context-switcher-actions',
            confirmButton: 'context-switcher-confirm',
            cancelButton: 'context-switcher-cancel'
        },
        width: 'auto',
        maxWidth: '450px',
        padding: '1rem',
        buttonsStyling: true,
        backdrop: true,
        position: 'top',
        showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
        },
        didOpen: () => {
            // Focus textarea khi dialog mở
            document.getElementById('swal-context-textarea').focus();
        },
        preConfirm: () => {
            const instruction = document.getElementById('swal-context-textarea').value;
            const personality = document.getElementById('swal-personality').value;
            const expertise = document.getElementById('swal-expertise').value;
            const style = document.getElementById('swal-style').value;
            const extra = document.getElementById('swal-extra').value;
            
            // Kiểm tra xem có ít nhất một trường được điền không
            if (!instruction && !personality && !expertise && !style && !extra) {
                Swal.showValidationMessage('Vui lòng nhập ít nhất một thông tin');
                return false;
            }
            
            return {
                instruction,
                personality,
                expertise,
                style,
                extra
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { instruction, personality, expertise, style, extra } = result.value;
            
            // Hiển thị thông báo nhỏ
            const loadingToast = Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            
            loadingToast.fire({
                icon: 'info',
                title: 'Đang cập nhật ngữ cảnh...'
            });
            
            // Thực hiện thay đổi ngữ cảnh
            if (instruction) {
                changeChatbotContext(null, instruction)
                .then(() => {
                    loadingToast.close();
                    
                    // Đánh dấu ngữ cảnh là tùy chỉnh
                    localStorage.setItem('currentContext', 'custom');
                    
                    // Hiển thị toast thành công
                    Swal.mixin({
                        toast: true,
                        position: 'top',
                        showConfirmButton: false,
                        timer: 2000,
                        icon: 'success',
                        title: 'Đã thay đổi ngữ cảnh thành công'
                    }).fire();
                })
                .catch(error => {
                    loadingToast.close();
                    Swal.mixin({
                        toast: true,
                        position: 'top',
                        showConfirmButton: false,
                        timer: 3000,
                        icon: 'error',
                        title: 'Không thể thay đổi ngữ cảnh'
                    }).fire();
                });
            } else {
                // Tạo ngữ cảnh từ các thành phần
                createCustomChatbotContext({
                    personality,
                    expertise,
                    responseStyle: style,
                    extraInstructions: extra
                })
                .then(() => {
                    loadingToast.close();
                    
                    // Đánh dấu ngữ cảnh là tùy chỉnh
                    localStorage.setItem('currentContext', 'custom');
                    
                    // Hiển thị toast thành công
                    Swal.mixin({
                        toast: true,
                        position: 'top',
                        showConfirmButton: false,
                        timer: 2000,
                        icon: 'success',
                        title: 'Đã tạo ngữ cảnh tùy chỉnh thành công'
                    }).fire();
                })
                .catch(error => {
                    loadingToast.close();
                    Swal.mixin({
                        toast: true,
                        position: 'top',
                        showConfirmButton: false,
                        timer: 3000,
                        icon: 'error',
                        title: 'Không thể tạo ngữ cảnh tùy chỉnh'
                    }).fire();
                });
            }
        }
    });
}