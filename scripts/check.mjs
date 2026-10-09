// sites.json의 사이트를 확인하고 data/status.json을 갱신한다.
// 상태가 바뀌거나 장애 시간이 늘었을 때만 파일이 바뀌므로 커밋도 그때만 생긴다.
import { readFile, writeFile } from 'node:fs/promises';

const INTERVAL_MINUTES = 5;
const TIMEOUT_MS = 10_000;
const SLOW_MS = 3_000;
const KEEP_DAYS = 90;
const OUTPUT = 'data/status.json';

const sites = JSON.parse(await readFile('sites.json', 'utf8'));
const previous = JSON.parse(await readFile(OUTPUT, 'utf8').catch(() => '[]'));

// 한국 시간 기준 날짜 (YYYY-MM-DD)
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

async function check(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    const ms = Date.now() - started;
    if (!res.ok) return { status: 'down', detail: `HTTP ${res.status}` };
    return { status: ms > SLOW_MS ? 'degraded' : 'up', detail: `${ms}ms` };
  } catch (err) {
    return { status: 'down', detail: err.name === 'TimeoutError' ? 'timeout' : err.message };
  }
}

const result = await Promise.all(sites.map(async site => {
  const prev = previous.find(p => p.slug === site.slug);
  const { status, detail } = await check(site.url);
  console.log(`${site.slug}: ${status} (${detail})`);

  const dailyMinutesDown = Object.fromEntries(
    Object.entries(prev?.dailyMinutesDown ?? {}).filter(([day]) => day >= cutoff)
  );
  if (status === 'down') {
    dailyMinutesDown[today] = (dailyMinutesDown[today] ?? 0) + INTERVAL_MINUTES;
  }

  return {
    ...site,
    status,
    since: prev?.since ?? new Date().toISOString(),
    dailyMinutesDown,
  };
}));

await writeFile(OUTPUT, JSON.stringify(result, null, 2) + '\n');
