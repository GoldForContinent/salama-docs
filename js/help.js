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
    
    // Search functionality
    const searchForm = document.querySelector('.search-container form');
    if (searchForm) {
      searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchTerm = this.querySelector('input').value;
        alert(`Searching for: "${searchTerm}". In a real implementation, this would search the help articles.`);
      });
    }
