// Check if code is already loaded
if (typeof window.DogQuiz === 'undefined') {
    /**
     * Progress Bar Animation Module
     * Handles smooth progress bar animations with percentage counter
     */
    class ProgressBarAnimator {
        /**
         * Animates a progress bar from current to target percentage
         * @param {HTMLElement} progressBar - The progress bar container element
         * @param {number} targetPercentage - The final percentage to reach
         * @param {number} duration - Animation duration in milliseconds (default: 1000ms)
         */
        static animate(progressBar, targetPercentage, duration = 1000) {
            // Get required elements
            const progressElement = progressBar.querySelector('.progress');
            if (!progressElement) return;
            
            // Reset progress bar to 0% before animation
            progressElement.style.width = '0%';
            progressElement.textContent = '0%';
            
            // Animation state
            let startTime = null;
            let startPercentage = 0;

            /**
             * Animation frame handler
             * @param {number} currentTime - Current timestamp
             */
            function animate(currentTime) {
                // Initialize start time on first frame
                if (!startTime) startTime = currentTime;
                
                // Calculate animation progress
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeProgress = easeInOutQuad(progress);

                // Update current percentage
                const currentValue = Math.round(startPercentage + (targetPercentage - startPercentage) * easeProgress);
                
                // Update DOM elements
                progressElement.style.width = `${currentValue}%`;
                progressElement.textContent = `${currentValue}%`;

                // Continue animation if not finished
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }

            // Start animation
            requestAnimationFrame(animate);
        }

        /**
         * Initialize progress bar with total slides
         * @param {number} totalSlides - Total number of slides in the quiz
         */
        static initialize(totalSlides) {
            const progressBars = document.querySelectorAll('.progress-bar');
            if (!progressBars.length) return;

            // Calculate initial percentage (first slide)
            const initialPercentage = Math.round((1 / (totalSlides - 2)) * 100);
            
            // Initialize all progress bars
            progressBars.forEach(progressBar => {
                const progressElement = progressBar.querySelector('.progress');
                if (progressElement) {
                    // Set initial state
                    progressElement.style.width = `${initialPercentage}%`;
                    const span = progressBar.querySelector('span');
                    if (span) {
                        span.textContent = `${initialPercentage}%`;
                    }
                }
            });
        }

        /**
         * Update progress bar for current slide
         * @param {number} currentIndex - Current slide index
         * @param {number} totalSlides - Total number of slides
         */
        static updateProgress(currentIndex, totalSlides) {
            const progressBars = document.querySelectorAll('.progress-bar');
            if (!progressBars.length) return;

            // Ensure we have valid numbers
            currentIndex = parseInt(currentIndex) || 0;
            totalSlides = parseInt(totalSlides) || 1;

            // Calculate percentage and ensure it's between 0 and 100
            const targetPercentage = Math.min(Math.max(Math.round(((currentIndex + 1) / totalSlides) * 100), 0), 100);
            
            // Update all progress bars
            progressBars.forEach(progressBar => {
                const progressElement = progressBar.querySelector('.progress');
                if (progressElement) {
                    progressElement.style.width = `${targetPercentage}%`;
                    const span = progressBar.querySelector('.progress span');
                    if (span) {
                        span.textContent = `${targetPercentage}%`;
                    }
                }
            });
        }
    }

    /**
     * Easing function for smooth animation
     * @param {number} t - Progress value between 0 and 1
     * @returns {number} Eased progress value
     */
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Dog Quiz Application
     * Handles the quiz flow and user interactions
     */
    class DogQuiz {
        constructor() {
            this.container = document.querySelector('.quiz-container');
            this.slides = document.querySelectorAll('.quiz-slide');
            this.progressBars = document.querySelectorAll('.progress-bar');
            this.currentIndex = 0;
            this.totalSlides = this.slides.length;
            
            // Calculate progress steps
            this.progressSteps = this.calculateProgressSteps();
            
            this.answers = this.loadSavedAnswers();
            this.initializeQuiz();
        }

        calculateProgressSteps() {
            const steps = [];
            const totalSteps = this.totalSlides;
            const increment = 100 / (totalSteps - 2); // Changed to 100% for last slide
            
            for (let i = 0; i <= totalSteps; i++) {
                steps.push({
                    start: i === 0 ? 0 : Math.round(increment * (i - 1)),
                    end: i === totalSteps - 1 ? 100 : Math.round(increment * i) // Force 100% on last slide
                });
            }
            
            return steps;
        }

        initializeQuiz() {
            this.setupSlides();
            this.setupEventListeners();
            this.initializeBreedSelect();
            this.restoreSavedState();
            this.updateProgress(true);
            
            this.logEvent('quiz_started', { totalSlides: this.totalSlides });
        }

        setupSlides() {
            this.slides.forEach((slide, index) => {
                slide.style.display = index === 0 ? 'block' : 'none';
                slide.dataset.index = index;
            });
        }

        setupEventListeners() {
            document.addEventListener('click', (e) => {
               if (e.target.classList.contains('next-btn')) {
                    e.preventDefault();
                    if (e.target.classList.contains('next-btn-no') || this.validateCurrentSlide()) {
                        this.handleNavigation('next');
                    } else {
                        const errorMessage = document.createElement('div');
                        errorMessage.className = 'error-message';
                        errorMessage.textContent = 'Please fill in all required fields';
                        this.slides[this.currentIndex].appendChild(errorMessage);
                        setTimeout(() => errorMessage.remove(), 3000);
                    }
                } else if (e.target.classList.contains('back-btn')) {
                    e.preventDefault();
                    this.handleNavigation('prev');
                } else if (e.target.classList.contains('submit-btn')) {
                    e.preventDefault();
                    if (this.validateCurrentSlide()) {
                        this.handleSubmit();
                    }
                }
            });

            // Add input event listeners to all inputs in the current slide
            this.slides.forEach(slide => {
                const inputs = slide.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('input', () => {
                        this.updateNextButtonState();
                    });
                    input.addEventListener('change', () => {
                        this.updateNextButtonState();
                    });
                });
            });

            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const label = e.target.closest('label');
                    const group = e.target.closest('.radio-group, .weight-options, .dental-options, .health-options, .yes-no-options');
                    
                    if (group) {
                        group.querySelectorAll('label').forEach(l => l.classList.remove('active'));
                    }
                    
                    if (label) {
                        label.classList.add('active');
                    }

                    this.handleAnswerSelection(e.target);
// Immediate navigation after radio selection
                    this.handleNavigation('next');
                    this.updateNextButtonState();
                    
                    
                });
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const group = e.target.closest('.dental-options');
                    const isOnlySelect = e.target.classList.contains('onlyselect');
                    
                    if (group) {
                        if (isOnlySelect) {
                            // If onlyselect is checked, uncheck all other options
                            group.querySelectorAll('input[type="checkbox"]').forEach(otherCheckbox => {
                                if (otherCheckbox !== e.target) {
                                    otherCheckbox.checked = false;
                                    otherCheckbox.closest('label')?.classList.remove('active');
                                }
                            });
                        } else {
                            // If regular option is checked, uncheck onlyselect
                            const onlySelect = group.querySelector('.onlyselect');
                            if (onlySelect) {
                                onlySelect.checked = false;
                                onlySelect.closest('label')?.classList.remove('active');
                            }
                        }
                    }

                    this.handleAnswerSelection(e.target);
                    this.updateNextButtonState();
                    
                    // Only auto-navigate if checkbox has class 'onlyselect'
                    if (isOnlySelect) {
                       // this.handleNavigation('next');
                    }
                });
            });

            const dogNameInput = document.querySelector('.dog-name-input');
            if (dogNameInput) {
                dogNameInput.addEventListener('input', (e) => {
                    this.handleDogNameInput(e.target.value);
                    this.updateNextButtonState();
                });
            }

            // Disable next button initially
            this.updateNextButtonState();
        }

        updateNextButtonState() {
            const currentSlide = this.slides[this.currentIndex];
            const nextButton = currentSlide.querySelector('.next-btn');
 if (nextButton.classList.contains('next-btn-no')) return;

            if (!nextButton) return;

            const isValid = this.validateCurrentSlide();
            
            nextButton.disabled = !isValid;
            nextButton.style.opacity = isValid ? '1' : '0.5';
            nextButton.style.cursor = isValid ? 'pointer' : 'not-allowed';
            nextButton.style.pointerEvents = isValid ? 'auto' : 'none';
        }

        validateCurrentSlide() {
            const currentSlide = this.slides[this.currentIndex];
            const inputs = currentSlide.querySelectorAll('input, textarea, select');
            
            let isValid = true;
            let firstInvalidInput = null;

            inputs.forEach(input => {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    const group = input.closest('.radio-group, .checkbox-group, .weight-options, .dental-options, .health-options, .yes-no-options');
                    if (group) {
                        const checkedInputs = group.querySelectorAll('input:checked');
                        if (checkedInputs.length === 0) {
                            isValid = false;
                            if (!firstInvalidInput) firstInvalidInput = input;
                        }
                    }
                } else if (input.type === 'text' || input.type === 'email' || input.type === 'textarea' || input.tagName === 'SELECT') {
                    if (!input.value.trim()) {
                        isValid = false;
                        if (!firstInvalidInput) firstInvalidInput = input;
                    }
                }
            });

            if (!isValid && firstInvalidInput) {
                firstInvalidInput.focus();
            }

            return isValid;
        }

        handleNavigation(direction) {
            const prevIndex = this.currentIndex;
            
            if (direction === 'next' && this.currentIndex >= this.totalSlides - 1) return;
            if (direction === 'prev' && this.currentIndex <= 0) return;


// Get GA event from the current slide before changing
    const currentSlide = this.slides[this.currentIndex];
    const gaEvent = currentSlide.getAttribute('data-ga-event');

    // Send GA event if available
 if (gaEvent) {
    window.dataLayer = window.dataLayer || [];
       const pageName = document.title.replace(/\s+/g, ''); 
    const modifiedGaEvent = `${gaEvent}__${pageName}`;
    const data = {
        event_category: 'Quiz',
        direction,
        fromSlide: prevIndex,
        toSlide: this.currentIndex
    };

    window.dataLayer.push({
        event: gaEvent,
        ...data
    });

    gtag('event', gaEvent, data);
 TriplePixel('custom', modifiedGaEvent, {
        productId: pageName
    });
}


            // Don't allow navigation if validation fails (unless next-btn-no)
            const nextButton = this.slides[this.currentIndex].querySelector('.next-btn');
            if (direction === 'next' && !nextButton?.classList.contains('next-btn-no') && !this.validateCurrentSlide()) {
                return;
            }

            // Update current index first
            this.currentIndex += direction === 'next' ? 1 : -1;

            // Update progress based on direction
            if (direction === 'prev') {
                // When going back, update progress to previous slide
                this.updateProgress();
            } else {
                // When going forward, update progress to next slide
                this.updateProgress();
            }

            // Wait 300ms before changing slides
            setTimeout(() => {
                this.slides[prevIndex].style.display = 'none';
                this.slides[this.currentIndex].style.display = 'block';
                this.updateNextButtonState();
                
             
            }, 400);
        }

        updateProgress(isInitial = false) {
            const currentStep = this.progressSteps[this.currentIndex];
            if (!currentStep) return;

            this.progressBars.forEach(bar => {
                const progressElement = bar.querySelector('.progress');
                const progressSpan = progressElement.querySelector('span');
                if (!progressElement || !progressSpan) return;

                if (isInitial) {
                    progressElement.style.width = '0%';
                    progressSpan.textContent = '0%';
                    setTimeout(() => {
                        progressElement.style.transition = 'width 0.5s ease-in-out';
                        progressElement.style.width = `${currentStep.end}%`;
                        progressSpan.textContent = `${currentStep.end}%`;
                    }, 100);
                } else {
                    progressElement.style.width = `${currentStep.end}%`;
                    progressSpan.textContent = `${currentStep.end}%`;
                }
            });

           
        }

        handleAnswerSelection(input) {
            const key = input.dataset.store;
            if (!key) return;

            if (input.type === 'checkbox') {
                this.handleCheckboxSelection(input, key);
            } else if (input.type === 'radio') {
                this.handleRadioSelection(input, key);
            } else {
                this.answers[key] = input.value;
            }

            this.saveAnswers();
            this.logEvent('answer_selected', {
                question: key,
                answer: this.answers[key]
            });
        }

        handleCheckboxSelection(input, key) {
            if (!this.answers[key]) this.answers[key] = [];
            
            const label = input.closest('label');
            if (input.checked) {
                this.answers[key].push(input.value);
                label?.classList.add('active');
            } else {
                this.answers[key] = this.answers[key].filter(v => v !== input.value);
                label?.classList.remove('active');
            }
        }

        handleRadioSelection(input, key) {
            this.answers[key] = input.value;
            
            const group = input.closest('.radio-group, .weight-options, .dental-options, .health-options, .yes-no-options');
            if (group) {
                group.querySelectorAll('label').forEach(l => l.classList.remove('active'));
                input.closest('label')?.classList.add('active');
            }

            this.logEvent('radio_selected', {
                question: key,
                answer: input.value,
                group: group?.className
            });
        }

        handleDogNameInput(value) {
            this.answers.dogName = value;
            this.saveAnswers();
            this.updateDynamicText(value);
        }

        updateDynamicText(dogName) {
            document.querySelectorAll('.dynamic-text').forEach(element => {
                const template = element.dataset.template;
                if (template) {
                    element.innerHTML = template.replace('[dog_name]', `<span class="dog-name">${dogName}</span>`);
                }
            });
        }

        saveAnswers() {
            localStorage.setItem('dogQuizAnswers', JSON.stringify(this.answers));
        }

        loadSavedAnswers() {
            const saved = localStorage.getItem('dogQuizAnswers');
            return saved ? JSON.parse(saved) : {};
        }

        restoreSavedState() {
            Object.entries(this.answers).forEach(([key, value]) => {
                const inputs = document.querySelectorAll(`[data-store="${key}"]`);
                inputs.forEach(input => {
                    if (input.type === 'checkbox') {
                        input.checked = Array.isArray(value) && value.includes(input.value);
                        if (input.checked) {
                            input.closest('label')?.classList.add('active');
                        }
                    } else if (input.type === 'radio') {
                        input.checked = input.value === value;
                        if (input.checked) {
                            input.closest('label')?.classList.add('active');
                        }
                    } else {
                        input.value = value;
                    }
                });
            });
        }

        logEvent(eventName, data = {}) {
            const timestamp = new Date().toISOString();
            const logData = {
                event: eventName,
                timestamp,
                slideIndex: this.currentIndex,
                ...data
            };

        
        }

        async submitForm(email) {
            const formData = {
                ...this.answers,
                email: email
            };

         

            try {
                // Send data to PHP endpoint
                const response = await fetch('https://hook.eu1.make.com/41wz8kcbi55l58kainny1r65aut5pjfu', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                // Get the selected problem from answers
                const selectedProblem = this.answers.problem || 'unknown';
                
                // Get redirect URL and delay from data attributes
                const thankYouScreen = document.querySelector('.quiz-thank-you-screen');
                const redirectUrl = thankYouScreen.dataset.redirectUrl || '/pages/quiz';
                const redirectDelay = parseInt(thankYouScreen.dataset.redirectDelay) || 3000;

                // Show thank you screen first
                this.showThankYouScreen();

                // Wait for thank you screen to be visible
                await new Promise(resolve => setTimeout(resolve, 500));

                // Start progress bar animation
                const progressBar = thankYouScreen.querySelector('.progress-bar-thank-you .progress');
                const progressText = thankYouScreen.querySelector('.progress-bar-thank-you .progress span');
                
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 1;
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        const finalUrl = `${redirectUrl}?problem=${encodeURIComponent(selectedProblem)}`;
                        window.location.href = finalUrl;
                    }
                }, redirectDelay / 100);

                // Get GA event from the current slide before redirecting
        const currentSlide = this.slides[this.currentIndex];
        const gaEvent = currentSlide.getAttribute('data-ga-event');
        const pageName = document.title.replace(/\s+/g, '');
        const modifiedGaEvent = `${gaEvent}__${pageName}`;

        TriplePixel('custom', modifiedGaEvent, {
            productId: pageName
        });

              
                // Clear saved answers
                localStorage.removeItem('dogQuizAnswers');
                this.logEvent('form_submitted', { problem: selectedProblem });
                return true;
            } catch (error) {
                console.error('Error:', error);
                // Still show thank you screen even if there's an error
                this.showThankYouScreen();
                return false;
            }
        }

        showThankYouScreen() {
            // Hide all quiz slides
            this.slides.forEach(slide => {
                slide.style.display = 'none';
            });

            // Show thank you screen
            const thankYouScreen = document.querySelector('.quiz-thank-you-screen');
            if (thankYouScreen) {
                thankYouScreen.style.display = 'block';

                const parent = thankYouScreen.parentElement;
        if (parent) {
            parent.style.display = 'block';
        }
                // Reset progress bar
                const progressBar = thankYouScreen.querySelector('.progress-bar-thank-you .progress');
                const progressText = thankYouScreen.querySelector('.progress-bar-thank-you .progress span');
                if (progressBar && progressText) {
                    progressBar.style.width = '0%';
                    progressText.textContent = '0%';
                }
            }
        }

        async handleSubmit() {
            const emailInput = document.querySelector('input[type="email"]');
            if (!emailInput) {
                console.error('Email input not found');
                return;
            }

            const email = emailInput.value.trim();
            if (!email) {
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Please enter your email address';
                emailInput.parentNode.appendChild(errorMessage);
                setTimeout(() => errorMessage.remove(), 3000);
                return;
            }

            try {
                await this.submitForm(email);
            } catch (error) {
                console.error('Error submitting form:', error);
                // Show error message but still redirect
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Error submitting form. Please try again.';
                emailInput.parentNode.appendChild(errorMessage);
                setTimeout(() => errorMessage.remove(), 3000);
            }
        }

        initializeBreedSelect() {
            const breedSelect = document.querySelector('.breed-select');
            const optionsContainer = document.querySelector('.breed-select-options');
            if (!breedSelect || !optionsContainer) return;

            // Add data-store if not exists
            if (!breedSelect.dataset.store) {
                breedSelect.dataset.store = 'breed';
            }

            // Load breeds
            this.loadBreedList(optionsContainer, breedSelect);

            // Search functionality
            breedSelect.addEventListener('focus', () => {
                optionsContainer.style.display = 'block';
                this.logEvent('breed_search_focused');
            });

            breedSelect.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                optionsContainer.style.display = 'block';
                
                Array.from(optionsContainer.children).forEach(option => {
                    const matches = option.textContent.toLowerCase().includes(searchTerm);
                    option.style.display = matches ? 'block' : 'none';
                });

                this.logEvent('breed_search', { searchTerm });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!breedSelect.contains(e.target) && !optionsContainer.contains(e.target)) {
                    optionsContainer.style.display = 'none';
                }
            });

            // Prevent closing when clicking inside the dropdown
            optionsContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        async loadBreedList(container, input) {
            try {
                const response = await fetch('https://dog.ceo/api/breeds/list/all');
                const data = await response.json();
                const breeds = Object.keys(data.message);

                this.logEvent('breeds_loaded', { count: breeds.length });

                breeds.forEach(breed => {
                    const option = document.createElement('div');
                    option.className = 'breed-option';
                    option.textContent = breed;
                    
                    option.addEventListener('click', () => {
                        input.value = breed;
                        this.handleAnswerSelection({
                            type: 'text',
                            value: breed,
                            dataset: { store: 'breed' }
                        });
                        container.style.display = 'none';
                        this.logEvent('breed_selected', { breed });
                    });
                    
                    container.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading dog breeds:', error);
                this.logEvent('breeds_load_error', { error: error.message });
            }
        }
    }

    // Make classes available globally
    window.ProgressBarAnimator = ProgressBarAnimator;
    window.DogQuiz = DogQuiz;

    // Initialize quiz when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        window.quizManager = new DogQuiz();
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const quizContainer = document.querySelector(".quiz-container");
    if (quizContainer) {
        setTimeout(() => {
            quizContainer.classList.add("show");
        }, 250);
    }

    const pageName = document.title.replace(/\s+/g, '');
    const modifiedGaEvent = `quiz_view__${pageName}`;

    TriplePixel('custom', modifiedGaEvent, {
        productId: pageName
    });


});
