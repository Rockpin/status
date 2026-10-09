# Rockpin Status

[status.rockp.in](https://status.rockp.in) 상태 페이지와 서비스 감시.

| 경로 | 역할 |
|---|---|
| `sites.json` | 감시 대상 목록 |
| `scripts/check.mjs` | 사이트 확인 후 `data/status.json` 갱신 |
| `data/status.json` | 현재 상태와 일별 장애 시간 (자동 생성, 최근 90일) |
| `public/` | 상태 페이지 → Cloudflare Pages |
| `.github/workflows/check.yml` | 5분마다 확인, 변경 시 커밋 |
| `.github/workflows/deploy.yml` | `public/` 변경 시 배포 |

- 감시 대상 추가: `sites.json`에 항목 추가
- 화면 수정: `public/index.html` 수정 후 push
- 로컬 확인: `node scripts/check.mjs`
