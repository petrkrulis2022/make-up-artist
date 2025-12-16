import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runTests() {
  try {
    const { stdout, stderr } = await execAsync(
      "NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=portfolio.test --runInBand",
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
