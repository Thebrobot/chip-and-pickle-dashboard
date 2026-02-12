# Stress Test Plan for Chip & Pickle Dashboard

## Pre-Launch Testing Checklist

### 1. Data Volume Testing

**Setup:**
1. Run `/scripts/seed-test-data.sql` in Supabase SQL Editor
2. Update the variables at the top:
   - Get `v_project_id`: `SELECT id FROM projects LIMIT 1;`
   - Get `v_user_id`: `SELECT user_id FROM profiles LIMIT 1;`

**Expected Results:**
- Dashboard should load smoothly with 50+ budget items, 14+ contractors, 42+ tasks
- No UI elements should break or overflow
- Page load time should be under 2 seconds

---

### 2. Responsive Design Testing

**Breakpoints to Test:**
- [ ] **Mobile (375px)** - iPhone SE
- [ ] **Mobile Large (414px)** - iPhone Pro Max
- [ ] **Tablet (768px)** - iPad
- [ ] **Desktop Small (1024px)** - Laptop
- [ ] **Desktop Medium (1440px)** - Standard monitor
- [ ] **Desktop Large (1920px)** - Large monitor

**Pages to Test:**
- [ ] Dashboard (`/dashboard`)
- [ ] Tasks (`/tasks`)
- [ ] Budget (`/budget`)
- [ ] Contractors (`/contractors`)
- [ ] Master Plan (`/master-plan`)
- [ ] Team Settings (`/settings/team`)
- [ ] Profile Settings (`/settings/profile`)

**What to Look For:**
- No horizontal scrolling (except intentional overflow)
- Text remains readable (no tiny fonts)
- Buttons are tappable (min 44x44px on mobile)
- Cards/sections stack properly
- Navigation works on all sizes

---

### 3. Feature Testing (CRUD Operations)

#### Dashboard
- [ ] All widgets load with correct data
- [ ] Budget snapshot shows accurate totals
- [ ] Active contractors display properly
- [ ] Recent activity shows assignee names
- [ ] "View all →" links navigate correctly
- [ ] Progress bars render with correct percentages
- [ ] Attention Required section shows urgent items

#### Tasks
- [ ] Create new task
- [ ] Edit existing task (click title)
- [ ] Change task status (todo → in_progress → done)
- [ ] Set priority (high/medium/low)
- [ ] Assign task to team member
- [ ] Delete task
- [ ] Verify dashboard updates after changes

#### Budget
- [ ] Create new budget item
- [ ] Edit budget item
- [ ] Delete budget item
- [ ] Mark item as paid/unpaid
- [ ] Search by keyword
- [ ] Filter by category
- [ ] Filter by payment status
- [ ] Expand/collapse long notes
- [ ] Click hyperlinks in notes
- [ ] Verify dashboard budget snapshot updates

#### Contractors
- [ ] Add new contractor
- [ ] Edit contractor details
- [ ] Change contractor status
- [ ] Delete contractor
- [ ] View all contractor info on card (no scrolling)
- [ ] Verify dashboard contractor count updates

#### Master Plan/Roadmap
- [ ] View all phases
- [ ] Toggle phase item completion
- [ ] Expand phase items
- [ ] Verify phase progress updates

#### Team Settings
- [ ] Add member (generate invite link)
- [ ] Copy invite link
- [ ] Edit own profile (name, phone, password)
- [ ] Edit other member names (as owner)
- [ ] Change member role (owner ↔ member)
- [ ] Remove member
- [ ] Verify cannot remove self
- [ ] Verify member names update everywhere

#### Profile Settings
- [ ] Update full name
- [ ] Change password
- [ ] Verify email is read-only
- [ ] Verify changes reflect on dashboard

---

### 4. Edge Case Testing

#### Long Text
- [ ] Task title with 100+ characters
- [ ] Budget item note with 500+ characters
- [ ] Contractor name with special characters
- [ ] Vendor name with very long text

#### Missing Data
- [ ] Task with no assignee
- [ ] Task with no due date
- [ ] Budget item with no vendor
- [ ] Budget item with no notes
- [ ] Contractor with no phone/email
- [ ] Project with no contractors
- [ ] Project with no tasks
- [ ] Project with no budget items

#### Special Characters
- [ ] Names with apostrophes (O'Brien)
- [ ] Notes with quotes and special characters
- [ ] URLs in notes (should be clickable)
- [ ] Email addresses in notes

#### Numeric Edge Cases
- [ ] Budget item with $0 forecast/actual
- [ ] Budget item with negative variance
- [ ] Budget item with very large amounts ($10M+)
- [ ] Task due date in the past (overdue)
- [ ] Task due date today
- [ ] Task due date far in future (1 year+)

---

### 5. Performance Testing

**Metrics to Check:**
- [ ] Dashboard initial load: < 2 seconds
- [ ] Task list with 50+ items: < 1 second
- [ ] Budget list with 50+ items: < 1 second
- [ ] Search/filter on budget: < 300ms
- [ ] Modal open/close: < 100ms
- [ ] Navigation between pages: < 500ms

**Tools:**
- Chrome DevTools Performance tab
- Lighthouse audit (aim for 90+ performance score)
- Network tab (check for unnecessary refetches)

---

### 6. Browser Compatibility

**Browsers to Test:**
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

### 7. Authentication & Security

- [ ] Login with correct credentials
- [ ] Login with incorrect credentials (should fail)
- [ ] Register new account
- [ ] Logout
- [ ] Try to access `/dashboard` while logged out (should redirect to login)
- [ ] Verify RLS policies (users only see their project data)
- [ ] Password change requires confirmation
- [ ] Invite links expire or are one-time use (if implemented)

---

### 8. Data Integrity

- [ ] Create item → refresh page → item persists
- [ ] Edit item → refresh page → changes persist
- [ ] Delete item → refresh page → item stays deleted
- [ ] Dashboard totals match actual sums
- [ ] Recent activity shows most recent first
- [ ] Task counts are accurate across pages

---

### 9. Error Handling

**Test Error States:**
- [ ] Submit form with missing required fields
- [ ] Submit form with invalid email format
- [ ] Create budget item with negative amounts
- [ ] Network error during save (disconnect internet)
- [ ] 404 page for invalid routes
- [ ] 500 error handling (if possible to simulate)

**Expected Behavior:**
- Clear error messages (not raw database errors)
- Form doesn't lose data on error
- User can retry failed actions
- No app crashes

---

### 10. Mobile-Specific Testing

**Touch Interactions:**
- [ ] All buttons/links are tappable
- [ ] Modal close button works
- [ ] Dropdown selects work
- [ ] Date picker works
- [ ] Search input shows mobile keyboard
- [ ] No accidental zooming

**Mobile Performance:**
- [ ] Page loads on 3G network (< 5 seconds)
- [ ] No jank when scrolling
- [ ] Images/icons load properly

---

## Automated Browser Testing

Use the browser automation to test key flows:

### Test 1: Dashboard Load
1. Navigate to `/dashboard`
2. Verify all widgets visible
3. Take screenshot

### Test 2: Create Task
1. Navigate to `/tasks`
2. Click "New Task"
3. Fill form
4. Submit
5. Verify task appears

### Test 3: Responsive Dashboard
1. Set viewport to 375px width
2. Navigate to `/dashboard`
3. Take screenshot
4. Set viewport to 768px
5. Take screenshot
6. Set viewport to 1440px
7. Take screenshot

---

## Success Criteria

### Must Pass (Blockers)
- ✅ All CRUD operations work
- ✅ No console errors on any page
- ✅ Mobile navigation works
- ✅ Data persists across page refreshes
- ✅ Authentication/logout works
- ✅ Dashboard loads with test data

### Should Pass (High Priority)
- ✅ Page loads under 2 seconds
- ✅ Works on Chrome, Safari, Firefox
- ✅ Responsive at all breakpoints
- ✅ Error messages are user-friendly
- ✅ No UI overflow/breaking with lots of data

### Nice to Have
- ✅ Lighthouse score 90+
- ✅ Works offline (if PWA features added)
- ✅ Animations are smooth (60fps)

---

## Post-Testing Cleanup

After stress testing, you may want to:
1. Delete test data (or use a separate test project)
2. Reset to production-ready state
3. Take final screenshots for documentation

---

## Notes

- **Always test on a STAGING/TEST project first!**
- Don't seed test data into your production database
- Consider creating a separate Supabase project for testing
- Take screenshots of any bugs found
- Document any performance bottlenecks
