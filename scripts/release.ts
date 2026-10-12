import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readConfig } from '../src/server/config';

function requireRelease(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function releaseConfig(env: NodeJS.ProcessEnv) {
  const required = [
    'GCP_PROJECT_ID',
    'PEER_PROJECT_ID',
    'GCP_REGION',
    'CLOUD_RUN_SERVICE',
    'ARTIFACT_REPOSITORY',
    'APP_ORIGIN',
    'GCP_WORKLOAD_IDENTITY_PROVIDER',
    'GCP_DEPLOY_SERVICE_ACCOUNT',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_APP_ID',
    'GITHUB_SHA',
    'GITHUB_RUN_ID',
  ];
  for (const name of required) requireRelease(env[name]?.trim(), name + ' obrigatório');
  requireRelease(env.GITHUB_REF === 'refs/heads/main', 'Publicação somente a partir da main');
  requireRelease(
    ['staging', 'production'].includes(env.RELEASE_ENVIRONMENT || ''),
    'Ambiente inválido',
  );
  requireRelease(env.RELEASE_APPROVED === 'true', 'Liberação operacional pendente');
  requireRelease(
    /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(env.GCP_PROJECT_ID!) &&
      !env.GCP_PROJECT_ID!.startsWith('demo-'),
    'Projeto real obrigatório',
  );
  requireRelease(
    env.VITE_FIREBASE_PROJECT_ID === env.GCP_PROJECT_ID,
    'Projetos Firebase divergentes',
  );
  requireRelease(
    env.PEER_PROJECT_ID !== env.GCP_PROJECT_ID,
    'Homologação e produção devem usar projetos separados',
  );
  requireRelease(/^[a-z][a-z0-9-]{1,17}$/.test(env.CLOUD_RUN_SERVICE!), 'Serviço inválido');
  requireRelease(
    /^[a-z][a-z0-9-]{1,62}$/.test(env.ARTIFACT_REPOSITORY!),
    'Repositório de imagens inválido',
  );
  requireRelease(/^[a-z]+-[a-z]+[0-9]$/.test(env.GCP_REGION!), 'Região inválida');
  requireRelease(
    /^[a-f0-9]{40}$/.test(env.GITHUB_SHA!) && /^\d+$/.test(env.GITHUB_RUN_ID!),
    'Execução inválida',
  );
  const origin = new URL(env.APP_ORIGIN!);
  requireRelease(
    origin.protocol === 'https:' && origin.origin === env.APP_ORIGIN,
    'Origem HTTPS obrigatória',
  );
  requireRelease(
    /^projects\/\d+\/locations\/global\/workloadIdentityPools\/[a-z0-9-]+\/providers\/[a-z0-9-]+$/.test(
      env.GCP_WORKLOAD_IDENTITY_PROVIDER!,
    ),
    'Provedor de identidade inválido',
  );
  requireRelease(
    env.GCP_DEPLOY_SERVICE_ACCOUNT!.endsWith('@' + env.GCP_PROJECT_ID + '.iam.gserviceaccount.com'),
    'Identidade de publicação deve pertencer ao projeto',
  );
  if (env.RELEASE_ENVIRONMENT === 'production')
    requireRelease(
      env.STAGING_VALIDATED_SHA === env.GITHUB_SHA,
      'Homologação deste commit pendente',
    );
  return {
    project: env.GCP_PROJECT_ID!,
    region: env.GCP_REGION!,
    service: env.CLOUD_RUN_SERVICE!,
    repository: env.ARTIFACT_REPOSITORY!,
    origin: env.APP_ORIGIN!,
    sha: env.GITHUB_SHA!,
    runId: env.GITHUB_RUN_ID!,
    environment: env.RELEASE_ENVIRONMENT!,
  };
}
type Config = ReturnType<typeof releaseConfig>;
type Run = (command: string, args: string[]) => Promise<string>;
export interface ReleaseDependencies {
  run: Run;
  probe: (origin: string) => Promise<void>;
  record: (receipt: Record<string, unknown>) => Promise<void>;
}
const digestPattern = /@sha256:[a-f0-9]{64}$/;
function validateRuntime(template: any, config: Config, identity: string) {
  requireRelease(
    template?.serviceAccountName === identity && template.containers?.length === 1,
    'Identidade ou containers da aplicação divergentes',
  );
  const entries: any[] = template.containers[0].env || [];
  requireRelease(
    new Set(entries.map((entry) => entry.name)).size === entries.length,
    'Variáveis duplicadas no serviço',
  );
  const values = Object.fromEntries(
    entries.filter((entry) => entry.value !== undefined).map((entry) => [entry.name, entry.value]),
  );
  const secretNames = [
    'DAILY_API_KEY',
    'MP_CLIENT_SECRET',
    'MP_WEBHOOK_SECRET',
    'TOKEN_ENCRYPTION_KEY',
    'ASAAS_API_KEY',
    'ASAAS_WEBHOOK_TOKEN',
    'ASAAS_SANDBOX_API_KEY',
    'ASAAS_SANDBOX_WEBHOOK_TOKEN',
  ];
  requireRelease(!secretNames.some((name) => name in values), 'Segredos devem usar Secret Manager');
  const references = Object.fromEntries(
    entries
      .filter((entry) => entry.valueFrom?.secretKeyRef)
      .map((entry) => [entry.name, entry.valueFrom.secretKeyRef]),
  );
  const needed = ['DAILY_API_KEY'];
  if (values.PAYMENTS_ENABLED === 'true')
    needed.push('MP_CLIENT_SECRET', 'MP_WEBHOOK_SECRET', 'TOKEN_ENCRYPTION_KEY');
  if (values.SUBSCRIPTIONS_ENABLED === 'true' || values.ASAAS_SANDBOX_ENABLED === 'true')
    needed.push(
      ...(values.ASAAS_ENVIRONMENT === 'live'
        ? ['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN']
        : ['ASAAS_SANDBOX_API_KEY', 'ASAAS_SANDBOX_WEBHOOK_TOKEN']),
    );
  for (const name of needed) {
    requireRelease(
      references[name]?.name && /^[1-9][0-9]*$/.test(references[name].key),
      'Referência de segredo inválida: ' + name,
    );
  }
  requireRelease(
    values.NODE_ENV === 'production' &&
      values.FIREBASE_PROJECT_ID === config.project &&
      values.APP_ORIGIN === config.origin,
    'Configuração do serviço não corresponde à liberação',
  );
  // Validate public settings without reading or exporting any secret.
  readConfig({
    ...values,
    DAILY_API_KEY: 'secret-reference',
    MP_CLIENT_SECRET: 'secret-reference',
    MP_WEBHOOK_SECRET: 'secret-reference',
    TOKEN_ENCRYPTION_KEY: Buffer.alloc(32).toString('base64'),
    ASAAS_API_KEY: '$aact_prod_secret-reference',
    ASAAS_WEBHOOK_TOKEN: 'w'.repeat(40),
    ASAAS_SANDBOX_API_KEY: '$aact_hmlg_secret-reference',
    ASAAS_SANDBOX_WEBHOOK_TOKEN: 'w'.repeat(40),
  });
  requireRelease(/^[a-zA-Z0-9-]+$/.test(values.DAILY_DOMAIN || ''), 'Domínio Daily obrigatório');
  requireRelease(
    config.environment !== 'staging' ||
      (values.MP_ENVIRONMENT !== 'live' && values.ASAAS_ENVIRONMENT !== 'live'),
    'Homologação deve usar Mercado Pago sandbox',
  );
  requireRelease(
    config.environment !== 'production' ||
      (values.ASAAS_SANDBOX_ENABLED !== 'true' &&
        (values.SUBSCRIPTIONS_ENABLED !== 'true' || values.ASAAS_ENVIRONMENT === 'live')),
    'Produção não permite assinaturas Sandbox',
  );
  return { values, references };
}

export async function executeRelease(config: Config, deps: ReleaseDependencies) {
  const { run, probe, record } = deps;
  const scope = ['--project=' + config.project, '--region=' + config.region, '--quiet'];
  const service = JSON.parse(
    await run('gcloud', ['run', 'services', 'describe', config.service, ...scope, '--format=json']),
  );
  const jobName = config.service + '-maintenance';
  const job = JSON.parse(
    await run('gcloud', ['run', 'jobs', 'describe', jobName, ...scope, '--format=json']),
  );
  const webRuntime = validateRuntime(
    service.spec?.template?.spec,
    config,
    config.service + '-web@' + config.project + '.iam.gserviceaccount.com',
  );
  const jobRuntime = validateRuntime(
    job.spec?.template?.spec?.template?.spec,
    config,
    config.service + '-maintenance@' + config.project + '.iam.gserviceaccount.com',
  );
  for (const name of [
    'FIRESTORE_DATABASE_ID',
    'PAYMENTS_ENABLED',
    'MP_ENVIRONMENT',
    'MP_CLIENT_ID',
    'SUBSCRIPTIONS_ENABLED',
    'ASAAS_ENVIRONMENT',
    'ASAAS_ACCOUNT_ID',
    'ASAAS_SANDBOX_ACCOUNT_ID',
    'SUBSCRIPTION_CANCEL_CREDITS',
    'SUBSCRIPTION_RULES_APPROVED',
    'ASAAS_PRODUCTION_APPROVED',
    'ASAAS_SANDBOX_ENABLED',
  ])
    requireRelease(
      webRuntime.values[name] === jobRuntime.values[name],
      'Site e manutenção devem usar a mesma configuração financeira e banco',
    );
  for (const name of new Set([
    ...Object.keys(webRuntime.references),
    ...Object.keys(jobRuntime.references),
  ]))
    requireRelease(
      webRuntime.references[name]?.name === jobRuntime.references[name]?.name &&
        webRuntime.references[name]?.key === jobRuntime.references[name]?.key,
      'Site e manutenção devem usar as mesmas versões de segredos',
    );
  const traffic = (service.status?.traffic || []).filter((target: any) => target.percent > 0);
  requireRelease(
    traffic.length === 1 && traffic[0].percent === 100 && traffic[0].revisionName,
    'A liberação exige uma revisão estável com 100% do tráfego',
  );
  const previousRevision = traffic[0].revisionName as string;
  const previousJobImage = job.spec.template.spec.template.spec.containers[0].image as string;
  requireRelease(digestPattern.test(previousJobImage), 'Imagem anterior do job deve ser imutável');
  const registry = config.region + '-docker.pkg.dev';
  const imagePath = registry + '/' + config.project + '/' + config.repository + '/app';
  const tag = imagePath + ':' + config.sha + '-' + config.runId;
  const candidateTag = 'release-' + config.runId;
  await run('gcloud', ['auth', 'configure-docker', registry, '--quiet']);
  await run('docker', ['tag', 'talke-release:local', tag]);
  await run('docker', ['push', tag]);
  const digest = (
    await run('gcloud', [
      'artifacts',
      'docker',
      'images',
      'describe',
      tag,
      '--project=' + config.project,
      '--format=value(image_summary.digest)',
    ])
  ).trim();
  requireRelease(/^sha256:[a-f0-9]{64}$/.test(digest), 'Digest da imagem inválido');
  const image = imagePath + '@' + digest;
  const receipt = {
    environment: config.environment,
    project: config.project,
    service: config.service,
    sha: config.sha,
    image,
    previousRevision,
    previousJobImage,
    createdAt: new Date().toISOString(),
  };
  await record({ ...receipt, status: 'PREPARED' });
  let jobAttempted = false,
    promotionAttempted = false,
    revision = '';
  try {
    await run('gcloud', [
      'run',
      'services',
      'update',
      config.service,
      ...scope,
      '--image=' + image,
      '--no-traffic',
      '--tag=' + candidateTag,
    ]);
    const candidate = JSON.parse(
      await run('gcloud', [
        'run',
        'services',
        'describe',
        config.service,
        ...scope,
        '--format=json',
      ]),
    );
    const target = candidate.status?.traffic?.find((item: any) => item.tag === candidateTag);
    requireRelease(
      target?.revisionName &&
        target.url &&
        new URL(target.url).protocol === 'https:' &&
        new URL(target.url).hostname.endsWith('.run.app'),
      'Revisão candidata não está pronta',
    );
    revision = target.revisionName;
    await probe(target.url);
    jobAttempted = true;
    await run('gcloud', ['run', 'jobs', 'update', jobName, ...scope, '--image=' + image]);
    promotionAttempted = true;
    await run('gcloud', [
      'run',
      'services',
      'update-traffic',
      config.service,
      ...scope,
      '--to-revisions=' + revision + '=100',
    ]);
    await probe(config.origin);
    await run('gcloud', [
      'run',
      'services',
      'update-traffic',
      config.service,
      ...scope,
      '--remove-tags=' + candidateTag,
    ]);
    await record({ ...receipt, revision, status: 'SUCCEEDED' });
    return { image, revision };
  } catch {
    let recoveryFailed = false;
    // A command can fail after its remote mutation. Restore every attempted mutation.
    if (promotionAttempted) {
      try {
        await run('gcloud', [
          'run',
          'services',
          'update-traffic',
          config.service,
          ...scope,
          '--to-revisions=' + previousRevision + '=100',
        ]);
      } catch {
        recoveryFailed = true;
      }
    }
    if (jobAttempted) {
      try {
        await run('gcloud', [
          'run',
          'jobs',
          'update',
          jobName,
          ...scope,
          '--image=' + previousJobImage,
        ]);
      } catch {
        recoveryFailed = true;
      }
    }
    try {
      await run('gcloud', [
        'run',
        'services',
        'update-traffic',
        config.service,
        ...scope,
        '--remove-tags=' + candidateTag,
      ]);
    } catch {
      recoveryFailed = true;
    }
    await record({
      ...receipt,
      revision,
      status: recoveryFailed ? 'RECOVERY_REQUIRED' : 'FAILED_RESTORED',
    });
    throw new Error(
      recoveryFailed
        ? 'Falha de publicação e de reversão: intervenção operacional obrigatória'
        : 'Publicação recusada; tráfego e job anteriores preservados ou restaurados',
    );
  }
}

export async function probeRelease(origin: string, request: typeof fetch = fetch) {
  for (const path of ['/api/health', '/api/ready', '/']) {
    const response = await request(origin + path, {
      signal: AbortSignal.timeout(15_000),
      redirect: 'error',
    });
    requireRelease(response.ok, 'Revisão indisponível');
    if (path !== '/')
      requireRelease(
        (await response.json()).status === (path === '/api/health' ? 'ok' : 'ready'),
        'Resposta de saúde inválida',
      );
    else
      requireRelease(
        response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"),
        'Cabeçalhos de segurança ausentes',
      );
  }
  const privateResponse = await request(origin + '/api/me', {
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  requireRelease(
    privateResponse.status === 401 && privateResponse.headers.get('cache-control') === 'no-store',
    'API privada deve exigir sessão',
  );
}
const exec = promisify(execFile);
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = releaseConfig(process.env);
    if (process.argv[2] === 'check') console.log('Configuração pública da liberação verificada');
    else {
      await executeRelease(config, {
        run: async (command, args) => {
          try {
            return (await exec(command, args, { timeout: 240_000, maxBuffer: 4 * 1024 * 1024 }))
              .stdout;
          } catch {
            throw new Error('Comando de publicação falhou');
          }
        },
        probe: probeRelease,
        record: async (receipt) => {
          await mkdir('.release', { recursive: true });
          await writeFile('.release/receipt.json', JSON.stringify(receipt, null, 2));
        },
      });
      console.log('Publicação concluída e verificada');
    }
  } catch (error) {
    // Do not print gcloud responses, environment maps or authentication files.
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}
