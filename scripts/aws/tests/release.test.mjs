import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settings, publish } from '../release.mjs';
const sha = 'a'.repeat(40),
  digest = 'sha256:' + 'b'.repeat(64);
const env = {
  HOSTING_PROVIDER: 'aws',
  AWS_RELEASE_APPROVED: 'true',
  RELEASE_ENVIRONMENT: 'staging',
  GITHUB_SHA: sha,
  GITHUB_REF: 'refs/heads/main',
  AWS_ACCOUNT_ID: '123456789012',
  AWS_DEPLOY_ROLE: 'arn:aws:iam::123456789012:role/talke-staging-github-deploy',
  AWS_REGION: 'sa-east-1',
  AWS_INSTANCE_ID: 'i-0123456789abcdef0',
  PEER_INSTANCE_ID: 'i-1123456789abcdef0',
  AWS_ECR_REPOSITORY: '123456789012.dkr.ecr.sa-east-1.amazonaws.com/talke-staging',
  AWS_SECRET_VERSION_ID: 'a'.repeat(32),
  APP_ORIGIN: 'https://staging.example.test',
  VITE_FIREBASE_PROJECT_ID: 'talke-staging',
  PEER_FIREBASE_PROJECT_ID: 'talke-production',
  VITE_FIREBASE_API_KEY: 'real-config-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'talke-staging.firebaseapp.com',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
};
function cloud(overrides = {}) {
  const calls = [];
  const call = (args) => {
    calls.push(args);
    const action = args[1];
    if (action in overrides) return overrides[action];
    if (action === 'get-caller-identity') return { Account: env.AWS_ACCOUNT_ID };
    if (action === 'describe-instances')
      return {
        Reservations: [
          {
            Instances: [
              {
                InstanceId: env.AWS_INSTANCE_ID,
                State: { Name: 'running' },
                MetadataOptions: { HttpTokens: 'required' },
                Tags: [
                  { Key: 'Application', Value: 'Talke' },
                  { Key: 'Environment', Value: 'staging' },
                ],
              },
            ],
          },
        ],
      };
    if (action === 'describe-images') return { imageDetails: [{ imageDigest: digest }] };
    if (action === 'describe-image-scan-findings')
      return {
        imageScanStatus: { status: 'COMPLETE' },
        imageScanFindings: { findingSeverityCounts: {} },
      };
    if (action === 'send-command')
      return { Command: { CommandId: '12345678-1234-1234-1234-123456789012' } };
    if (action === 'get-command-invocation')
      return {
        Status: 'Success',
        ResponseCode: 0,
        StandardOutputContent: JSON.stringify({
          status: 'published',
          image: env.AWS_ECR_REPOSITORY + '@' + digest,
          secret_version: env.AWS_SECRET_VERSION_ID,
        }),
      };
    throw new Error('Unexpected cloud action');
  };
  return { call, calls };
}
test('AWS publication rejects missing approvals, wrong targets and unvalidated production before cloud calls', () => {
  assert.equal(settings(env).environment, 'staging');
  for (const override of [
    { HOSTING_PROVIDER: 'google' },
    { AWS_RELEASE_APPROVED: 'false' },
    { GITHUB_REF: 'refs/heads/feature' },
    { RELEASE_ENVIRONMENT: 'production' },
    { AWS_ACCOUNT_ID: 'invalid' },
    { AWS_REGION: 'us-east-1' },
    { PEER_INSTANCE_ID: env.AWS_INSTANCE_ID },
    { PEER_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID },
    { AWS_SECRET_VERSION_ID: 'latest' },
    { VITE_FIREBASE_PROJECT_ID: 'demo-talke' },
    { AWS_ECR_REPOSITORY: env.AWS_ECR_REPOSITORY + ';evil' },
    { APP_ORIGIN: 'https://talke.club/path' },
  ])
    assert.throws(() => settings({ ...env, ...override }));
});
test('publishes only inspected immutable image and pinned secret to the verified environment', async () => {
  const f = cloud();
  const receipt = await publish(settings(env), f.call, async () => {});
  assert.equal(receipt.commit, sha);
  const sent = f.calls.find((c) => c[1] === 'send-command');
  const params = JSON.parse(sent.at(-1));
  assert.match(params.commands[0], /@sha256:[b]{64} [a]{32}$/);
  assert.equal(params.executionTimeout[0], '600');
  assert.equal(JSON.stringify(receipt).includes('private_key'), false);
});
test('wrong account, unsafe instance or unresolved image scan never sends a command', async () => {
  for (const overrides of [
    { 'get-caller-identity': { Account: '999999999999' } },
    { 'describe-instances': { Reservations: [] } },
    { 'describe-images': { imageDetails: [{ imageDigest: 'latest' }] } },
    { 'describe-image-scan-findings': { imageScanStatus: { status: 'PENDING' } } },
    {
      'describe-image-scan-findings': {
        imageScanStatus: { status: 'COMPLETE' },
        imageScanFindings: { findingSeverityCounts: { HIGH: 1 } },
      },
    },
    {
      'describe-image-scan-findings': {
        imageScanStatus: { status: 'COMPLETE' },
        imageScanFindings: { findingSeverityCounts: { CRITICAL: 1 } },
      },
    },
  ]) {
    const f = cloud(overrides);
    await assert.rejects(publish(settings(env), f.call, async () => {}));
    assert.equal(
      f.calls.some((c) => c[1] === 'send-command'),
      false,
    );
  }
});
test('failed deployment or mismatched receipt cannot be reported as published', async () => {
  for (const outcome of [
    { Status: 'Failed', ResponseCode: 1 },
    {
      Status: 'Success',
      ResponseCode: 0,
      StandardOutputContent: '{"status":"published","image":"wrong"}',
    },
  ])
    await assert.rejects(
      publish(settings(env), cloud({ 'get-command-invocation': outcome }).call, async () => {}),
    );
});
test('an unknown SSM outcome stops and requires inspection rather than issuing another release', async () => {
  const f = cloud({ 'get-command-invocation': { Status: 'InProgress' } });
  await assert.rejects(
    publish(settings(env), f.call, async () => {}),
    /outcome unknown/,
  );
  assert.equal(f.calls.filter((c) => c[1] === 'send-command').length, 1);
});
