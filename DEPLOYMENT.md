# Deployment Guide for GitHub Pages

This guide will help you deploy the Excel to GSTR-1 Converter application to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- The repository pushed to GitHub

## Quick Start

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: `GitHub Actions`
4. Save the settings

### Step 2: Push Your Code

The GitHub Actions workflow will automatically deploy your app when you push to the `main` branch:

```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push origin main
```

### Step 3: Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see a workflow run called "Deploy to GitHub Pages"
3. Wait for it to complete (usually takes 2-3 minutes)
4. Once complete, your app will be available at:
   - `https://<your-username>.github.io/<repository-name>/`

## Manual Deployment

If you want to build and test the static export locally:

```bash
# Build for GitHub Pages
npm run build:gh-pages

# The static files will be in the 'out' directory
# You can test locally using a static file server:
npx serve out
```

## Custom Domain (Optional)

If you want to use a custom domain:

1. Create a file named `CNAME` in the `public` directory with your domain:
   ```
   example.com
   ```

2. Update your DNS settings to point to GitHub Pages:
   - Add a CNAME record pointing to `<your-username>.github.io`

3. In GitHub repository settings → Pages, add your custom domain

4. The workflow will automatically include the CNAME file in the deployment

## Repository Name Considerations

The app automatically configures the base path based on your repository name. If your repository is named `excel-to-gstr1`, the app will be available at:

- `https://<username>.github.io/excel-to-gstr1/`

If you want to deploy to the root of your GitHub Pages site (e.g., `https://<username>.github.io/`), you need to:

1. Name your repository `<username>.github.io`
2. Or update the `basePath` in `next.config.ts` to an empty string for production

## How It Works

1. **GitHub Actions Workflow**: The `.github/workflows/deploy.yml` file automatically:
   - Builds your Next.js app as a static export
   - Configures the correct base path for GitHub Pages
   - Deploys the static files to GitHub Pages

2. **Static Export**: Next.js exports your app as static HTML, CSS, and JavaScript files that can be served by GitHub Pages

3. **Automatic Deployment**: Every push to the `main` branch triggers a new deployment

## Troubleshooting

### Build Fails

- Check the **Actions** tab for error messages
- Ensure all dependencies are listed in `package.json`
- Verify that your code doesn't use server-side features (this app is client-side only, so it should work)

### 404 Errors or Broken Links

- Make sure the base path is correctly configured
- Check that `trailingSlash: true` is set in `next.config.ts` (already configured)
- Clear your browser cache

### Assets Not Loading

- Verify that the `basePath` in `next.config.ts` matches your repository name
- Check that images use the `basePath` prefix (Next.js handles this automatically)

### Deployment Not Triggering

- Ensure GitHub Pages is set to use "GitHub Actions" as the source
- Check that the workflow file is in `.github/workflows/deploy.yml`
- Verify you're pushing to the `main` branch (or update the workflow to use your default branch)

## Local Development vs Production

- **Local Development**: Run `npm run dev` - the app runs at `http://localhost:3000`
- **Production Build**: The GitHub Actions workflow automatically builds with the correct base path for GitHub Pages

## Updating the App

Simply push changes to the `main` branch:

```bash
git add .
git commit -m "Update app"
git push origin main
```

The GitHub Actions workflow will automatically rebuild and redeploy your app.

## File Structure

After deployment, the static files are in the `out` directory (not committed to git). The GitHub Actions workflow handles the build and deployment automatically.

## Additional Resources

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Notes

- This app is 100% client-side, making it perfect for static hosting
- No server or database required
- All processing happens in the user's browser
- Free hosting on GitHub Pages
