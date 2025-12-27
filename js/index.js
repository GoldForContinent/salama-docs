 // Initialize AOS (Animate On Scroll) - Temporarily disabled to prevent text flickering
    /*
    AOS.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      offset: 100,
      delay: 100
    });
    */

    // Modern scroll-based header effects
    let lastScrollTop = 0;
    const header = document.getElementById('header');

    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      // Hide/show header on scroll direction (optional modern effect)
      if (scrollTop > lastScrollTop && scrollTop > 200) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }

      lastScrollTop = scrollTop;
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

    // Modern hover effects for cards
    document.querySelectorAll('.step-card, .document-card, .feature').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector('.hero');
      if (hero) {
        const rate = scrolled * -0.5;
        hero.style.backgroundPosition = `center ${rate}px`;
      }
    });

    // Typing effect for hero text (optional enhancement)
    function typeWriter(element, text, speed = 100) {
      let i = 0;
      element.textContent = '';
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        }
      }
      type();
    }

    // Enhanced button ripple effect
    document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        this.appendChild(ripple);

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });

    // Add ripple effect CSS dynamically
    const style = document.createElement('style');
    style.textContent = `
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }

      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Smooth scroll with offset for fixed header
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const headerOffset = 100;
          const elementPosition = target.offsetTop;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Intersection Observer for section animations (temporarily disabled)
    /*
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
      sectionObserver.observe(section);
    });
    */

    // Add loading animation for page load (temporarily disabled)
    /*
    window.addEventListener('load', function() {
      document.body.classList.add('loaded');
    });
    */

    // Performance optimization: Lazy load images (temporarily disabled)
    /*
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
    */
