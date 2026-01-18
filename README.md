# Project Sa'Bai

## Setup

1. Install Node Version Manager(NVM): [Installation Guide](nvmnode.com/guide/installation.html)

2. Run the following command to set up the node.js version we would be using.

   ```bash
   # Install the latest version of node.js
   nvm install 24.13.0
   # Use the correct version node.js
   nvm use 24.13.0
   # Verify that you have installed node correctly
   node -v  # v24.13.0
   # Verify npm is installed
   npm -v
   ```

3. Installation of pnpm <https://pnpm.io/installation>:

   Next, install pnpm:

   ```bash
   # Installing pnpm
   npm install -g pnpm
   # Verify installation
   pnpm --version
   ```

4. Install project libraries
    ```bash
    # Install the necessary libraries for the project
    pnpm i
    ```
## Running the Application

```bash
# Run the development server.
pnpm dev
```
