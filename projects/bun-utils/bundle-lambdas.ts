import { $ } from 'bun';
import { createWriteStream } from 'fs';
import { readdir } from 'fs/promises';
import archiver from 'archiver';

console.log('\n👉 Parsing environment variables\n');

const TRPC_ROUTERS_PATH = process.env['TRPC_ROUTERS_PATH'];
if (!TRPC_ROUTERS_PATH) throw new Error('🚫 TRPC_ROUTERS_PATH is not defined');
console.log('TRPC_ROUTERS_PATH:', TRPC_ROUTERS_PATH);

const TRPC_ROUTERS_PACKAGE_PATH = process.env['TRPC_ROUTERS_PACKAGE_PATH'];
if (!TRPC_ROUTERS_PACKAGE_PATH)
  throw new Error('🚫 TRPC_ROUTERS_PACKAGE_PATH is not defined');
console.log('TRPC_ROUTERS_PACKAGE_PATH:', TRPC_ROUTERS_PACKAGE_PATH);

const LAMBDAS_PATH = process.env['LAMBDAS_PATH'];
if (!LAMBDAS_PATH) throw new Error('🚫 LAMBDAS_PATH is not defined');
console.log('LAMBDAS_PATH:', LAMBDAS_PATH);

console.log('\n👉 Parsing package.json\n');
const packageJson = JSON.parse(
  await Bun.file(TRPC_ROUTERS_PACKAGE_PATH, { type: 'application/json' }).text()
);
const dependencies = packageJson.peerDependencies;
if (!dependencies) throw new Error('🚫 No peerDependencies found');
console.log('dependencies:', dependencies);

console.log(
  '\n👉 Writing dependencies to ./temp/lambda-deps/nodejs/package.json\n'
);
Bun.write(
  './temp/lambda-deps/nodejs/package.json',
  JSON.stringify({ dependencies }, null, 2)
);

console.log('\n👉 Installing dependencies\n');
await $`cd ./temp/lambda-deps/nodejs && bun install`;

console.log('\n👉 Zipping dependencies\n');
const archive = archiver('zip');
const resultWriteStream = createWriteStream('./temp/dependencies.zip');
await new Promise<void>((resolve, reject) => {
  archive
    .directory('./temp/lambda-deps', false)
    .on('error', (err) => reject(err))
    .pipe(resultWriteStream);
  resultWriteStream.on('close', () => resolve());
  archive.finalize();
});

console.log(`\n👉 Moving dependencies.zip to ${LAMBDAS_PATH}\n`);
await $`rm -rf ${LAMBDAS_PATH} && mkdir ${LAMBDAS_PATH} && mv ./temp/dependencies.zip ${LAMBDAS_PATH}/dependencies.zip`;

console.log('\n👉 Deleting ./temp\n');
await $`rm -rf ./temp`;

console.log('\n👉 Reading trpc router files\n');
const routerFiles = await readdir(TRPC_ROUTERS_PATH);
console.log('router files:', routerFiles);

console.log('\n👉 Bundling lambdas\n');

for (const file of routerFiles) {
  const lambdaName = file.split('.')[0];
  console.log(`- Bundling ${lambdaName} lambda`);
  const lambdaFolder = `${LAMBDAS_PATH}/${lambdaName}`;
  const buildResults = await Bun.build({
    entrypoints: [`${TRPC_ROUTERS_PATH}/${file}`],
    outdir: lambdaFolder,
    naming: 'index.mjs',
    target: 'node',
    external: Object.keys(dependencies),
  });
  buildResults.logs.forEach(({ message }) => console.log(message));
  if (!buildResults.success) throw new Error(`🚫 Bundling failed`);
}

console.log('\n✅ Lambdas bundled successfully!\n');
