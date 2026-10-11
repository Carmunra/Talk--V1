import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function settings(env = process.env) {
  const requireValue = (key, pattern) => {
    const value = env[key] || '';
    if (!pattern.test(value)) throw new Error('Invalid or missing ' + key);
    return value;
  };
  if (env.HOSTING_PROVIDER !== 'aws' || env.AWS_RELEASE_APPROVED !== 'true')
    throw new Error('AWS release approval required');
  const environment = requireValue('RELEASE_ENVIRONMENT', /^(staging|production)$/);
  const sha = requireValue('GITHUB_SHA', /^[a-f0-9]{40}$/);
  if (env.GITHUB_REF !== 'refs/heads/main') throw new Error('Publish only main');
  if (environment === 'production' && env.STAGING_VALIDATED_SHA !== sha)
    throw new Error('Validate this commit in staging first');
  const account = requireValue('AWS_ACCOUNT_ID', /^[0-9]{12}$/);
  requireValue(
    'AWS_DEPLOY_ROLE',
    new RegExp('^arn:aws:iam::' + account + ':role/talke-' + environment + '-github-deploy$'),
  );
  const region = requireValue('AWS_REGION', /^sa-east-1$/);
  const instance = requireValue('AWS_INSTANCE_ID', /^i-[a-f0-9]{17}$/);
  if (!/^i-[a-f0-9]{17}$/.test(env.PEER_INSTANCE_ID || '') || env.PEER_INSTANCE_ID === instance)
    throw new Error('Separate staging and production instances');
  const repository = requireValue(
    'AWS_ECR_REPOSITORY',
    new RegExp(
      '^' + account + '\\.dkr\\.ecr\\.' + region + '\\.amazonaws\\.com/talke-' + environment + '$',
    ),
  );
  const version = requireValue('AWS_SECRET_VERSION_ID', /^[a-fA-F0-9-]{32,64}$/);
  const project = requireValue('VITE_FIREBASE_PROJECT_ID', /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/);
  if (
    project.startsWith('demo-') ||
    !env.PEER_FIREBASE_PROJECT_ID ||
    env.PEER_FIREBASE_PROJECT_ID === project
  )
    throw new Error('Separate real Firebase projects required');
  for (const key of [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_APP_ID',
  ]) {
    if (!env[key] || /demo|placeholder|example|PENDENTE/i.test(env[key]))
      throw new Error('Real public Firebase config required: ' + key);
  }
  const origin = requireValue('APP_ORIGIN', /^https:\/\/[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/);
  return { environment, sha, account, region, instance, repository, version, project, origin };
}

export function aws(args) {
  // Never print CLI stderr: provider responses can contain operational details.
  return JSON.parse(
    execFileSync('aws', ['--no-cli-pager', '--output', 'json', ...args], {
      encoding: 'utf8',
      timeout: 60_000,
    }),
  );
}

export async function publish(
  cfg,
  call = aws,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  const identity = call(['sts', 'get-caller-identity']);
  if (identity.Account !== cfg.account) throw new Error('Wrong AWS account');
  const described = call(['ec2', 'describe-instances', '--instance-ids', cfg.instance]);
  const instance = described.Reservations?.flatMap((r) => r.Instances || []).find(
    (i) => i.InstanceId === cfg.instance,
  );
  const tags = Object.fromEntries((instance?.Tags || []).map((t) => [t.Key, t.Value]));
  if (
    !instance ||
    instance.State?.Name !== 'running' ||
    tags.Application !== 'Talke' ||
    tags.Environment !== cfg.environment ||
    instance.MetadataOptions?.HttpTokens !== 'required'
  )
    throw new Error('Wrong or unsafe instance');
  const repositoryName = cfg.repository.split('/')[1];
  const found = call([
    'ecr',
    'describe-images',
    '--repository-name',
    repositoryName,
    '--image-ids',
    'imageTag=' + cfg.sha,
  ]);
  const digest = found.imageDetails?.[0]?.imageDigest;
  if (!/^sha256:[a-f0-9]{64}$/.test(digest || '')) throw new Error('Missing immutable image');
  const image = cfg.repository + '@' + digest;
  const scan = call([
    'ecr',
    'describe-image-scan-findings',
    '--repository-name',
    repositoryName,
    '--image-id',
    'imageDigest=' + digest,
  ]);
  if (
    scan.imageScanStatus?.status !== 'COMPLETE' ||
    (scan.imageScanFindings?.findingSeverityCounts?.HIGH || 0) > 0 ||
    (scan.imageScanFindings?.findingSeverityCounts?.CRITICAL || 0) > 0
  )
    throw new Error('Image scan pending or has high/critical vulnerabilities');
  // Image and version are allowlisted; do not concatenate unchecked shell parameters.
  const sent = call([
    'ssm',
    'send-command',
    '--document-name',
    'AWS-RunShellScript',
    '--instance-ids',
    cfg.instance,
    '--timeout-seconds',
    '300',
    '--parameters',
    JSON.stringify({
      commands: ['python3 /opt/talke/runtime.py release ' + image + ' ' + cfg.version],
      executionTimeout: ['600'],
    }),
  ]);
  const commandId = sent.Command?.CommandId;
  if (!/^[a-f0-9-]{36}$/.test(commandId || '')) throw new Error('Invalid SSM command ID');
  for (let attempt = 0; attempt < 150; attempt++) {
    await sleep(5000);
    let result;
    try {
      result = call([
        'ssm',
        'get-command-invocation',
        '--command-id',
        commandId,
        '--instance-id',
        cfg.instance,
      ]);
    } catch {
      continue;
    } // SSM may not yet expose the invocation.
    if (result.Status === 'Success' && result.ResponseCode === 0) {
      const lines = (result.StandardOutputContent || '').trim().split('\n');
      let receipt;
      try {
        receipt = JSON.parse(lines.at(-1));
      } catch {
        throw new Error('Missing host receipt');
      }
      if (
        receipt.status !== 'published' ||
        receipt.image !== image ||
        receipt.secret_version !== cfg.version
      )
        throw new Error('Host receipt does not match release');
      return {
        ...receipt,
        commit: cfg.sha,
        environment: cfg.environment,
        instance: cfg.instance,
        commandId,
      };
    }
    if (!['Pending', 'InProgress', 'Delayed'].includes(result.Status))
      throw new Error('Host deployment failed; check sanitized host status and rollback');
  }
  throw new Error('SSM outcome unknown; inspect command and pending journal before retrying');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const cfg = settings();
    if (process.argv[2] !== 'check') {
      const receipt = await publish(cfg);
      mkdirSync('.release', { recursive: true });
      writeFileSync('.release/aws-receipt.json', JSON.stringify(receipt, null, 2));
      console.log('AWS release verified for ' + receipt.commit);
    } else console.log('AWS release configuration validated');
  } catch {
    // Avoid leaking a process exception with arguments or cloud output.
    console.error(
      'AWS publication failed or remains unconfirmed. Review release configuration and sanitized host status.',
    );
    process.exitCode = 1;
  }
}
