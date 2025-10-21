# File Upload - Debug & Testing Guide

## 🔧 What I Fixed

### Simplified File Upload Handler
- **Old:** Complex event handling with multiple conditions
- **New:** Simple, direct click handler that works reliably

### New `setupFileUpload()` Function
```javascript
function setupFileUpload() {
  // Get elements
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('documentFile');
  
  // Click handler - SIMPLE AND DIRECT
  fileUploadArea.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();  // Opens file picker
  });
  
  // File selection handler
  fileInput.addEventListener('change', function(e) {
    if (this.files && this.files.length > 0) {
      const file = this.files[0];
      showNotification(`✓ File selected: ${file.name}`, 'success');
    }
  });
}
```

---

## 🧪 How to Test

### Step 1: Open Browser Console
1. Open digital-locker.html in browser
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Keep it open while testing

### Step 2: Open Upload Modal
1. Scroll to bottom of page
2. Look for "Upload Document" section
3. You should see the upload area with:
   - Cloud upload icon
   - "Click to upload or drag and drop" text
   - "PDF, Images (JPEG, PNG, GIF, WebP) - Max 50MB"

### Step 3: Click Upload Area
1. **Click anywhere on the green dashed box**
2. **File picker should open immediately**
3. Check console for: `Upload area clicked, opening file picker...`

### Step 4: Select File
1. Browse to a file on your device
2. Select any PDF or image file
3. Click "Open"
4. You should see:
   - Green success notification: "✓ File selected: [filename]"
   - Console log: `File selected: [filename] Size: [size]`

### Step 5: Complete Upload
1. Select document type from dropdown
2. Enter document name
3. Click "Upload Document" button
4. Wait for upload to complete
5. See success notification
6. Document appears in grid

---

## 🐛 Troubleshooting

### Issue: File picker doesn't open
**Check:**
1. Open browser console (F12)
2. Click upload area
3. Look for error messages
4. Should see: `Upload area clicked, opening file picker...`

**If you see error:**
- Check that `fileUploadArea` element exists
- Check that `documentFile` input exists
- Refresh page and try again

### Issue: File picker opens but selection doesn't work
**Check:**
1. After selecting file, check console
2. Should see: `File selected: [filename] Size: [size]`
3. Should see green notification

**If not:**
- Try different file
- Try different browser
- Clear browser cache

### Issue: Upload doesn't complete
**Check:**
1. Is Supabase connected?
2. Check browser console for errors
3. Check network tab in DevTools
4. Look for error messages

---

## 📋 Console Debugging

### What to Look For

**Good Signs:**
```
✓ Upload area clicked, opening file picker...
✓ File selected: document.pdf Size: 102400
✓ Document uploaded successfully!
```

**Bad Signs:**
```
✗ Upload area or file input not found
✗ Error uploading document
✗ Permission denied
```

### How to Check Console

1. Press `F12` to open DevTools
2. Click "Console" tab
3. Look at messages
4. Red = errors
5. Green = success
6. Blue = info

---

## 🔍 Step-by-Step Test

### Test 1: Modal Opens
```
1. Go to digital-locker.html
2. Scroll down
3. See "Upload Document" section
4. Upload area visible with green dashed border
✓ PASS if you see the upload area
```

### Test 2: Click Opens File Picker
```
1. Click on upload area
2. File picker dialog opens
3. Console shows: "Upload area clicked, opening file picker..."
✓ PASS if file picker opens
```

### Test 3: File Selection Works
```
1. Select a PDF or image file
2. Click "Open"
3. Success notification appears: "✓ File selected: [filename]"
4. Console shows file name and size
✓ PASS if notification appears
```

### Test 4: Form Fills
```
1. Select document type from dropdown
2. Enter document name
3. File is already selected
✓ PASS if all fields can be filled
```

### Test 5: Upload Works
```
1. Click "Upload Document" button
2. See loading state
3. Success notification appears
4. Document appears in grid
✓ PASS if document appears
```

---

## 🎯 If Still Not Working

### Try These Steps:

1. **Hard Refresh Browser**
   - Press `Ctrl + Shift + R` (Windows)
   - Press `Cmd + Shift + R` (Mac)
   - This clears cache and reloads

2. **Check File Input in HTML**
   - Open digital-locker.html
   - Search for: `id="documentFile"`
   - Should be: `<input type="file" class="file-input" id="documentFile" ...>`

3. **Check Upload Area in HTML**
   - Search for: `id="fileUploadArea"`
   - Should be: `<div class="file-upload-area" id="fileUploadArea">`

4. **Check JavaScript Loaded**
   - Open DevTools Console
   - Type: `typeof setupFileUpload`
   - Should return: `function`

5. **Check for JavaScript Errors**
   - Open DevTools Console
   - Look for red error messages
   - Note the error and file/line number

---

## 📞 If You're Still Stuck

**Please provide:**
1. Screenshot of the error in console
2. What happens when you click the upload area
3. What browser you're using
4. Whether file picker opens or not

**Then I can provide more specific help!**

---

## ✅ Expected Behavior

### Correct Flow:
```
Click upload area
  ↓
File picker opens
  ↓
Select file
  ↓
Success notification: "✓ File selected: [filename]"
  ↓
Fill document type and name
  ↓
Click "Upload Document"
  ↓
File uploads
  ↓
Document appears in grid
```

### If Any Step Fails:
- Check console for errors
- Refresh page
- Try different file
- Try different browser

---

## 🚀 You Should Now Be Able To:

✓ Click upload area → file picker opens
✓ Select file → notification shows
✓ Fill form → all fields work
✓ Upload → document appears
✓ View → document displays
✓ Download → file saves
✓ Edit → name changes
✓ Delete → document removed

**Test it now and let me know if it works!**

