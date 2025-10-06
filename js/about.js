// Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const header = document.getElementById('mainHeader');

    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = hamburger.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = hamburger.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      });
    });

    // FAQ Functionality
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('active');
        
        // Close other open FAQs
        document.querySelectorAll('.faq-item').forEach(otherItem => {
          if(otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
          }
        });
      });
    });

    // Header scroll effect
    window.addEventListener('scroll', () => {
      if(window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Counter Animation for Impact Stats
    function animateCounters() {
      const counters = document.querySelectorAll('.counter');
      const speed = 200; // The lower the faster
      
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / speed;
        
        if(count < target) {
          counter.innerText = Math.ceil(count + increment);
          setTimeout(animateCounters, 1);
        } else {
          counter.innerText = target;
        }
      });
    }

    // Scroll animation for elements
    function animateOnScroll() {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;
        
        if(elementPosition < screenPosition) {
          element.classList.add('animated');
        }
      });
    }

    // Initialize animations
    window.addEventListener('load', () => {
      animateOnScroll();
      
      // Start counter animation when Impact section is in view
      const impactSection = document.querySelector('.impact-section');
      const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) {
          animateCounters();
          observer.unobserve(impactSection);
        }
      }, {threshold: 0.5});

      observer.observe(impactSection);
    });

    window.addEventListener('scroll', animateOnScroll);

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
