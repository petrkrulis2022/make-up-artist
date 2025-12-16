import { execSync } from "child_process";

try {
  execSync(
    "npx vitest --run src/tests/properties/sessionExpiration.property.test.jsx",
    {
      stdio: "inherit",
      cwd: process.cwd(),
    }
  );
} catch (error) {
  process.exit(1);
}
