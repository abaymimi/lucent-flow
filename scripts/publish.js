import { execSync } from "child_process";

try {
  // Get the latest commit message
  const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();

  console.log(`Latest commit message: "${commitMessage}"`);

  // Check if the commit message starts with 'release: v'
  if (commitMessage.startsWith("release: v")) {
    console.log("Commit message matches the pattern. Publishing to npm...");
    execSync("npm publish --access public", { stdio: "inherit" });
    console.log("Successfully published to npm!");
  } else {
    console.log(
      "Commit message does not match the pattern."
    );
    console.log("Skipping npm publish.");
  }
} catch (error) {
  console.error("Error while processing:", error.message);
  process.exit(1);
}
