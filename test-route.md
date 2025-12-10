# Testing the API Route

To test if the route is working, you can:

1. **Find your Railway URL:**
   - Go to Railway dashboard → Your project → vetted service → Settings → Domain
   - Your URL will be something like: `vetted-production.up.railway.app`

2. **Test the route in your browser (while logged in as admin):**
   ```
   https://YOUR-RAILWAY-DOMAIN/api/candidates/upload
   ```
   - You should get a 405 Method Not Allowed (which is correct - it only accepts POST)
   - If you get 404, the route isn't deployed yet

3. **Use this URL in the extension:**
   ```
   https://YOUR-RAILWAY-DOMAIN/api/candidates/upload
   ```

4. **Make sure you're logged into Vetted as an admin** in a browser tab before using the extension.
