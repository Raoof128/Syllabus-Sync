# 🔀 Git Workflow Guide - The Syllabus Sync

**Quick Reference for Team Collaboration**

---

## 🚀 Initial Setup (One-time)

### **For Raouf and Kit (First time)**

```bash
# 1. Clone the repository
git clone https://github.com/[POUYA-USERNAME]/syllabus-sync.git
cd syllabus-sync

# 2. Install dependencies
npm install

# 3. Test that everything works
npm run dev
# Visit http://localhost:3000

# 4. Configure your Git identity (if not done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 📋 Daily Workflow

### **Before You Start Working**

```bash
# ALWAYS pull latest changes first
git pull origin main

# Check which branch you're on
git branch
# Should show: * main

# Check status (see if you have uncommitted changes)
git status
```

---

## 🌿 Working with Feature Branches (Recommended)

### **Creating a New Feature Branch**

```bash
# Pull latest main
git pull origin main

# Create and switch to new branch
git checkout -b feature/your-feature-name

# Examples:
git checkout -b feature/map-placeholder
git checkout -b feature/calendar-integration
git checkout -b feature/unit-form
```

### **Working on Your Feature**

```bash
# Make changes to files
# ...

# Check what you changed
git status

# See detailed changes
git diff

# Test your changes
npm run dev
```

### **Committing Your Changes**

```bash
# Stage ALL changed files
git add .

# OR stage specific files
git add app/map/page.tsx

# Commit with a clear message
git commit -m "feat: Add map placeholder page"

# Commit message format:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes (formatting)
# refactor: Code refactoring
# test: Adding tests
```

### **Pushing Your Feature Branch**

```bash
# Push to GitHub
git push origin feature/your-feature-name

# First time? GitHub will give you a link to create Pull Request
```

### **Creating a Pull Request (PR)**

1. Go to GitHub repository in browser
2. You'll see a yellow banner "Compare & pull request"
3. Click it
4. Add description of what you did
5. Click "Create Pull Request"
6. Wait for team to review
7. After approval, click "Merge Pull Request"

### **After PR is Merged**

```bash
# Switch back to main
git checkout main

# Pull the merged changes
git pull origin main

# Delete your local feature branch (cleanup)
git branch -d feature/your-feature-name

# Delete remote branch (cleanup)
git push origin --delete feature/your-feature-name
```

---

## ⚡ Quick Direct-to-Main Workflow (Alternative)

**⚠️ Use with caution - coordinate with team first**

```bash
# Pull latest
git pull origin main

# Make changes
# ...

# Test
npm run dev

# Stage and commit
git add .
git commit -m "feat: Add settings page"

# Push
git push origin main
```

**When to use this:**
- Small, non-breaking changes
- You've tested thoroughly
- You've communicated with team

---

## 🔧 Common Git Commands

### **Checking Status**

```bash
# See what changed
git status

# See detailed line-by-line changes
git diff

# See commit history
git log --oneline
```

### **Undoing Changes**

```bash
# Undo changes to a specific file (BEFORE commit)
git checkout -- filename.tsx

# Undo ALL local changes (BEFORE commit)
git reset --hard HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - DANGEROUS
git reset --hard HEAD~1
```

### **Branches**

```bash
# List all branches
git branch

# Create new branch
git branch feature/new-feature

# Switch to branch
git checkout feature/new-feature

# Create and switch in one command
git checkout -b feature/new-feature

# Delete branch
git branch -d feature/old-feature

# Rename current branch
git branch -m new-branch-name
```

### **Remote**

```bash
# See remote URL
git remote -v

# Pull latest from main
git pull origin main

# Push to remote
git push origin branch-name

# Fetch info without merging
git fetch origin
```

---

## 🚨 Common Problems & Solutions

### **Problem 1: "Your local changes would be overwritten"**

**Error:**
```
error: Your local changes to the following files would be overwritten by merge:
	app/page.tsx
```

**Solution:**
```bash
# Option A: Keep your changes
git stash                 # Save changes temporarily
git pull origin main      # Pull latest
git stash pop            # Restore your changes

# Option B: Discard your changes (CAREFUL!)
git reset --hard HEAD    # Discard all local changes
git pull origin main     # Pull latest
```

---

### **Problem 2: Merge Conflict**

**Error:**
```
CONFLICT (content): Merge conflict in app/page.tsx
```

**Solution:**
```bash
# 1. Open the conflicted file in VS Code
# 2. Look for conflict markers:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name

# 3. Choose which version to keep (or combine them)
# 4. Remove the conflict markers
# 5. Save the file

# 6. Stage the resolved file
git add app/page.tsx

# 7. Complete the merge
git commit -m "fix: Resolve merge conflict in page.tsx"

# 8. Push
git push origin main
```

**⚠️ If unsure, ASK TEAM before resolving**

---

### **Problem 3: Forgot to Pull Before Working**

**Scenario:** You made changes but forgot to `git pull` first

**Solution:**
```bash
# Save your changes
git stash

# Pull latest
git pull origin main

# Restore your changes on top
git stash pop

# If conflicts, resolve them
# Then continue working
```

---

### **Problem 4: Wrong Branch**

**Scenario:** You made changes on `main` but should be on feature branch

**Solution:**
```bash
# Create feature branch (keeps your changes)
git checkout -b feature/my-feature

# Now your changes are on the feature branch
git add .
git commit -m "feat: Add my feature"
git push origin feature/my-feature
```

---

### **Problem 5: Committed to Wrong Branch**

**Scenario:** You committed to `main` but should be on feature branch

**Solution:**
```bash
# Create feature branch (keeps the commit)
git checkout -b feature/my-feature

# Go back to main
git checkout main

# Remove the commit from main
git reset --hard HEAD~1

# Switch back to feature branch
git checkout feature/my-feature

# Push feature branch
git push origin feature/my-feature
```

---

## 📊 Team Coordination

### **Before You Push**

✅ **Checklist:**
- [ ] Pulled latest changes
- [ ] Tested locally (`npm run dev`)
- [ ] No console errors
- [ ] Code works as expected
- [ ] Wrote clear commit message

### **After You Push**

📢 **Notify team in group chat:**
```
Pushed: feature/map-placeholder
- Added Map placeholder page
- Tests passing
- Ready for review
```

### **Pull Request Review**

When reviewing teammate's PR:
- ✅ Test their code locally
- ✅ Check for console errors
- ✅ Verify functionality works
- ✅ Leave constructive comments
- ✅ Approve if looks good

---

## 🎯 Commit Message Examples

### **Good Commit Messages**

```bash
git commit -m "feat: Add FullCalendar integration with month view"
git commit -m "fix: Resolve deadline sorting bug in deadlinesStore"
git commit -m "style: Update button colors to match Macquarie branding"
git commit -m "refactor: Extract event filtering logic to utility function"
git commit -m "docs: Update CHANGELOG.md with calendar implementation"
```

### **Bad Commit Messages (Avoid)**

```bash
git commit -m "update"                    # Too vague
git commit -m "fixed stuff"               # Not descriptive
git commit -m "asdfasdf"                  # Not professional
git commit -m "WIP"                       # Work in progress - don't push
```

---

## 🔄 Workflow Diagrams

### **Feature Branch Workflow**

```
main:        A---B---C---D---E
                  \       /
feature:           F---G
```

1. Branch off main (F)
2. Work on feature (G)
3. Merge back to main (E)

### **Direct to Main Workflow**

```
main:        A---B---C---D---E
             ↑   ↑   ↑   ↑   ↑
          Pouya Raouf Kit Pouya Kit
```

Everyone pushes directly to main (requires coordination)

---

## 📚 Additional Resources

### **Git Documentation**
- Official Docs: https://git-scm.com/doc
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

### **GitHub**
- Pull Requests: https://docs.github.com/en/pull-requests
- Resolving Conflicts: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts

### **Visual Git Tools**
- GitHub Desktop: https://desktop.github.com/
- GitKraken: https://www.gitkraken.com/
- VS Code Git Integration: Built-in

---

## ⚡ Quick Commands Reference

```bash
# Setup
git clone <url>                     # Clone repository
npm install                         # Install dependencies

# Daily
git pull origin main                # Get latest changes
git status                          # Check status
git branch                          # See branches

# Feature branch
git checkout -b feature/name        # Create feature branch
git add .                          # Stage all changes
git commit -m "message"            # Commit
git push origin feature/name       # Push to GitHub

# Back to main
git checkout main                  # Switch to main
git pull origin main               # Pull latest

# Cleanup
git branch -d feature/name         # Delete local branch
```

---

## 🆘 When in Doubt

1. **Don't panic** - Git is forgiving
2. **Ask team** in group chat
3. **Don't force push** (`git push -f`) unless you know what you're doing
4. **Backup your work** - copy important files before risky operations

---

**Remember:**
- 🔄 Pull before you work
- ✅ Test before you push
- 💬 Communicate with team
- 📝 Write clear commit messages

---

*Last Updated: 2025-12-27*
