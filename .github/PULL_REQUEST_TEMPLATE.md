# Pull Request Template

## 📋 PR Description Template

### 🎯 **Type of Change**

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update (improvements to docs, code comments, etc.)
- [ ] Refactoring (code quality improvements, no functional changes)
- [ ] Performance optimization (improvements to speed, memory, etc.)
- [ ] Security enhancement (improvements to security posture)

### 📝 **Description**

Brief description of what this PR accomplishes and why it's needed.

### 🔗 **Related Issues**

Fixes # (issue number)
Related to # (issue number)

### 🧪 **Changes Made**

List the key changes in this PR:

- **Component Changes:**
  - Modified `ComponentName` to...
  - Added new `NewComponent` for...
- **API Changes:**
  - Added new endpoint `POST /api/endpoint`
  - Modified existing endpoint behavior
- **Database Changes:**
  - Added new table/column
  - Updated schema migration
- **Documentation:**
  - Updated API documentation
  - Added translation keys

### 🎯 **Acceptance Criteria**

- [ ] All tests pass locally and in CI
- [ ] Code follows project style guidelines
- [ ] TypeScript compilation succeeds
- [ ] Manual testing confirms functionality
- [ ] Accessibility requirements met
- [ ] Performance impact assessed
- [ ] Security considerations addressed

### 🧪 **Testing Strategy**

Describe how this PR was tested:

#### **Unit Tests**

- [ ] Added new tests for `ComponentName`
- [ ] Updated existing tests for modified functionality
- [ ] Coverage maintained or improved (current: X% → Y%)
- [ ] All edge cases covered

#### **Integration Tests**

- [ ] API endpoints tested with various inputs
- [ ] Database integration verified
- [ ] External service integration tested

#### **E2E Tests**

- [ ] User workflows tested end-to-end
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Accessibility testing with screen readers

#### **Manual Testing**

- [ ] Feature works as expected in development
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] Edge cases handled appropriately

### 📊 **Performance Impact**

- [ ] No performance regression
- [ ] Bundle size analyzed and acceptable
- [ ] Lighthouse scores maintained or improved
- [ ] Memory usage within acceptable limits
- [ ] Database queries optimized

### 🔒 **Security Review**

- [ ] Input validation implemented
- [ ] Authentication/authorization considered
- [ ] No sensitive data exposure
- [ ] CSRF protection verified
- [ ] Rate limiting appropriate
- [ ] Error messages don't leak information

### 📱 **Cross-Platform Compatibility**

- [ ] Chrome/Chromium tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested
- [ ] Mobile Safari tested
- [ ] Mobile Chrome tested
- [ ] Tablet responsive design verified

### 🌐 **Internationalization**

- [ ] Translation keys added for new UI text
- [ ] RTL languages tested
- [ ] Date/time formatting localized
- [ ] Cultural considerations addressed

### 📚 **Documentation**

- [ ] Code comments added where necessary
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Changelog entry added
- [ ] Examples or demos provided

### 🔍 **How to Test**

Step-by-step instructions for reviewers to test this PR:

1.
2.
3.

### 📋 **Review Checklist**

#### **Code Quality**

- [ ] Code follows project conventions and style
- [ ] Self-review completed
- [ ] No console errors or warnings
- [ ] No debugging code left in
- [ ] Unused code removed
- [ ] Components are properly typed

#### **Testing**

- [ ] All new/updated tests pass
- [ ] Test coverage is sufficient
- [ ] Manual testing completed
- [ ] Edge cases considered
- [ ] Error states tested

#### **Documentation**

- [ ] PR description is clear and comprehensive
- [ ] Code comments are helpful
- [ ] Public documentation updated
- [ ] Examples provided if needed

#### **Security & Performance**

- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Bundle size analyzed
- [ ] Memory leaks checked

### 🖼️ **Screenshots/Videos**

Add screenshots or short videos to help reviewers understand the changes:

**Before:**

<!-- Add screenshots before changes -->

**After:**

<!-- Add screenshots after changes -->

### 📝 **Additional Notes**

Any additional context, known limitations, or follow-up work needed.

---

### 🤖 **Deployment Notes**

- [ ] Requires database migration
- [ ] Requires cache invalidation
- [ ] Requires environment variable changes
- [ ] Breaking changes communicated
- [ ] Rollback plan documented

### 📞 **Contact**

**Reviewer(s):** @mention-reviewers
**Assigned to:** @assigned-developer

---

**Thank you for your contribution! 🎓**
