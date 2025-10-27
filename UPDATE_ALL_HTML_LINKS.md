# 🔧 UPDATE ALL HTML FILES - CLEAN URLS

## 📋 Files to Update

All 17 HTML files need their internal links updated:

1. ✅ `dashboard.html` - DONE
2. ✅ `reportlost.html` - DONE
3. ✅ `reportfound.html` - DONE
4. ✅ `digital-locker.html` - DONE
5. ❌ `index.html` - PENDING
6. ❌ `loginpage.html` - PENDING
7. ❌ `signup.html` - PENDING
8. ❌ `about.html` - PENDING
9. ❌ `contact.html` - PENDING
10. ❌ `faq.html` - PENDING
11. ❌ `help.html` - PENDING
12. ❌ `privacy.html` - PENDING
13. ❌ `terms.html` - PENDING
14. ❌ `settings.html` - PENDING
15. ❌ `admin-dashboard.html` - PENDING
16. ❌ `admin-login.html` - PENDING
17. ❌ `debug.html` - PENDING

---

## 🔄 URL Mapping

| Old URL | New URL |
|---------|---------|
| `index.html` | `/` |
| `dashboard.html` | `/dashboard` |
| `reportlost.html` | `/reportlost` |
| `reportfound.html` | `/reportfound` |
| `digital-locker.html` | `/digital-locker` |
| `loginpage.html` | `/login` |
| `signup.html` | `/signup` |
| `about.html` | `/about` |
| `contact.html` | `/contact` |
| `faq.html` | `/faq` |
| `help.html` | `/help` |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `settings.html` | `/settings` |
| `admin-dashboard.html` | `/admin-dashboard` |
| `admin-login.html` | `/admin-login` |
| `debug.html` | `/debug` |

---

## 🔍 Search & Replace Patterns

### **Pattern 1: href with .html**
```
Find: href="([^"]*\.html)"
Replace: href="/$1" (remove .html and add /)
```

### **Pattern 2: onclick with .html**
```
Find: onclick="window.location.href='([^']*\.html)'"
Replace: onclick="window.location.href='/$1'" (remove .html and add /)
```

### **Pattern 3: Specific files**
```
homepage.html → /
index.html → /
dashboard.html → /dashboard
reportlost.html → /reportlost
reportfound.html → /reportfound
digital-locker.html → /digital-locker
loginpage.html → /login
signup.html → /signup
about.html → /about
contact.html → /contact
faq.html → /faq
help.html → /help
privacy.html → /privacy
terms.html → /terms
settings.html → /settings
admin-dashboard.html → /admin-dashboard
admin-login.html → /admin-login
debug.html → /debug
```

---

## 📝 Manual Update Instructions

For each HTML file:

1. **Open the file**
2. **Find all instances of `.html`**
3. **Replace according to mapping above**
4. **Save the file**

### **Example: index.html**

**Before:**
```html
<a href="homepage.html">Home</a>
<a href="about.html">About Us</a>
<a href="loginpage.html">Login</a>
<a href="signup.html">Sign Up</a>
```

**After:**
```html
<a href="/">Home</a>
<a href="/about">About Us</a>
<a href="/login">Login</a>
<a href="/signup">Sign Up</a>
```

---

## 🚀 Automated Update (Using Find & Replace)

### **Step 1: Use IDE Find & Replace**

1. Open VS Code / IDE
2. Press `Ctrl+H` (Find & Replace)
3. Use these patterns:

#### **Replace Pattern 1: href="...html"**
```
Find: href="([^"]*\.html)"
Replace: href="/$1"
```
Then manually fix:
- `href="/index.html"` → `href="/"`
- `href="/homepage.html"` → `href="/"`
- `href="/loginpage.html"` → `href="/login"`

#### **Replace Pattern 2: onclick with .html**
```
Find: onclick="window\.location\.href='([^']*\.html)'"
Replace: onclick="window.location.href='/$1'"
```
Then manually fix specific files.

---

## 📊 Files & Their Links

### **index.html**
Links to update:
- `homepage.html` → `/`
- `about.html` → `/about`
- `services.html` → `/services`
- `report-lost.html` → `/reportlost`
- `register-found.html` → `/reportfound`
- `track-recovery.html` → `/track-recovery`
- `delivery-services.html` → `/delivery-services`
- `loginpage.html` → `/login`
- `signup.html` → `/signup`

### **loginpage.html**
Links to update:
- `signup.html` → `/signup`
- `dashboard.html` → `/dashboard`
- `index.html` → `/`

### **signup.html**
Links to update:
- `loginpage.html` → `/login`
- `dashboard.html` → `/dashboard`
- `index.html` → `/`

### **about.html**
Links to update:
- `index.html` → `/`
- `contact.html` → `/contact`
- `loginpage.html` → `/login`

### **contact.html**
Links to update:
- `index.html` → `/`
- `about.html` → `/about`
- `loginpage.html` → `/login`

### **faq.html**
Links to update:
- `index.html` → `/`
- `help.html` → `/help`
- `contact.html` → `/contact`

### **help.html**
Links to update:
- `index.html` → `/`
- `faq.html` → `/faq`
- `contact.html` → `/contact`

### **privacy.html**
Links to update:
- `index.html` → `/`
- `terms.html` → `/terms`
- `loginpage.html` → `/login`

### **terms.html**
Links to update:
- `index.html` → `/`
- `privacy.html` → `/privacy`
- `loginpage.html` → `/login`

### **settings.html**
Links to update:
- `dashboard.html` → `/dashboard`
- `index.html` → `/`

### **admin-dashboard.html**
Links to update:
- `admin-login.html` → `/admin-login`
- `dashboard.html` → `/dashboard`

### **admin-login.html**
Links to update:
- `admin-dashboard.html` → `/admin-dashboard`
- `index.html` → `/`

### **debug.html**
Links to update:
- `index.html` → `/`
- `dashboard.html` → `/dashboard`

---

## ✅ Verification Checklist

After updating all files:

- [ ] All `href="*.html"` changed to `href="/..."`
- [ ] All `onclick="...*.html"` changed to `onclick=".../.../"`
- [ ] `index.html` links point to `/`
- [ ] `loginpage.html` links point to `/login`
- [ ] `signup.html` links point to `/signup`
- [ ] All other files updated correctly
- [ ] No broken links remain
- [ ] vercel.json has all mappings

---

## 🧪 Testing After Updates

1. **Deploy to Vercel**
2. **Test each page:**
   - Visit `/dashboard` - should load
   - Visit `/login` - should load
   - Visit `/signup` - should load
   - Visit `/about` - should load
   - Click links - should navigate cleanly
3. **Check URLs** - no `.html` should appear
4. **Test mobile** - all links should work

---

## 📝 Summary

**Total files to update:** 13 (4 already done)

**Total links to update:** ~50+

**Time estimate:** 15-30 minutes

**Difficulty:** Easy (find & replace)

---

## 🎯 Next Steps

1. Open each remaining HTML file
2. Find all `.html` references
3. Replace with clean URLs per mapping
4. Save files
5. Deploy to Vercel
6. Test all links

---

**Status: Ready for bulk update**
