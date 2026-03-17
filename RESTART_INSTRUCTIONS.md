# Restart Instructions

## The socket.io-client package has been installed successfully!

### Next Steps:

1. **Stop the current Vite dev server** (Press `Ctrl+C` in the terminal where it's running)

2. **Restart the Vite dev server:**
   ```bash
   cd EmployeePortal
   npm run dev
   ```

3. **Verify the server starts without errors**

4. **Open your browser and navigate to:** `http://localhost:5173`

5. **Check the browser console** - you should see:
   ```
   🔌 Connected to WebSocket
   ```

## Verification

After restarting, the error should be gone and you should be able to:
- ✅ Navigate to the Grievances page
- ✅ See both tabs: "My Grievances" and "Assigned to Me"
- ✅ Submit new grievances
- ✅ View and act on assigned grievances (if you're a manager)

## If you still see errors:

1. Clear the browser cache (Ctrl+Shift+Delete)
2. Close all browser tabs
3. Stop the dev server completely
4. Delete the `.vite` cache folder:
   ```bash
   cd EmployeePortal
   rm -rf node_modules/.vite
   ```
5. Restart the dev server:
   ```bash
   npm run dev
   ```

---

**Everything is now ready to test the Grievance Hierarchical Workflow!**

Refer to `GRIEVANCE_QUICK_SETUP_GUIDE.md` for testing instructions.
