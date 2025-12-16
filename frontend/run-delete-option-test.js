import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  execSync("npm test -- deleteOptionAvailability.property.test.jsx", {
    stdio: "inherit",
    cwd: __dirname,
  });
} catch (error) {
  process.exit(1);
}
