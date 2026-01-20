# Discord Bot Skill

## 목적
Discord 봇 슬래시 커맨드, 버튼, 모달 구현을 담당하는 스킬

## 적용 시점
- 봇 슬래시 커맨드를 추가하거나 수정할 때
- 메시지 처리 로직을 개발할 때
- 인터랙션 컴포넌트 (버튼, 셀렉트, 모달)를 구현할 때

## 구현 원칙

### 슬래시 커맨드
- SlashCommandBuilder로 커맨드 정의
- DM에서 작동하려면 setDMPermission(true) 필수
- execute 함수에서 interaction 처리

### 버튼 처리
- customId 형식: `action:param1:param2`
- ButtonStyle: Primary, Secondary, Success, Danger
- interactionCreate 이벤트에서 isButton() 체크

### 셀렉트 메뉴
- StringSelectMenuBuilder 사용
- 옵션 최대 25개
- isStringSelectMenu()로 체크

### 모달
- ModalBuilder로 생성
- TextInputBuilder로 입력 필드 추가
- TextInputStyle: Short (1줄), Paragraph (여러 줄)
- isModalSubmit()로 체크, fields.getTextInputValue()로 값 획득

### 메시지 제한
- 일반 메시지: 2000자
- Embed description: 4096자
- Embed field value: 1024자
- 긴 메시지는 분할 전송 필요

## 참고 파일
- src/discord/client.js
- src/discord/commands/*.js
- src/discord/deploy-commands.js
