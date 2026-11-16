import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values } = (await import('node:util')).parseArgs({
  options: {
    platform: { type: 'string' },
    device: { type: 'string' },
    server: { type: 'string' },
    output: { type: 'string', default: '.native-test-results' },
  },
});
assert(['android', 'ios'].includes(values.platform), 'Set --platform android or ios');
assert(values.device, 'Set --device to the installed app target');
assert(values.server, 'Set --server to the running Meteor backend URL');
assert(process.env.METEOR_CHECKOUT, 'Set METEOR_CHECKOUT to the integration checkout');

const require = createRequire(import.meta.url);
const helpers = path.join(process.env.METEOR_CHECKOUT, 'tools/native-tests/scripts');
const { readCordovaManifest, waitForCordovaManifestChange } = require(path.join(helpers, 'cordova-hcp.js'));
const { runFlow } = require(path.join(helpers, 'maestro.js'));
const output = path.resolve(appDir, values.output);
await fs.mkdir(output, { recursive: true });
const configPath = values.platform === 'android'
  ? 'android/app/src/main/assets/capacitor.config.json'
  : 'ios/App/App/capacitor.config.json';
const config = JSON.parse(await fs.readFile(path.join(appDir, configPath), 'utf8'));
assert(!config.server?.url, 'HCP must run from bundled assets, without a livereload server.url');

const sourcePath = path.join(appDir, 'imports/ui/App.jsx');
const original = await fs.readFile(sourcePath, 'utf8');
const marker = 'Welcome to Meteor HCP Updated';
assert.equal(original.split('title="Welcome to Meteor"').length, 2, 'Expected one original title');
const changed = original.replace('title="Welcome to Meteor"', `title="${marker}"`);
const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'welcome-native-hcp-'));
const result = { platform: values.platform, device: values.device, server: values.server, checks: [] };
let mutated = false;
let updatedVersion;

async function flow(flowPath, name) {
  const { exitCode } = await runFlow({
    flowPath,
    deviceId: values.device,
    platform: values.platform,
    junitOut: path.join(output, `${values.platform}-${name}.xml`),
  });
  assert.equal(exitCode, 0, `Maestro ${name} failed`);
  result.checks.push(name);
}

try {
  const initial = await readCordovaManifest({ baseUrl: values.server, signal: AbortSignal.timeout(10000) });
  result.initialVersion = initial.version;
  await flow(path.join(appDir, 'tests/maestro/smoke.yaml'), 'hcp-initial');
  await fs.writeFile(sourcePath, changed);
  mutated = true;
  const updated = await waitForCordovaManifestChange({ baseUrl: values.server, previousVersion: initial.version });
  updatedVersion = updated.version;
  result.updatedVersion = updatedVersion;
  const updatedFlow = path.join(scratch, 'updated.yaml');
  await fs.writeFile(updatedFlow, `appId: ${config.appId}
name: Activate a downloaded update and retain it after cold launch
---
- extendedWaitUntil:
    visible: "${marker}"
    timeout: 60000
- assertVisible: "Do the Tutorial"
- launchApp
- extendedWaitUntil:
    visible: "${marker}"
    timeout: 60000
- tapOn: "Click Me"
- assertVisible:
    text: "You've pressed the button 1 times[.]|1"
    above: "Click Me"
`);
  await flow(updatedFlow, 'hcp-updated-cold-launch');
} catch (error) {
  result.error = error.stack;
  process.exitCode = 1;
} finally {
  try {
    if (mutated) {
      assert.equal(await fs.readFile(sourcePath, 'utf8'), changed, 'Source changed during HCP test; preserve concurrent edits');
      await fs.writeFile(sourcePath, original);
      if (updatedVersion) {
        await waitForCordovaManifestChange({ baseUrl: values.server, previousVersion: updatedVersion });
        await flow(path.join(appDir, 'tests/maestro/smoke.yaml'), 'hcp-restored');
      }
    }
  } catch (error) {
    result.cleanupError = error.stack;
    process.exitCode = 1;
  }
  await fs.rm(scratch, { recursive: true, force: true });
  result.passed = !result.error && !result.cleanupError;
  result.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(output, `${values.platform}-hcp.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
