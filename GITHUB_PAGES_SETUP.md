# Quick Setup Guide for GitHub Pages

## One-Time Setup

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages in repository settings**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save

3. **That's it!** The next push to `main` will automatically deploy.

## Your App URL

After deployment, your app will be available at:
```
https://<your-username>.github.io/<repository-name>/
```

For example, if your username is `johndoe` and repository is `excel-to-gstr1`:
```
https://johndoe.github.io/excel-to-gstr1/
```

## Testing Locally

To test the GitHub Pages build locally:

```bash
# Build with GitHub Pages configuration
npm run build:gh-pages

# Serve the static files
npx serve out
```

Then visit `http://localhost:3000/<repository-name>/` (note the base path)

## What Changed

- ✅ Next.js configured for static export
- ✅ GitHub Actions workflow created (`.github/workflows/deploy.yml`)
- ✅ Automatic deployment on push to `main`
- ✅ Base path automatically configured based on repository name

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

