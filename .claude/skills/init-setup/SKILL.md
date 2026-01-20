# Init Setup Skill

## 목적
최초 실행 시 환경 초기화를 담당하는 스킬

## 적용 시점
- 초기화 로직 수정 시
- 설정 플로우 변경 시

## 구현 원칙

### 폴더 구조 생성
```
.cc-discord/
├── config.json
├── tasks.json
├── completed.json
├── failed.json
├── tasks/
├── completed/
├── failed/
└── logs/
```

### 설정 마법사 흐름
1. 봇 토큰 입력 및 검증
2. Client ID 입력 및 검증
3. 재시도 횟수 설정
4. 병렬 실행 여부 설정
5. 설정 저장

### Discord 봇 토큰 검증
- 50자 이상
- 점(.)을 포함해야 함

### Discord ID 검증
- 17~19자리 숫자

### 사용자 ID 등록
- 봇에게 /start DM 전송
- messageCreate 이벤트에서 감지
- config에 userId 저장

### .gitignore 업데이트
- .cc-discord/ 폴더 제외

## 참고 파일
- src/init.js
- src/cli.js
