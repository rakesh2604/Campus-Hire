# Comprehensive Testing Guide

## 🧪 Test Suite Overview

This guide covers all testing scenarios for the CampusHire application.

## 📋 Test Categories

### 1. Route Loading Tests ✅
**Purpose**: Verify all routes load correctly with lazy loading

**How to Test**:
1. Navigate to `/test` page (development only)
2. Click "Test All Routes" button
3. Verify all 23 routes show ✓ (success)

**Expected Results**:
- All routes should load without errors
- Each route should have a default export
- Lazy loading should work for all pages

**Manual Test**:
```javascript
// In browser console
import('./pages/LoginPage').then(m => console.log('LoginPage loaded:', !!m.LoginPage))
```

### 2. Error Boundary Tests ✅
**Purpose**: Verify error boundaries catch and display errors properly

**How to Test**:
1. Navigate to `/test` page
2. Find "Error Boundary Test" section
3. Click "Trigger Error" button
4. Verify error boundary displays with:
   - Error message
   - "Try Again" button
   - "Reload Page" button
   - Error details (development only)

**Expected Results**:
- Error boundary should catch the error
- User-friendly error UI should display
- Error details visible in development mode

### 3. Loading States Tests ✅
**Purpose**: Verify loading states show during data fetching

**How to Test**:
1. Navigate to `/jobs` page
2. Observe loading skeleton while data loads
3. Check other pages with data fetching:
   - `/dashboard`
   - `/profile`
   - `/placement/dashboard`

**Expected Results**:
- Skeleton loaders appear during data fetch
- Loading spinners show for async operations
- No blank screens during loading

### 4. API Error Handling Tests ✅
**Purpose**: Test API error handling with different error scenarios

**How to Test**:
1. Navigate to `/test` page
2. Click "Test API Errors" button
3. Verify all error scenarios are handled:
   - Network Error
   - 401 Unauthorized
   - 403 Forbidden
   - 404 Not Found
   - 422 Validation Error
   - 500 Server Error

**Expected Results**:
- Each error type should have appropriate error name
- User-friendly error messages
- Proper error handling in UI

**Manual Test Scenarios**:
```javascript
// Test network error - stop backend server
// Test 401 - use invalid token
// Test 403 - try accessing restricted route
// Test 404 - navigate to non-existent route
// Test 422 - submit invalid form data
// Test 500 - trigger server error
```

### 5. Lighthouse Audit 🎯
**Purpose**: Achieve 90+ score on all Lighthouse metrics

**How to Run**:
1. Build production version: `npm run build`
2. Serve the `dist` folder
3. Open Chrome DevTools (F12)
4. Go to "Lighthouse" tab
5. Select categories:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
6. Click "Generate report"

**Target Scores**:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Optimization Checklist**:
- ✅ Lazy loading implemented
- ✅ Code splitting configured
- ✅ Images optimized
- ✅ Meta tags added
- ✅ Source maps disabled
- ✅ Console logs removed in production

### 6. Responsive Design Tests ✅
**Purpose**: Test responsive design on multiple devices

**How to Test**:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different viewports:
   - Mobile: 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px

**Pages to Test**:
- `/` (Home/Jobs)
- `/login`
- `/register`
- `/dashboard`
- `/profile`
- `/jobs/:id`

**Expected Results**:
- All pages should be responsive
- Navigation should work on mobile
- Forms should be usable on all devices
- Text should be readable
- Buttons should be tappable (44x44px minimum)

**Test Checklist**:
- [ ] Mobile menu works
- [ ] Forms are usable
- [ ] Images scale properly
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] No horizontal scrolling

### 7. Authentication Flow Tests ✅
**Purpose**: Test complete authentication flows

**Test Scenarios**:

#### Registration Flow:
1. Navigate to `/register`
2. Fill form with valid data
3. Submit form
4. Verify redirect based on role:
   - `candidate` → `/dashboard`
   - `placement`/`admin` → `/placement/dashboard`

#### Login Flow:
1. Navigate to `/login`
2. Enter valid credentials
3. Submit form
4. Verify redirect based on role
5. Verify token stored in localStorage

#### Logout Flow:
1. Click logout button
2. Verify token removed from localStorage
3. Verify redirect to `/login`
4. Verify protected routes redirect to login

#### Token Expiration:
1. Use expired token
2. Make API request
3. Verify 401 error handled
4. Verify redirect to login

**Expected Results**:
- All flows work correctly
- Proper redirects based on role
- Token management works
- Error handling for invalid credentials

### 8. Role-Based Access Control Tests ✅
**Purpose**: Test role-based access control

**Test Matrix**:

| Role | Allowed Routes | Restricted Routes |
|------|---------------|-------------------|
| candidate | `/dashboard`, `/profile`, `/jobs`, `/my-applications`, `/veda`, `/career-copilot` | `/placement/*`, `/jobs/new`, `/jobs/:id/edit` |
| recruiter | `/dashboard`, `/profile`, `/jobs`, `/jobs/new`, `/jobs/:id/edit` | `/placement/*`, `/my-applications`, `/career-copilot` |
| placement | `/placement/dashboard`, `/placement/students`, `/placement/jobs`, `/placement/batch-data` | `/my-applications`, `/career-copilot` |
| admin | All placement routes + `/placement/members` | `/my-applications`, `/career-copilot` |

**How to Test**:
1. Login as each role
2. Try accessing restricted routes
3. Verify access denied or redirect
4. Verify allowed routes work

**Expected Results**:
- Users can only access routes for their role
- Restricted routes show access denied or redirect
- Navigation shows/hides based on role

## 🚀 Running Tests

### Automated Test Suite
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:5173/test`
3. Click "🚀 Run All Tests" button
4. Review test report

### Browser Console Tests
```javascript
// Run all tests
runAllTests().then(results => {
  console.log(generateTestReport(results))
})

// Test specific route
import('./pages/LoginPage').then(m => console.log('Loaded:', !!m.LoginPage))
```

### Manual Testing Checklist

#### Frontend
- [ ] All routes load without errors
- [ ] Error boundaries catch errors
- [ ] Loading states display properly
- [ ] API errors handled gracefully
- [ ] Responsive design works on all devices
- [ ] Authentication flows work
- [ ] Role-based access enforced
- [ ] Forms validate correctly
- [ ] Navigation works on mobile
- [ ] Images load and display correctly

#### Backend
- [ ] All API endpoints respond
- [ ] Error handling works
- [ ] Authentication middleware works
- [ ] Database connections stable
- [ ] Validation errors return proper status codes
- [ ] CORS configured correctly

## 📊 Performance Testing

### Lighthouse Audit Steps:
1. Build: `npm run build`
2. Serve: `npx serve -s frontend/dist`
3. Open: `http://localhost:3000`
4. Run Lighthouse audit
5. Target: 90+ on all metrics

### Performance Metrics to Check:
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

## 🐛 Common Issues & Solutions

### Issue: Route not loading
**Solution**: Check if component is exported correctly with `export const ComponentName`

### Issue: Error boundary not catching
**Solution**: Ensure ErrorBoundary wraps the component tree

### Issue: Loading state not showing
**Solution**: Check if `isLoading` state is properly set in hooks

### Issue: API errors not handled
**Solution**: Verify axios interceptors are configured

### Issue: Lighthouse score low
**Solution**: 
- Enable lazy loading
- Optimize images
- Remove unused code
- Enable code splitting

## 📝 Test Results Template

```
Test Date: [Date]
Tester: [Name]
Environment: [Development/Production]

Route Loading: [X/23] passed
Error Boundary: [Pass/Fail]
Loading States: [Pass/Fail]
API Error Handling: [X/6] passed
Lighthouse Score: [Performance/Accessibility/Best Practices/SEO]
Responsive Design: [Pass/Fail]
Authentication: [Pass/Fail]
Role-Based Access: [Pass/Fail]

Overall: [X%] success rate
```

## ✅ Success Criteria

All tests should pass with:
- 100% route loading success
- Error boundaries catch all errors
- Loading states display for all async operations
- All API error scenarios handled
- Lighthouse scores 90+ on all metrics
- Responsive design works on all tested devices
- Authentication flows work correctly
- Role-based access control enforced

