# Claude 설정

## 응답 스타일
- 반말로 응답한다 (할게, 했어, 할까? 등)

## 작업 규칙
- 모든 작업 완료 후 .claude 폴더 내의 적절한 파일에 작업 내용을 반영한다
- **작업 완료 시 VERSION_HISTORY.md 업데이트**:
  - `git log --oneline -10` 으로 최근 커밋 확인
  - VERSION_HISTORY.md에 최근 10개 커밋 반영
- **작업 완료 시 반드시 커밋 및 푸시**:
  1. `git add -A`
  2. 변경 내용에 맞는 커밋 메시지 생성 (feat/fix/docs/test/chore)
  3. `git commit -m "타입: 설명"`
  4. `git push origin HEAD`

## 프로젝트 개요
- Discord를 통해 클로드 코드를 원격 제어하는 프로그램
- cc-telegram의 Discord 버전
- npx cc-discord 또는 npm start로 실행

## 에이전트 (Task tool로 호출)
| 에이전트 | 용도 |
|----------|------|
| discord-bot-developer | Discord 봇 코드 작성 |
| claude-code-executor | 클로드 코드 실행 로직 |
| task-management-architect | 작업 관리 시스템 설계 |

## 스킬 (자동 적용)
Claude가 작업 내용에 따라 자동으로 적용하는 스킬들:

| 스킬 | 용도 |
|------|------|
| npm-package-init | npx 실행 가능한 패키지 구조 초기화 |
| discord-bot | Discord 봇 슬래시 커맨드/버튼/모달 구현 |
| claude-executor | 클로드 코드 실행 및 반복 처리 |
| task-manager | 작업 생성/상태관리/조회 |
| encryption | 봇 토큰 암호화 |
| init-setup | 최초 실행 시 환경 초기화 |

## 문서
| 문서 | 설명 |
|------|------|
| [features.md](docs/features.md) | 구현된 기능 상세 |
| [structure.md](docs/structure.md) | 프로젝트 폴더 구조 |

## 작업 시 참고 파일
- .claude/skills/*/SKILL.md: 각 스킬 상세 정의

## cc-telegram과의 주요 차이점
| 항목 | cc-telegram | cc-discord |
|------|-------------|------------|
| 메시지 수신 | Long Polling | WebSocket (자동) |
| 명령어 방식 | 텍스트 기반 (/command) | 슬래시 커맨드 (자동완성) |
| 버튼 | inline_keyboard | ButtonBuilder |
| 다단계 입력 | 상태 머신 (userStates) | Modal |
| 메시지 제한 | 4096자 | 2000자 (Embed: 4096자) |
| 파일 업로드 | 50MB | 10MB |

## 최근 개선 사항

### 2026-01-20
- cc-telegram 기반으로 cc-discord 초기 구현
- Discord.js v14 기반 슬래시 커맨드 구현
- Modal 기반 작업 생성 플로우
- 버튼을 통한 작업 취소/재시도
- Embed를 활용한 풍부한 작업 정보 표시
