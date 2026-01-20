# Claude Executor Skill

## 목적
Claude Code 실행 및 반복 처리를 담당하는 스킬

## 적용 시점
- 작업 실행 로직 개발
- 결과 분석 로직 수정

## 구현 원칙

### 프로세스 실행
- spawn 방식으로 Claude 프로세스 시작
- Windows: shell: true 옵션 필요
- 환경 변수: FORCE_COLOR=0 (ANSI 코드 제거)

### 결과 판정 (우선순위)
1. **명시적 신호**: `<promise>COMPLETE</promise>` 또는 `<promise>FAILED</promise>`
2. **패턴 매칭**: 에러 키워드 검사 (error:, failed:, exception:, fatal:)
3. **Exit 코드**: 0=성공, 그 외=실패

### 재시도 메커니즘
- incrementRetry()로 재시도 횟수 증가
- canRetry 여부에 따라 상태 전이 (ready 또는 failed)
- 각 단계에서 Discord로 알림 전송

### 타임아웃
- 기본 30분 (설정 가능)
- clearTimeout/setTimeout 사용
- 타임아웃 시 프로세스 강제 종료

### 프로세스 종료
- Unix: proc.kill('SIGTERM')
- Windows: taskkill /pid PID /f /t (프로세스 트리 전체)

## 참고 파일
- src/executor.js
