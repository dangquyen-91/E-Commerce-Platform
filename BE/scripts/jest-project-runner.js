const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const projects = new Set(["inventory", "checkout"]);

let jestArgs;
if (args.length > 0 && projects.has(args[0])) {
  const [project, ...rest] = args;
  jestArgs = ["--selectProjects", project, ...rest];
} else {
  jestArgs = [...args];
}

const jestBin = require.resolve("jest/bin/jest");
const result = spawnSync(process.execPath, [jestBin, ...jestArgs], {
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
