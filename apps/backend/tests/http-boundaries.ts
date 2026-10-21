import { Pool } from 'pg';

if (!process.env.TEST_DATABASE_URL || !process.env.TEST_REDIS_URL)
  throw new Error(
    'Set TEST_DATABASE_URL and TEST_REDIS_URL to disposable test services',
  );
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
await pool.query(
  `INSERT INTO agents (id,name,"createdBy","orgId") VALUES ('boot_agent','Synthetic boot agent','boot_user','boot_org') ON CONFLICT (id) DO UPDATE SET "agentStatus"='active'`,
);
await pool.query(
  `INSERT INTO channels (id,"agentId",type,enabled,config,usage,"createdBy") VALUES ('boot_web','boot_agent','web',true,'{}','{}','boot_user'),('boot_private','boot_agent','whatsapp',true,'{}','{}','boot_user') ON CONFLICT (id) DO NOTHING`,
);
await pool.query(`UPDATE channels SET config=$1 WHERE id='boot_web'`, [
  JSON.stringify({
    displayName: 'Synthetic',
    welcomeMessage: 'Hello',
    primaryColor: '#301B69',
    allowedDomains: [],
  }),
]);
const server = Bun.spawn(['bun', 'src/server.ts'], {
  cwd: `${import.meta.dir}/..`,
  env: {
    ...process.env,
    PORT: '3010',
    REDIS_URL: process.env.TEST_REDIS_URL,
    OPENAI_API_KEY: 'synthetic-not-a-real-key',
    CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('test.clerk.accounts.dev$').toString('base64')}`,
    CLERK_SECRET_KEY: 'sk_test_synthetic_not_a_real_key',
    TOKEN_ENCRYPTION_KEY: 'ab'.repeat(32),
    WHATSAPP_APP_SECRET: 'synthetic-signing-secret',
    SLACK_SIGNING_SECRET: 'synthetic-signing-secret',
  },
  stdout: Bun.file('/tmp/boot.log'),
  stderr: Bun.file('/tmp/boot-errors.log'),
});
const base = 'http://127.0.0.1:3010';
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${base}/docs/json`);
      ready = true;
      break;
    } catch {
      await Bun.sleep(100);
    }
  }
  if (!ready) {
    console.log(await Bun.file('/tmp/boot-errors.log').text());
    throw new Error('API failed to boot');
  }
  const cases = [
    ['GET', '/admin/queue/counts', undefined, 401],
    [
      'GET',
      '/slack/oauth/callback?code=synthetic&state=boot_org',
      undefined,
      403,
    ],
    ['POST', '/webhook/whatsapp', {}, 403],
    [
      'POST',
      '/webhook/slack',
      { type: 'url_verification', challenge: 'synthetic' },
      403,
    ],
    ['GET', '/chatv2/channel?channelId=boot_private', undefined, 404],
    ['GET', '/chatv2/channel?channelId=boot_web', undefined, 200],
    ['POST', '/chatv2/session', { channelId: 'boot_web' }, 200],
    [
      'POST',
      '/chatv2',
      {
        channelId: 'boot_web',
        conversationToken: 'forged',
        message: 'synthetic',
      },
      403,
    ],
    [
      'POST',
      '/chatv2',
      {
        channelId: 'boot_web',
        conversationId: 'attacker-chosen',
        message: 'synthetic',
      },
      422,
    ],
  ] as const;
  for (const [method, path, body, expected] of cases) {
    const r = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status !== expected) {
      console.log(
        method,
        path,
        'expected',
        expected,
        'received',
        r.status,
        await r.text(),
      );
      throw new Error('Boundary check failed');
    }
    console.log(method, path.split('?')[0], r.status);
  }
  console.log(
    'Full API boot and 9 HTTP boundary checks passed; no paid provider calls.',
  );
} finally {
  server.kill();
  await server.exited;
  await pool.end();
}
