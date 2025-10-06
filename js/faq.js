// Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.getElementById('mobileNav');
    
    hamburger.addEventListener('click', function() {
      mobileNav.classList.toggle('active');
      this.querySelector('i').classList.toggle('fa-bars');
      this.querySelector('i').classList.toggle('fa-times');
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      
      question.addEventListener('click', () => {
        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        
        // Toggle current item
        item.classList.toggle('active');
      });
    });

    // Search functionality
    const searchBox = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    searchButton.addEventListener('click', performSearch);
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    function performSearch() {
      const searchTerm = searchBox.value.toLowerCase();
      if (searchTerm.trim() === '') return;
      
      let foundMatch = false;
      
      // Search through all FAQ items
      faqItems.forEach(item => {
        const question = item.querySelector('.faq-question').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.classList.add('active');
          item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Highlight matching text
          highlightText(item, searchTerm);
          foundMatch = true;
        } else {
          item.classList.remove('active');
        }
      });
      
      if (!foundMatch) {
        alert('No matching questions found. Try different keywords or contact our support team.');
      }
    }
    
    function highlightText(element, searchTerm) {
      const textElements = element.querySelectorAll('p, li, td, th');
      
      textElements.forEach(textElement => {
        const text = textElement.textContent;
        const regex = new RegExp(searchTerm, 'gi');
        const newText = text.replace(regex, match => `<span class="highlight">${match}</span>`);
        textElement.innerHTML = newText;
      });
    }
    
    // Scroll to category
    function scrollToCategory(categoryId) {
      const element = document.getElementById(categoryId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        
        // Open first FAQ item in category
        const firstItem = element.nextElementSibling;
        if (firstItem && firstItem.classList.contains('faq-item')) {
          faqItems.forEach(item => item.classList.remove('active'));
          firstItem.classList.add('active');
        }
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
    
    // Animate elements when they come into view
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.faq-item, .category-card');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    };
    
    // Set initial styles for animation
    document.querySelectorAll('.faq-item, .category-card').forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }); // Add scroll event listener
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);

