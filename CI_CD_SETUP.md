# CI/CD Setup — Hotel SENA 2026 Backend

## 📋 Overview

This project uses GitHub Actions for continuous integration and continuous deployment. The CI/CD pipeline runs on all pushes to `main` and `develop` branches, as well as on pull requests.

---

## 🚀 Pipeline Stages

### 1. **Lint, Test & Build** (`lint-and-build`)
- Checks out the code
- Sets up Node.js 20 with npm caching
- Installs dependencies via `npm ci`
- Runs ESLint to check code quality
- Executes unit tests with Jest
- Generates code coverage report
- Builds the project for production
- **Outputs**: Build artifacts stored in `/dist` directory

### 2. **Security Scan** (`security-scan`)
- Audits npm dependencies for vulnerabilities
- Generates dependencies report
- **Outputs**: Audit report and dependencies list

### 3. **Notifications** (`notifications`)
- Summary of pipeline results
- Succeeds if all previous jobs succeeded
- Provides clear success/failure messages

---

## 📊 Artifacts

The pipeline generates and stores the following artifacts for 5 days:

### Backend Artifacts:
- **`backend-dist`**: Compiled NestJS application in `/dist` directory
- **`dependencies-report`**: Text file listing all project dependencies

### Retention Policy:
- All artifacts are retained for **5 days** by default
- Can be customized in GitHub Actions settings

---

## 🔐 Security Features

### Dependency Auditing:
- **Audit Level**: `moderate` (fails on moderate and high severity vulnerabilities)
- **Continue on Error**: Enabled to provide visibility without blocking the pipeline
- **Reports**: Generated and uploaded for review

### Permissions:
- Pipeline runs with minimal required permissions
- `read` access for repository contents
- `write` access for packages (if using container registries)

---

## 🔄 Workflow Triggers

The CI/CD pipeline is triggered automatically on:

1. **Push Events**
   - To `main` branch
   - To `develop` branch

2. **Pull Request Events**
   - Against `main` branch
   - Against `develop` branch

### Manual Triggering:
To manually run the workflow, use GitHub's Actions UI:
1. Go to **Actions** tab in your repository
2. Select **CI — Backend**
3. Click **Run workflow**
4. Select the branch you want to run it on

---

## 📝 Log & Monitoring

### Viewing Logs:
1. Navigate to **Actions** tab in GitHub
2. Click on the workflow run
3. Expand job names to see detailed logs

### Common Issues:

#### ❌ Build Failures
- Check ESLint errors in the logs
- Review test failures
- Verify all dependencies are installed

#### ❌ Test Failures
- Review test output in the logs
- Run tests locally with `npm run test`
- Check for environmental variable issues

#### ❌ Lint Errors
- Run `npm run lint` locally
- Fix issues with `npm run lint -- --fix`
- Review ESLint configuration in `eslint.config.mjs`

---

## 🛠️ Local Development

### Running the Same Checks Locally:

```bash
# Install dependencies
npm install

# Lint
npm run lint

# Run tests
npm run test

# Coverage report
npm run test:cov

# Build production
npm run build

# Audit dependencies
npm audit
```

---

## 📦 Environment Variables

### Required for Build:
- `NODE_ENV`: Set to `production` during build
- Database credentials (from `.env` file)
- API keys and secrets (configured in GitHub Secrets)

### GitHub Secrets Setup:
If additional secrets are needed for deployment, add them in:
**Repository Settings → Secrets and variables → Actions**

Example secrets to consider:
- `DATABASE_URL`: Production database connection
- `GOOGLE_CLIENT_ID`: OAuth credentials
- `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `JWT_SECRET`: JWT signing key

---

## 🚢 Future Enhancements

Consider adding these stages in the future:

1. **Docker Image Building**
   ```yaml
   - Build Docker image
   - Push to container registry
   ```

2. **Deployment Stage**
   ```yaml
   - Deploy to staging environment
   - Deploy to production (on main branch)
   ```

3. **Database Migrations**
   ```yaml
   - Run TypeORM migrations
   - Seed test data (if applicable)
   ```

4. **Performance Testing**
   ```yaml
   - Load testing
   - API response time validation
   ```

5. **Code Quality Gates**
   ```yaml
   - SonarQube integration
   - Coverage thresholds
   - Complexity analysis
   ```

---

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Setup for GitHub Actions](https://github.com/actions/setup-node)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [ESLint Configuration](https://eslint.org/)

---

## ❓ FAQ

### Q: How can I skip the CI/CD pipeline for a commit?
A: Add `[skip ci]` or `[ci skip]` to your commit message (not recommended).

### Q: Can I modify the pipeline without affecting others?
A: Create a feature branch and open a PR. The pipeline will run against your branch before merging.

### Q: What if the pipeline fails?
A: Fix the issues locally, commit, and push. The pipeline will re-run automatically.

### Q: How do I add a new secret?
A: Go to **Repo Settings → Secrets → New repository secret** and add the key-value pair.

---

## 🎯 Best Practices

1. ✅ Always write tests for new features
2. ✅ Run `npm run lint` before committing
3. ✅ Keep dependencies up to date
4. ✅ Use meaningful commit messages
5. ✅ Review pipeline logs before merging PRs
6. ✅ Maintain code coverage above 70%
7. ✅ Follow conventional commits pattern

---

**Last Updated**: 2025
**Maintained By**: Development Team
