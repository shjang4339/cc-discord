# cc-discord 구현 기능

Discord를 통해 Claude Code를 원격으로 실행하고 관리하는 CLI 도구의 전체 기능 명세

## 모듈별 기능

### Discord 봇 (discord/client.js)

**메시지 수신 방식**
- WebSocket 기반 실시간 이벤트 수신 (Discord.js 내장)
- DM (Direct Message) 전용 모드

**지원 슬래시 커맨드**
| 커맨드 | 설명 |
|--------|------|
| `/new` | 새 작업 생성 (복잡도/우선순위 선택 → Modal 입력) |
| `/list` | 대기 중인 작업 목록 (Embed) |
| `/status` | 실행 중인 작업 + 최근 출력 (취소 버튼) |
| `/completed` | 완료된 작업 목록 |
| `/failed` | 실패한 작업 목록 (재시도 버튼) |
| `/cancel` | 작업 취소 (선택 메뉴) |
| `/debug` | 시스템 정보 (메모리, 가동시간, 작업 통계) |
| `/reset` | 전체 데이터 초기화 (확인 버튼) |

**인터랙션 컴포넌트**
- Button: 복잡도 선택, 작업 취소, 재시도, 초기화 확인
- SelectMenu: 우선순위 선택, 작업 선택
- Modal: 작업 요구사항 및 완료 기준 입력

### 작업 관리 (tasks.js)

**우선순위 시스템**
| 레벨 | 값 | 표시 |
|------|-----|------|
| URGENT | 4 | 🔴 긴급 |
| HIGH | 3 | 🟠 높음 |
| NORMAL | 2 | 🟢 보통 |
| LOW | 1 | 🔵 낮음 |

**작업 유형**
- **Simple**: 1회 실행, 완료 기준 없음
- **Complex**: 완료 기준 포함, 자동 재시도

**상태 관리**
- ready: 대기 중
- inProgress: 실행 중
- completed: 완료
- failed: 실패 (재시도 소진)

### Claude 실행기 (executor.js)

**실행 방식**
- spawn으로 Claude 프로세스 시작
- 5초마다 대기 작업 확인
- 기본 30분 타임아웃

**결과 판정 (우선순위)**
1. 명시적 신호: `<promise>COMPLETE</promise>` 또는 `<promise>FAILED</promise>`
2. 패턴 매칭: 에러 키워드 검사
3. Exit 코드: 0=성공, 그 외=실패

**재시도 메커니즘**
- 실패 시 설정된 횟수만큼 자동 재시도
- 각 단계에서 Discord로 알림 전송

### 암호화 (config.js)

**보안**
- AES-256-GCM 알고리즘 사용
- 머신별 고유 키 생성 (hostname + username + platform)
- 저장 형식: `iv:authTag:encrypted`

**암호화 대상**
- botToken
- clientId
- userId

### 다국어 지원 (i18n.js)

**지원 언어**
ko, en, zh, es, hi, ar, pt, ru, ja, fr, de (11개)

**언어 감지**
- Windows: PowerShell로 UI 문화권 확인
- macOS: defaults read로 AppleLocale 확인
- Linux: LANG 환경 변수

## 설정 항목

| 항목 | 설명 | 기본값 |
|------|------|--------|
| botToken | Discord 봇 토큰 | - |
| clientId | 애플리케이션 Client ID | - |
| userId | 인가된 사용자 ID | - |
| debugMode | 디버그 모드 | false |
| claudeCommand | Claude CLI 경로 | 자동 감지 |
| logRetentionDays | 로그 보관 일수 | 7 |
| defaultMaxRetries | 기본 재시도 횟수 | 15 |
| parallelExecution | 병렬 실행 활성화 | false |
| maxParallel | 최대 동시 작업 수 | 1 |
| taskTimeout | 작업 시간 제한 (ms) | 1800000 |

## cc-telegram과의 차이점

| 기능 | cc-telegram | cc-discord |
|------|-------------|------------|
| 메시지 길이 | 4096자 | 2000자 (Embed: 4096) |
| 명령어 | 텍스트 파싱 | 슬래시 커맨드 |
| 버튼 | inline_keyboard | ButtonBuilder |
| 다단계 입력 | userStates Map | Modal |
| 파일 업로드 | 50MB | 10MB |
| 메시지 수신 | Long Polling | WebSocket |
