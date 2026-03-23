# Fix CWE-22 Package Vulnerability in package-lock.json

## Issue
CWE-22 (Path Traversal) vulnerability detected in package dependencies at line 1071 of package-lock.json.

## Solution

### Step 1: Identify Vulnerable Packages
Run the following command to see all vulnerabilities:

```bash
cd d:\Staffinn-main\Frontend
npm audit
```

### Step 2: Attempt Automatic Fix
Try to automatically fix vulnerabilities:

```bash
npm audit fix
```

### Step 3: Force Fix (if needed)
If automatic fix doesn't work, try forcing updates:

```bash
npm audit fix --force
```

**⚠️ Warning:** `--force` may introduce breaking changes. Test thoroughly after running.

### Step 4: Manual Fix (if automatic fails)
If the vulnerability persists:

1. Identify the specific vulnerable package from `npm audit` output
2. Update it manually:
   ```bash
   npm update <package-name>
   ```
   or
   ```bash
   npm install <package-name>@latest
   ```

### Step 5: Verify Fix
After fixing, verify no vulnerabilities remain:

```bash
npm audit
```

### Step 6: Test Application
Ensure the application still works correctly:

```bash
npm run dev
```

## Common CWE-22 Vulnerable Packages

Based on your dependencies, common packages that may have path traversal issues:
- `tar` (used by @tailwindcss/oxide)
- `axios` (if outdated version)
- File handling utilities

## Alternative: Update All Dependencies

To update all dependencies to their latest compatible versions:

```bash
# Update package.json with latest versions
npm update

# Or use npm-check-updates tool
npx npm-check-updates -u
npm install
```

## Prevention

1. **Regular Updates**: Run `npm audit` regularly
2. **Dependency Scanning**: Use tools like Snyk or Dependabot
3. **Lock File**: Always commit package-lock.json to version control
4. **Review Updates**: Check changelogs before major updates

## Notes

- CWE-22 vulnerabilities in package-lock.json cannot be fixed by editing the file directly
- The vulnerability is in a dependency package, not your code
- You must update the vulnerable package to a patched version
- After fixing, package-lock.json will be automatically regenerated with secure versions
