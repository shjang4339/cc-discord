# cc-discord 프로젝트 구조

## 폴더 트리

```
cc-discord/
├── .claude/
│   ├── agents/
│   │   ├── discord-bot-developer.md
│   │   ├── claude-code-executor.md
│   │   └── task-management-architect.md
│   ├── docs/
│   │   ├── features.md
│   │   └── structure.md
│   ├── skills/
│   │   ├── discord-bot/SKILL.md
│   │   ├── claude-executor/SKILL.md
│   │   ├── task-manager/SKILL.md
│   │   ├── encryption/SKILL.md
│   │   ├── init-setup/SKILL.md
│   │   └── npm-package-init/SKILL.md
│   └── CLAUDE.md
├── src/
│   ├── discord/
│   │   ├── commands/
│   │   │   ├── new.js
│   │   │   ├── list.js
│   │   │   ├── status.js
│   │   │   ├── completed.js
│   │   │   ├── failed.js
│   │   │   ├── cancel.js
│   │   │   ├── debug.js
│   │   │   └── reset.js
│   │   ├── client.js
│   │   └── deploy-commands.js
│   ├── locales/
│   │   └── ko.json
│   ├── cli.js
│   ├── config.js
│   ├── executor.js
│   ├── i18n.js
│   ├── index.js
│   ├── init.js
│   └── tasks.js
├── .gitignore
├── package.json
├── README.md
└── README.ko.md
```

## 소스 파일 설명

### 핵심 모듈

| 파일 | 역할 | 주요 exports |
|------|------|-------------|
| cli.js | CLI 진입점 | main() |
| config.js | 설정 관리 (암호화) | loadConfig, saveConfig, configExists |
| tasks.js | 작업 큐 관리 | createTask, getAllPendingTasks, completeTask, failTask |
| executor.js | Claude 실행 | startExecutor, stopExecutor, executeTask |
| i18n.js | 다국어 지원 | t(), init(), setLang() |
| init.js | 설정 마법사 | runSetup, needsSetup |
| index.js | 공개 API | 모든 모듈 re-export |

### Discord 모듈

| 파일 | 역할 |
|------|------|
| discord/client.js | Discord 클라이언트, 이벤트 핸들링 |
| discord/deploy-commands.js | 슬래시 커맨드 등록 스크립트 |
| discord/commands/*.js | 각 슬래시 커맨드 구현 |

## 런타임 데이터 구조

### .cc-discord/ (데이터 폴더)

```
.cc-discord/
├── config.json       # 암호화된 설정
├── tasks.json        # 대기 작업 인덱스 [taskId, ...]
├── completed.json    # 완료 작업 인덱스
├── failed.json       # 실패 작업 인덱스
├── tasks/            # 개별 작업 파일 (*.json)
├── completed/        # 완료된 작업 파일
├── failed/           # 실패한 작업 파일
└── logs/             # 일별 로그 파일
```

### config.json 구조

```json
{
  "botToken": "암호화된 토큰",
  "clientId": "암호화된 Client ID",
  "userId": "암호화된 사용자 ID",
  "debugMode": false,
  "claudeCommand": null,
  "logRetentionDays": 7,
  "defaultMaxRetries": 15,
  "parallelExecution": false,
  "maxParallel": 1,
  "taskTimeout": 1800000
}
```

### 작업 파일 구조

```json
{
  "id": "20260120-095230-ABC",
  "requirement": "작업 요구사항",
  "completionCriteria": "완료 기준",
  "maxRetries": 15,
  "currentRetry": 0,
  "priority": 2,
  "complexity": "simple",
  "status": "ready",
  "attachments": [],
  "createdAt": "2026-01-20T09:52:30.000Z",
  "updatedAt": "2026-01-20T09:52:30.000Z"
}
```

## 의존성 관계

```
cli.js
  ├── init.js
  │   └── config.js
  ├── discord/client.js
  │   ├── config.js
  │   ├── tasks.js
  │   └── i18n.js
  ├── executor.js
  │   ├── config.js
  │   ├── tasks.js
  │   └── discord/client.js (sendMessage)
  └── tasks.js
      └── config.js (getDataDir)
```

## 실행 흐름

```
npx cc-discord
     │
     ▼
  cli.js
     │
     ├─ needsSetup()? ──yes──▶ runSetup() ──▶ exit
     │
     ▼ no
  loadConfig()
     │
     ▼
  startBot() ───────────────▶ Discord 연결
     │                              │
     ▼                              ▼
  startExecutor()          슬래시 커맨드 처리
     │                              │
     ▼                              ▼
  5초마다 작업 확인          /new, /list, /status...
     │
     ▼
  executeTask()
     │
     ├─ success ──▶ completeTask() ──▶ Discord 알림
     │
     └─ failure ──▶ incrementRetry()
                       │
                       ├─ canRetry ──▶ 다시 ready 상태
                       │
                       └─ 소진 ──▶ failTask() ──▶ Discord 알림
```
