# Script to locally pack all Decap CMS packages and install them in a test project

TEST_PROJECT_PATH="$1"

if [ -z "$TEST_PROJECT_PATH" ]; then
  echo "Usage: ./pack-and-install.sh /path/to/test/project"
  echo "Example: ./pack-and-install.sh ../my-test-app"
  exit 1
fi

if [ ! -d "$TEST_PROJECT_PATH" ]; then
  echo "Error: Test project directory '$TEST_PROJECT_PATH' does not exist"
  exit 1
fi

echo "Building all packages..."
npm run build

echo "Packing all required packages..."

PACKAGES=(
  "decap-cms-lib-util"
  "decap-cms-lib-auth"
  "decap-cms-lib-widgets"
  "decap-cms-ui-default"
  "decap-cms-backend-aws-cognito-github-proxy"
  "decap-cms-backend-azure"
  "decap-cms-backend-bitbucket"
  "decap-cms-backend-git-gateway"
  "decap-cms-backend-gitea"
  "decap-cms-backend-github"
  "decap-cms-backend-gitlab"
  "decap-cms-backend-proxy"
  "decap-cms-backend-test"
  "decap-cms-widget-boolean"
  "decap-cms-widget-code"
  "decap-cms-widget-colorstring"
  "decap-cms-widget-datetime"
  "decap-cms-widget-file"
  "decap-cms-widget-image"
  "decap-cms-widget-list"
  "decap-cms-widget-map"
  "decap-cms-widget-markdown"
  "decap-cms-widget-number"
  "decap-cms-widget-object"
  "decap-cms-widget-relation"
  "decap-cms-widget-select"
  "decap-cms-widget-string"
  "decap-cms-widget-text"
  "decap-cms-editor-component-image"
  "decap-cms-locales"
  "decap-cms-core"
  "decap-cms-app"
)

for pkg in "${PACKAGES[@]}"; do
  echo "Packing $pkg..."
  cd "packages/$pkg"
  npm pack
  cd ../..
done

echo "All packages packed!"

# Build the install command with absolute paths
INSTALL_PATHS=""
for pkg in "${PACKAGES[@]}"; do
  TGZ_FILE=$(find "../decap-cms/packages/$pkg/" -name "*.tgz" -type f | head -1)
  if [ -n "$TGZ_FILE" ]; then
    INSTALL_PATHS="$INSTALL_PATHS \"$TGZ_FILE\""
  else
    echo "Warning: No .tgz file found for $pkg"
  fi
done

cd "$TEST_PROJECT_PATH"
eval "npm install $INSTALL_PATHS"
