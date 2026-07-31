import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../manifests/', import.meta.url))
const semverPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const digestPattern = /^sha256:[a-f0-9]{64}$/
const migrationRisks = new Set(['none', 'low', 'medium', 'high'])

async function jsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await jsonFiles(path))
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(path)
  }
  return files
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function validate(manifest, file) {
  assert(manifest?.schemaVersion === 1, `${file}: schemaVersion must be 1`)
  assert(manifest.product === 'javdbviewed-cloud', `${file}: unsupported product`)
  assert(manifest.channel === 'stable', `${file}: unsupported channel`)
  assert(semverPattern.test(manifest.latest?.version ?? ''), `${file}: latest.version must be semver`)
  assert(typeof manifest.latest?.commit === 'string' && /^[a-f0-9]{40}$/.test(manifest.latest.commit), `${file}: latest.commit must be a full Git SHA`)
  assert(typeof manifest.latest?.buildNumber === 'string' && manifest.latest.buildNumber.length > 0, `${file}: latest.buildNumber is required`)
  assert(!Number.isNaN(Date.parse(manifest.latest?.releasedAt ?? '')), `${file}: latest.releasedAt must be an ISO timestamp`)
  assert(typeof manifest.latest?.image === 'string' && manifest.latest.image.startsWith('ghcr.io/lmixture/'), `${file}: latest.image must be a GHCR image`)
  assert(typeof manifest.latest?.releaseNotesUrl === 'string' && manifest.latest.releaseNotesUrl.startsWith('https://github.com/lmixture/JavdBviewed-release/'), `${file}: latest.releaseNotesUrl must be hosted by this repository`)
  assert(typeof manifest.latest?.requiresBackup === 'boolean', `${file}: latest.requiresBackup must be boolean`)
  assert(migrationRisks.has(manifest.latest?.migrationRisk), `${file}: latest.migrationRisk is invalid`)
  assert(semverPattern.test(manifest.latest?.minCurrentVersion ?? ''), `${file}: latest.minCurrentVersion must be semver`)
  if (manifest.latest.imageDigest) assert(digestPattern.test(manifest.latest.imageDigest), `${file}: latest.imageDigest must be a sha256 digest`)
}

const files = await jsonFiles(root)
assert(files.length > 0, 'No manifest files found')
for (const file of files) {
  const manifest = JSON.parse(await readFile(file, 'utf8'))
  validate(manifest, file)
  console.log(`OK ${file}`)
}
