 // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      this.querySelector('i').classList.toggle('fa-bars');
      this.querySelector('i').classList.toggle('fa-times');
    });

    // Table of Contents Navigation
    const tocLinks = document.querySelectorAll('.toc-links a');
    const sections = document.querySelectorAll('.privacy-section');
    
    // Smooth scrolling for TOC links
    tocLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        // Update active link
        tocLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Scroll to section
        targetSection.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Highlight current section in TOC
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          const correspondingLink = document.querySelector(`.toc-links a[href="#${id}"]`);
          
          if (correspondingLink) {
            tocLinks.forEach(link => link.classList.remove('active'));
            correspondingLink.classList.add('active');
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50% 0px'
    });

    // Observe all sections
    sections.forEach(section => {
      observer.observe(section);
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', function(event) {
      if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
        navLinks.classList.remove('active');
        hamburger.querySelector('i').classList.remove('fa-times');
        hamburger.querySelector('i').classList.add('fa-bars');
      }
    });
