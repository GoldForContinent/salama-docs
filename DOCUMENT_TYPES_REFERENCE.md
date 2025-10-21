# Document Types Reference - Digital Locker

## Complete List of Supported Document Types

All document types are now synchronized with `reportfound.html` for consistency across the project.

---

## 🆔 Government Identification (5 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `national_id` | National ID Card | fa-id-card |
| `passport` | Kenyan Passport | fa-passport |
| `alien_id` | Alien ID Card | fa-id-card |
| `refugee_id` | Refugee ID | fa-id-card |
| `military_id` | Military ID | fa-id-card |

---

## 🚗 Driving & Vehicle (5 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `driving_license` | Driving License | fa-car |
| `logbook` | Vehicle Logbook | fa-book |
| `psi_certificate` | PSI Certificate | fa-certificate |
| `towing_permit` | Towing Permit | fa-file-contract |
| `badge` | PSV Badge | fa-badge |

---

## 🎓 Educational Documents (6 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `kcpe_certificate` | KCPE Certificate | fa-graduation-cap |
| `kcse_certificate` | KCSE Certificate | fa-graduation-cap |
| `university_degree` | University Degree | fa-graduation-cap |
| `college_diploma` | College Diploma/Certificate | fa-certificate |
| `transcript` | Official Transcript | fa-file-alt |
| `student_id` | Student ID Card | fa-id-card |

---

## 💼 Professional Documents (5 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `work_permit` | Work Permit | fa-file-contract |
| `professional_license` | Professional License | fa-certificate |
| `practicing_certificate` | Practicing Certificate | fa-certificate |
| `tax_pin` | KRA PIN Certificate | fa-file-invoice-dollar |
| `business_permit` | Business Permit | fa-store |

---

## 🏠 Property & Legal (5 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `title_deed` | Title Deed | fa-home |
| `lease_agreement` | Lease Agreement | fa-file-contract |
| `allotment_letter` | Land Allotment Letter | fa-file-alt |
| `court_order` | Court Order | fa-gavel |
| `power_attorney` | Power of Attorney | fa-file-signature |

---

## 💳 Financial Documents (4 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `bank_card` | Bank/ATM Card | fa-credit-card |
| `checkbook` | Checkbook | fa-book |
| `loan_agreement` | Loan Agreement | fa-file-contract |
| `insurance_policy` | Insurance Policy | fa-shield-alt |

---

## 🏥 Health Documents (5 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `birth_certificate` | Birth Certificate | fa-birthday-cake |
| `death_certificate` | Death Certificate | fa-cross |
| `marriage_certificate` | Marriage Certificate | fa-ring |
| `medical_report` | Medical Report | fa-file-medical |
| `nhif_card` | NHIF Card | fa-credit-card |

---

## 📄 Other Important (4 types)

| Type | Display Name | Icon |
|------|-------------|------|
| `will` | Will/Testament | fa-scroll |
| `adoption_papers` | Adoption Papers | fa-file-alt |
| `guardianship` | Guardianship Papers | fa-file-alt |
| `other` | Other Document | fa-file-alt |

---

## 📊 Summary

- **Total Document Types**: 39
- **Categories**: 8
- **All types synchronized** with reportfound.html ✓

---

## 🔄 Synchronization Status

| Component | Status |
|-----------|--------|
| reportfound.html | ✓ Source of truth |
| locker-helpers.js | ✓ Updated |
| QUICK_SUPABASE_SETUP_UPDATED.sql | ✓ Updated |
| Digital Locker Frontend | ⏳ Next |

---

## Usage in Code

### JavaScript (locker-helpers.js)
```javascript
import { DOCUMENT_TYPES, getDocIcon } from './locker-helpers.js';

// Get display name
const displayName = DOCUMENT_TYPES['national_id']; // "National ID Card"

// Get icon
const icon = getDocIcon('national_id'); // "fa-id-card"
```

### Supabase SQL
```sql
-- Valid document types are enforced by CHECK constraint
INSERT INTO locker_documents (
  user_id, document_name, document_type, ...
) VALUES (
  'user-id', 'My ID', 'national_id', ...
);
```

### HTML Select Dropdown
```html
<select id="documentType">
  <option value="">Select document type</option>
  <option value="national_id">National ID Card</option>
  <option value="passport">Kenyan Passport</option>
  <!-- etc -->
</select>
```

---

## ✅ Files Updated

1. **js/locker-helpers.js**
   - Updated DOCUMENT_TYPES constant (39 types)
   - Updated getDocIcon function (39 icons)

2. **QUICK_SUPABASE_SETUP_UPDATED.sql**
   - Updated CHECK constraint with all 39 types
   - Ready to run in Supabase

3. **DOCUMENT_TYPES_REFERENCE.md** (this file)
   - Complete reference guide
   - Organized by category

---

## 🚀 Ready to Proceed

You can now:
1. Use `QUICK_SUPABASE_SETUP_UPDATED.sql` for Supabase setup
2. All document types are consistent across the project
3. Frontend can use `locker-helpers.js` with confidence

---

## Notes

- All types match exactly with reportfound.html
- Icons are appropriate for each document type
- CHECK constraint in SQL prevents invalid types
- Easy to add new types in the future (update all 3 places)

