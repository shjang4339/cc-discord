# cc-discord

Discord를 통한 원격 Claude Code 실행 - [cc-telegram](https://github.com/hada0127/cc-telegram)의 Discord 버전

휴대폰이나 Discord가 설치된 어떤 기기에서든 Claude Code 작업을 제어하세요!

## 주요 기능

- **원격 작업 실행**: Discord DM을 통해 Claude Code 작업 생성 및 관리
- **병렬 처리**: 여러 작업을 동시에 실행 (설정 가능)
- **우선순위 시스템**: 긴급(🔴), 높음(🟠), 보통(🟢), 낮음(🔵)
- **자동 재시도**: 실패 시 자동으로 재시도 (횟수 설정 가능)
- **실시간 모니터링**: 작업 상태 및 최근 출력 확인
- **보안**: 암호화된 토큰 저장, 단일 사용자 인증

## 설치

```bash
# 전역 설치
npm install -g cc-discord

# 또는 npx 사용
npx cc-discord
```

## 빠른 시작

### 1. Discord 애플리케이션 생성

1. [Discord 개발자 포털](https://discord.com/developers/applications) 접속
2. "New Application" 클릭 후 이름 입력
3. "Bot" 섹션 → "Add Bot" 클릭
4. **봇 토큰** 복사 (나중에 필요)
5. Privileged Gateway Intents에서 **Message Content Intent** 활성화

### 2. 봇 초대 URL 생성

1. "OAuth2" → "URL Generator" 이동
2. 스코프 선택:
   - `bot`
   - `applications.commands`
3. 봇 권한 선택:
   - Send Messages
   - Embed Links
   - Attach Files
   - Use Slash Commands
4. 생성된 URL을 복사하여 봇을 서버에 초대

### 3. 설정 실행

```bash
cc-discord
```

처음 실행 시 설정 마법사가 안내합니다:
- 봇 토큰 입력
- 애플리케이션 (Client) ID 입력

### 4. 명령어 배포

```bash
cc-discord --deploy
# 또는
npm run deploy
```

### 5. 봇 시작

```bash
cc-discord
```

### 6. 사용자 등록

Discord DM으로 봇에게 `/start`를 보내 사용자 ID를 등록하세요.

## Discord 명령어

| 명령어 | 설명 |
|--------|------|
| `/new` | 새 작업 생성 |
| `/list` | 대기 중인 작업 목록 |
| `/status` | 실행 중인 작업 및 최근 출력 |
| `/completed` | 완료된 작업 목록 |
| `/failed` | 실패한 작업 목록 (재시도 옵션 포함) |
| `/cancel` | 대기/실행 중인 작업 취소 |
| `/debug` | 시스템 정보 표시 |
| `/reset` | 모든 데이터 초기화 |

## 작업 유형

### 단순 작업 (Simple)
- 1회 실행
- 완료 기준 없음
- 빠르고 간단한 작업에 적합

### 복잡 작업 (Complex)
- 완료 기준 포함
- 실패 시 자동 재시도
- 더 나은 결과를 위해 plan 모드 사용
- 다단계 작업에 적합

## 설정

설정은 `.cc-discord/config.json`에 암호화되어 저장됩니다.

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `botToken` | Discord 봇 토큰 | - |
| `clientId` | 애플리케이션 Client ID | - |
| `userId` | 인가된 사용자 ID | - |
| `defaultMaxRetries` | 기본 재시도 횟수 | 15 |
| `parallelExecution` | 병렬 실행 활성화 | false |
| `maxParallel` | 최대 동시 작업 수 | 1 |
| `taskTimeout` | 작업 시간 제한 (ms) | 1800000 |

## CLI 옵션

```bash
cc-discord              # 봇 시작
cc-discord --setup      # 설정 마법사 실행
cc-discord --deploy     # 슬래시 명령어 배포
cc-discord --version    # 버전 표시
cc-discord --help       # 도움말 표시
```

## 요구 사항

- Node.js 18.0.0 이상
- Claude Code CLI 설치 및 설정 완료

## 프로젝트 구조

```
cc-discord/
├── src/
│   ├── discord/
│   │   ├── client.js         # Discord 클라이언트 설정
│   │   ├── deploy-commands.js # 명령어 배포
│   │   └── commands/         # 슬래시 명령어 핸들러
│   ├── config.js             # 설정 관리
│   ├── tasks.js              # 작업 큐 관리
│   ├── executor.js           # Claude Code 실행
│   ├── i18n.js               # 다국어 지원
│   ├── init.js               # 설정 마법사
│   ├── cli.js                # CLI 진입점
│   └── index.js              # 공개 API
├── package.json
└── README.md
```

## cc-telegram과의 차이점

| 기능 | cc-telegram | cc-discord |
|------|-------------|------------|
| 메시지 제한 | 4096자 | 2000자 (Embed: 4096) |
| 명령어 | 텍스트 기반 | 슬래시 명령어 |
| 버튼 | 인라인 키보드 | Discord 버튼 |
| 다단계 입력 | 상태 머신 | 모달 |
| 파일 업로드 제한 | 50MB | 10MB |

## 보안

- 봇 토큰과 사용자 ID는 AES-256-GCM으로 암호화
- 등록된 사용자만 봇과 상호작용 가능
- 모든 데이터는 로컬에 저장

## 라이선스

MIT

## 크레딧

hada0127의 [cc-telegram](https://github.com/hada0127/cc-telegram) 기반

## 링크

- [GitHub 저장소](https://github.com/shjang4339/cc-discord)
- [원본 cc-telegram](https://github.com/hada0127/cc-telegram)
- [Discord.js 문서](https://discord.js.org/)
