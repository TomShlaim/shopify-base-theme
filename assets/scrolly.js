document.addEventListener('DOMContentLoaded', () => {
    const outtester = document.getElementsByClassName('scrolly');
    for (let i = 0; i < outtester.length; i++) {
        scrollification('scrolly', {
            i: i,
            scrollCont: '.carouselPre',
            itemsScroll: '.itemsC',
            customButtons: true,
            butLeft: '#left',
            butRight: '#right'
        });
    }

    function scrollification(mainConter, setup = {i, scrollCont, itemsScroll, customButtons, butLeft, butRight}) {
        let out;
        if (setup.i == null) {
            out = document.getElementsByClassName(mainConter)[0];
        } else {
            out = document.getElementsByClassName(mainConter)[setup.i];
        }

        const itemElements = out.querySelectorAll(setup.itemsScroll);
        const itemCount = itemElements.length;

        if (setup.customButtons === true) {
            const leftButton = out.querySelector(setup.butLeft);
            const rightButton = out.querySelector(setup.butRight);

            // Hide buttons if there are less than 4 items
            if (itemCount < 4) {
                leftButton.style.display = 'none';
                rightButton.style.display = 'none';
            }

            $(leftButton).click(() => { getBack(); });
            $(rightButton).click(() => { getNext(); });
        }

        const scrollContainer = out.querySelector(setup.scrollCont);

        function getNext() {
            for (let i = 0; i < itemElements.length; i++) {
                if (itemElements[i].getBoundingClientRect().left <= scrollContainer.getBoundingClientRect().left + 600) {
                    const index = itemElements[i].offsetWidth;
                    $(scrollContainer).scrollLeft($(scrollContainer).scrollLeft() + index);
                    break;
                }
            }
        }

        function getBack() {
            for (let i = 1; i < itemElements.length; i++) {
                if (itemElements[i].getBoundingClientRect().left < scrollContainer.getBoundingClientRect().left + 600) {
                    const index = itemElements[i - 1].offsetWidth;
                    $(scrollContainer).scrollLeft($(scrollContainer).scrollLeft() - index);
                    break;
                }
            }
        }

        // Intersection Observer for autoplay videos
        const videos = document.querySelectorAll('.myVideo');
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.9
        };

        const callback = (entries, observer) => {
            const viewportWidth = window.innerWidth;

            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (viewportWidth > 890) {
                        video.addEventListener("mouseover", () => {
                            video.play();
                        });
                        video.addEventListener("mouseout", () => {
                            video.pause();
                        });
                    } else {
                        video.play();
                    }
                } else {
                    video.pause();
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        videos.forEach(video => observer.observe(video));
    }

    // Handle mute/unmute functionality
    document.querySelectorAll('.soundButton').forEach(button => {
        const video = button.parentElement.querySelector('.myVideo');
        
        if (video) {
            // Set initial state
            video.setAttribute('muted', '');
            video.muted = true;
            button.innerHTML = '<i class="fas fa-volume-mute"></i>';
            button.classList.add('muted');
            
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (video.hasAttribute('muted')) {
                    // Unmute
                    video.removeAttribute('muted');
                    video.muted = false;
                    button.innerHTML = '<i class="fas fa-volume-up"></i>';
                    button.classList.remove('muted');
                    console.log('Video unmuted');
                } else {
                    // Mute
                    video.setAttribute('muted', '');
                    video.muted = true;
                    button.innerHTML = '<i class="fas fa-volume-mute"></i>';
                    button.classList.add('muted');
                    console.log('Video muted');
                }
            };
        }
    });

    const slogos = document.querySelector(".slogos");
    if (slogos) {
        const originalContent = slogos.innerHTML;
        slogos.innerHTML += originalContent;
        const singleSetWidth = slogos.scrollWidth / 2;
        const scrollSpeed = 50;
        const animationDuration = singleSetWidth / scrollSpeed;
        slogos.style.animationDuration = `${animationDuration}s`;
    }
});