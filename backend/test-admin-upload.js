import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runTests() {
  console.log("Running admin operation feedback test...");
  try {
    const { stdout, stderr } = await execAsync(
      "NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=adminOperationFeedback.property.test --runInBand",
      { cwd: process.cwd() }
    );
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error("Test execution error:", error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }

  console.log("\nRunning admin error handling test...");
  try {
    const { stdout, stderr } = await execAsync(
      "NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=adminErrorHandling.property.test --runInBand",
      { cwd: process.cwd() }
    );
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error("Test execution error:", error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }
}

runTests();
