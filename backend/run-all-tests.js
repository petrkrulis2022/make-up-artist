import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runAllTests() {
  console.log("🧪 Running all backend tests...\n");
  console.log("=".repeat(60));

  try {
    const { stdout, stderr } = await execAsync(
      "NODE_OPTIONS=--experimental-vm-modules jest --runInBand --verbose",
      {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: "test" },
      }
    );

    console.log(stdout);

    if (stderr && !stderr.includes("ExperimentalWarning")) {
      console.error("⚠️  Warnings/Errors:");
      console.error(stderr);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Test execution failed!");
    console.error("=".repeat(60));

    if (error.stdout) {
      console.log("\nTest Output:");
      console.log(error.stdout);
    }

    if (error.stderr) {
      console.error("\nError Output:");
      console.error(error.stderr);
    }

    console.error("\nError Message:", error.message);
    process.exit(1);
  }
}

runAllTests();
