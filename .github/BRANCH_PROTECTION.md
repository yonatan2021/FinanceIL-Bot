# Branch Protection Rules

After pushing this project to GitHub, it is highly recommended to configure the following branch protection rules for the `main` branch to ensure stability and security.

## How to Configure
1. Navigate to your repository on GitHub.
2. Go to **Settings** > **Branches**.
3. Click **Add branch protection rule**.
4. Set **Branch name pattern** to `main`.

## Recommended Rules

### 1. Require pull request reviews before merging
- **Required number of approvals**: 1
- Ensures all changes are reviewed by at least one other person (or yourself via a formal PR process).

### 2. Require status checks to pass before merging
Search for and select the following checks:
- `build` (from `CI` workflow)
- `NPM Audit` (from `Security Scanning` workflow)
- `Gitleaks Scan` (from `Security Scanning` workflow)
- `CodeQL`
- `Dependency Review`

### 3. Require signed commits
- Optional but recommended if you use GPG signing.

### 4. Do not allow bypassing the above settings
- Ensures even administrators follow the process.

## Additional Security Settings
- Go to **Settings** > **Code security and analysis**:
  - Enable **Dependency graph**.
  - Enable **Dependabot alerts**.
  - Enable **Dependabot security updates**.
  - Enable **Secret scanning**.
  - Enable **Secret scanning** > **Push protection**.
