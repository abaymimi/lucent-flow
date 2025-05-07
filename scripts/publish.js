const { execSync } = require("child_process");

// Get the latest commit message
const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();

// Check if the commit message starts with 'release: v'
if (commitMessage.startsWith("release: v")) {
  console.log("Publishing to npm...");
  execSync("npm publish --access public", { stdio: "inherit" });
} else {
  console.log('Commit message does not match "release: v". Skipping publish.');
}
