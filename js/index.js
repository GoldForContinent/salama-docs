 // Initialize AOS (Animate On Scroll)
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
    
    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
    
    // Mobile Navigation Toggle
    function toggleMobileNav() {
      const mobileNav = document.getElementById('mobileNav');
      const hamburger = document.querySelector('.hamburger i');
      
      mobileNav.classList.toggle('active');
      
      if (mobileNav.classList.contains('active')) {
        hamburger.classList.remove('fa-bars');
        hamburger.classList.add('fa-times');
      } else {
        hamburger.classList.remove('fa-times');
        hamburger.classList.add('fa-bars');
      }
    }
    
    // Mobile services dropdown toggle
    function toggleMobileServices() {
      const servicesMenu = document.getElementById('mobileServicesMenu');
      const arrow = document.getElementById('mobileServicesArrow');
      
      servicesMenu.classList.toggle('active');
      
      if (servicesMenu.classList.contains('active')) {
        arrow.style.transform = 'rotate(180deg)';
      } else {
        arrow.style.transform = 'rotate(0deg)';
      }
    }
    
    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
      const mobileNav = document.getElementById('mobileNav');
      const hamburger = document.querySelector('.hamburger');
      
      if (!mobileNav.contains(event.target) && !hamburger.contains(event.target)) {
        mobileNav.classList.remove('active');
        const hamburgerIcon = document.querySelector('.hamburger i');
        hamburgerIcon.classList.remove('fa-times');
        hamburgerIcon.classList.add('fa-bars');
      }
    });
    
    // Hero background animation
    const hero = document.querySelector('.hero');
    const backgrounds = [
      'assets/slideimage1.jpg',
      'assets/slideimage2.jpg',
      'assets/slideimage3.jpg',
      'assets/slideimage4.jpg'
    ];
    let currentBg = 0;
    
    function changeBackground() {
      currentBg = (currentBg + 1) % backgrounds.length;
      hero.style.backgroundImage = `linear-gradient(135deg, rgba(0, 100, 0, 0.8), rgba(0, 80, 0, 0.9)), url(${backgrounds[currentBg]})`;
    }
    
    // Change background every 5 seconds
    setInterval(changeBackground, 5000);
    
    // Testimonial Slider
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    let currentTestimonial = 0;
    let testimonialInterval;
    
    function showTestimonial(n) {
      testimonialSlides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      
      currentTestimonial = (n + testimonialSlides.length) % testimonialSlides.length;
      testimonialSlides[currentTestimonial].classList.add('active');
      dots[currentTestimonial].classList.add('active');
    }
    
    function nextTestimonial() {
      showTestimonial(currentTestimonial + 1);
    }
    
    function prevTestimonial() {
      showTestimonial(currentTestimonial - 1);
    }
    
    // Dot click event
    dots.forEach(dot => {
      dot.addEventListener('click', function() {
        showTestimonial(parseInt(this.getAttribute('data-slide')));
        resetTestimonialInterval();
      });
    });
    
    // Arrow click events
    nextBtn.addEventListener('click', function() {
      nextTestimonial();
      resetTestimonialInterval();
    });
    
    prevBtn.addEventListener('click', function() {
      prevTestimonial();
      resetTestimonialInterval();
    });
    
    // Auto-rotate testimonials
    function startTestimonialInterval() {
      testimonialInterval = setInterval(nextTestimonial, 5000);
    }
    
    function resetTestimonialInterval() {
      clearInterval(testimonialInterval);
      startTestimonialInterval();
    }
    
    // Initialize
    showTestimonial(0);
    startTestimonialInterval();
    
    // Pause on hover
    const testimonialSlider = document.querySelector('.testimonial-slider');
    testimonialSlider.addEventListener('mouseenter', () => clearInterval(testimonialInterval));
    testimonialSlider.addEventListener('mouseleave', startTestimonialInterval);
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });
    
    // Counter animation function
    function animateCounter(element, target, duration = 2000, suffix = '') {
      let start = 0;
      const increment = target / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          element.textContent = target.toLocaleString() + suffix;
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(start).toLocaleString() + suffix;
        }
      }, 16);
    }
    
    // Intersection Observer for stats animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const statItems = entry.target.querySelectorAll('.stat-item');
          
          // Detect mobile for optimized timing
          const isMobile = window.innerWidth <= 768;
          const animationDelay = isMobile ? 150 : 200;
          const countDuration = isMobile ? 1500 : 2000;
          
          statItems.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add('animate');
              
              // Start counter animation
              const numberElement = item.querySelector('.stat-number');
              const target = parseInt(item.dataset.target);
              const suffix = item.dataset.suffix || '';
              
              animateCounter(numberElement, target, countDuration, suffix);
            }, index * animationDelay);
          });
          
          // Stop observing after animation starts
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: window.innerWidth <= 768 ? 0.2 : 0.3,
      rootMargin: '0px 0px -50px 0px'
    });
    
    // Start observing the stats section
    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }
