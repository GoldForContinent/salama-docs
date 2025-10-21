# Quick Test Steps - File Upload

## 🚀 Follow These Exact Steps

### Step 1: Hard Refresh Browser
- Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Wait for page to fully load
- You should see the Digital Locker page

---

### Step 2: Open Browser Console
- Press `F12` to open Developer Tools
- Click "Console" tab
- Keep it open while testing

---

### Step 3: Scroll to Upload Section
- Scroll down to the bottom of the page
- You should see a section with:
  - "Upload Document" heading
  - A green dashed box with cloud icon
  - Text: "Click to upload or drag and drop"
  - Text: "PDF, Images (JPEG, PNG, GIF, WebP) - Max 50MB"

---

### Step 4: Click the Upload Area
- **Click anywhere inside the green dashed box**
- A file picker dialog should open
- In console, you should see: `Upload area clicked, opening file picker...`

**If file picker opens → GOOD! Continue to Step 5**

**If file picker doesn't open → Check console for errors**

---

### Step 5: Select a File
- In the file picker dialog:
  - Navigate to a file on your device
  - Select a PDF or image file (JPG, PNG, GIF, WebP)
  - Click "Open"

---

### Step 6: Check Notification
- You should see a **green success notification** at the top
- It should say: `✓ File selected: [filename]`
- In console, you should see: `File selected: [filename] Size: [size]`

**If notification appears → GOOD! Continue to Step 7**

**If notification doesn't appear → Check console for errors**

---

### Step 7: Fill Form
- Select a **Document Type** from the dropdown
- Enter a **Document Name** (e.g., "My ID Card")
- The file is already selected

---

### Step 8: Upload
- Click the **"Upload Document"** button
- You should see a loading state
- Wait for upload to complete

---

### Step 9: Check Success
- You should see a **green success notification**
- It should say: `Document uploaded successfully!`
- The modal should close
- Scroll up to see your document in the grid

---

## ✅ If Everything Works

You should see:
- ✓ File picker opens when clicking
- ✓ Green notification when file selected
- ✓ Form fills properly
- ✓ Upload completes
- ✓ Document appears in grid
- ✓ No errors in console

**Congratulations! Upload is working!** 🎉

---

## ❌ If Something Doesn't Work

### File Picker Doesn't Open
1. Check console for errors
2. Hard refresh page (Ctrl+Shift+R)
3. Try clicking again
4. If still doesn't work, screenshot the console error

### File Selection Doesn't Show Notification
1. Check console for errors
2. Try selecting a different file
3. Try a different file type (PDF vs Image)
4. If still doesn't work, screenshot the console error

### Upload Doesn't Complete
1. Check console for errors
2. Check network tab in DevTools
3. Make sure you're logged in
4. If still doesn't work, screenshot the console error

---

## 📸 What to Screenshot If It Doesn't Work

1. **Console tab** showing any red error messages
2. **The upload area** showing what you see
3. **Any notifications** that appear
4. **The file picker** if it opens

---

## 💡 Quick Tips

- **Hard refresh** clears cache: `Ctrl+Shift+R`
- **Console** shows errors: Press `F12`
- **Try different file** if one doesn't work
- **Try different browser** if Chrome doesn't work

---

## 🎯 Expected Result

After following all steps:
- ✓ File picker opens on click
- ✓ File selected notification appears
- ✓ Upload completes
- ✓ Document appears in grid
- ✓ No errors in console

**Test it now!** 🚀

