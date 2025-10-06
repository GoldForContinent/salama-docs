import { supabase } from './supabase.js';

const kenyanCounties = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", 
  "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", 
  "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", 
  "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", 
  "Samburu", "Trans-Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", 
  "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", 
  "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", 
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];

function autocomplete(inp, arr) {
  let currentFocus;
  inp.addEventListener("input", function(e) {
    let a, b, i, val = this.value.trim();
    closeAllLists();
    if (!val) return false;
    currentFocus = -1;
    a = document.createElement("DIV");
    a.setAttribute("id", `${this.id}-autocomplete-list`);
    a.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(a);
    const filtered = arr.filter(item => item.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
    filtered.forEach(item => {
      b = document.createElement("DIV");
      b.innerHTML = `<strong>${item.substr(0, val.length)}</strong>${item.substr(val.length)}`;
      b.innerHTML += `<input type="hidden" value="${item}">`;
      b.addEventListener("click", function() {
        inp.value = this.querySelector("input").value;
        closeAllLists();
      });
      a.appendChild(b);
    });
  });
  
  inp.addEventListener("keydown", function(e) {
    const items = document.getElementById(`${this.id}-autocomplete-list`);
    const divs = items ? items.getElementsByTagName("div") : [];
    if (e.key === "ArrowDown") {
      currentFocus = Math.min(currentFocus + 1, divs.length - 1);
      addActive(divs);
    } else if (e.key === "ArrowUp") {
      currentFocus = Math.max(currentFocus - 1, -1);
      addActive(divs);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1 && divs[currentFocus]) {
        divs[currentFocus].click();
      }
    }
  });
  
  function addActive(items) {
    if (!items || !items.length) return;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
  }
  
  function removeActive(items) {
    Array.from(items).forEach(item => {
      item.classList.remove("autocomplete-active");
    });
  }
  
  function closeAllLists(elmnt) {
    const items = document.getElementsByClassName("autocomplete-items");
    Array.from(items).forEach(item => {
      if (elmnt !== item && elmnt !== inp) {
        item.parentNode.removeChild(item);
      }
    });
  }
  
  document.addEventListener("click", (e) => closeAllLists(e.target));
}

function isValidKenyanPhone(phone) {
  return /^(\+?254|0)?[17]\d{8}$/.test(phone);
}

function isValidKenyanID(id) {
  return /^\d{7,8}$/.test(id);
}

function isValidPassport(passport) {
  return /^[A-Za-z]\d{6,7}$/i.test(passport);
}

function showError(message, targetElementId = 'id-error') {
  const errorElement = document.getElementById(targetElementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    alert(`Error: ${message}`);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize county autocomplete
  const countyInput = document.getElementById("county");
  if (countyInput) autocomplete(countyInput, kenyanCounties);

  // Citizen toggle
  const citizenToggle = {
    yes: document.getElementById('citizen-yes'),
    no: document.getElementById('citizen-no'),
    idGroup: document.getElementById('id-number-group'),
    passportGroup: document.getElementById('passport-group')
  };

  if (citizenToggle.yes && citizenToggle.no) {
    citizenToggle.yes.addEventListener('click', function() {
      this.classList.add('active');
      citizenToggle.no.classList.remove('active');
      citizenToggle.idGroup.style.display = 'block';
      citizenToggle.passportGroup.style.display = 'none';
      document.getElementById('id-number').required = true;
      document.getElementById('passport').required = false;
    });

    citizenToggle.no.addEventListener('click', function() {
      this.classList.add('active');
      citizenToggle.yes.classList.remove('active');
      citizenToggle.idGroup.style.display = 'none';
      citizenToggle.passportGroup.style.display = 'block';
      document.getElementById('id-number').required = false;
      document.getElementById('passport').required = true;
    });
  }

  // Password validation
  const password = document.getElementById('password');
  if (password) {
    const criteria = {
      length: document.getElementById('length'),
      number: document.getElementById('number'),
      special: document.getElementById('special')
    };

    password.addEventListener('input', function() {
      const value = this.value;
      criteria.length.classList.toggle('criteria-met', value.length >= 8);
      criteria.number.classList.toggle('criteria-met', /\d/.test(value));
      criteria.special.classList.toggle('criteria-met', /[!@#$%^&*]/.test(value));
    });
  }

  // Photo upload
  const photoInput = document.getElementById('photo');
  if (photoInput) {
    photoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(event) {
        const preview = document.getElementById('photo-preview');
        preview.src = event.target.result;
        preview.style.display = 'block';
        document.querySelector('.photo-preview i').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  // Form submission
  document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
      // Get form values
      const formData = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value,
        phone: document.getElementById('phone').value.trim(),
        fullName: document.getElementById('full-name').value.trim(),
        isKenyan: document.getElementById('citizen-yes').classList.contains('active'),
        idNumber: document.getElementById('id-number').value.trim(),
        passport: document.getElementById('passport').value.trim(),
        county: document.getElementById('county').value.trim(),
        address: document.getElementById('address').value.trim(),
        emergencyContact: document.getElementById('emergency-name').value.trim(),
        emergencyPhone: document.getElementById('emergency-phone').value.trim(),
        altPhone: document.getElementById('alt-phone').value.trim(),
        photoFile: document.getElementById('photo').files[0]
      };

      // Validate required fields
      if (!formData.email || !formData.phone || !formData.fullName || 
          (!formData.idNumber && !formData.passport)) {
        throw new Error('Please fill all required fields');
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate Kenyan phone
      if (!isValidKenyanPhone(formData.phone)) {
        throw new Error('Please enter a valid Kenyan phone (e.g. 0712345678)');
      }

      // Validate ID/passport
      if (formData.isKenyan && !isValidKenyanID(formData.idNumber)) {
        throw new Error('Please enter a valid Kenyan ID (7-8 digits)');
      }
      if (!formData.isKenyan && !isValidPassport(formData.passport)) {
        throw new Error('Please enter valid passport (e.g. A1234567)');
      }

      // Validate password
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(formData.password)) {
        throw new Error('Password must be 8+ chars with 1 number and 1 special char');
      }

      // 1. Sign up with auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          },
          emailRedirectTo: `${window.location.origin}/loginpage.html`
        }
      });

      if (authError) throw new Error(authError.message || 'Registration failed');
      if (!authData.user) throw new Error('No user data returned');

      // 2. Wait for session with retries
      let session = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!session && attempts < maxAttempts) {
        attempts++;
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && sessionData.session) {
          session = sessionData.session;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!session) throw new Error('Failed to establish session after retries');

      // 3. Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          id_number: formData.isKenyan ? formData.idNumber : null,
          passport_number: !formData.isKenyan ? formData.passport : null,
          county: formData.county,
          address: formData.address,
          emergency_contact: formData.emergencyContact,
          emergency_phone: formData.emergencyPhone,
          is_kenyan: formData.isKenyan,
          alt_phone: formData.altPhone || null
        });

      if (profileError) throw new Error('Failed to save profile information');

      // Handle photo upload if provided
      if (formData.photoFile) {
        const fileExt = formData.photoFile.name.split('.').pop();
        const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `profile-photos/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('profile-photos')
          .upload(filePath, formData.photoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);

          await supabase
            .from('profiles')
            .update({ profile_photo: publicUrl })
            .eq('user_id', authData.user.id);
        }
      }

      // Show success state
      document.getElementById('success-popup').classList.add('active');
      document.getElementById('signup-form').style.display = 'none';

    } catch (error) {
      console.error('Registration error:', error);
      showError(error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
});
