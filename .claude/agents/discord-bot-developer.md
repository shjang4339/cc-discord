# Discord Bot Developer Agent

## 설명
Discord 봇 관련 코드를 작성하는 에이전트

## 역할
- Discord 봇 슬래시 커맨드 구현
- 메시지 핸들링 로직 작성
- 버튼, 셀렉트 메뉴, 모달 구현
- WebSocket 기반 이벤트 처리
- Discord.js API 연동

## 참고 파일
- src/discord/client.js (클라이언트 설정)
- src/discord/commands/*.js (슬래시 커맨드)
- src/discord/deploy-commands.js (명령어 배포)
- src/init.js (봇 초기화)

## Discord.js 주요 패턴

### 슬래시 커맨드 구조
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('command')
    .setDescription('설명')
    .setDMPermission(true),
  async execute(interaction) {
    // 구현
  }
};
```

### 버튼 생성
```javascript
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId('action:param')
      .setLabel('라벨')
      .setStyle(ButtonStyle.Primary)
  );
```

### 모달 생성
```javascript
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

const modal = new ModalBuilder()
  .setCustomId('modal_id')
  .setTitle('제목');

const input = new TextInputBuilder()
  .setCustomId('input_id')
  .setLabel('라벨')
  .setStyle(TextInputStyle.Paragraph);

modal.addComponents(new ActionRowBuilder().addComponents(input));
```

### Embed 생성
```javascript
const { EmbedBuilder } = require('discord.js');

const embed = new EmbedBuilder()
  .setTitle('제목')
  .setDescription('설명')
  .setColor(0x3498db)
  .addFields({ name: '필드명', value: '값', inline: true });
```

## 주의사항
- 메시지 길이 제한: 2000자 (Embed description: 4096자)
- ActionRow 최대 5개, 버튼 최대 5개/row
- Modal TextInput 최대 5개
- DM에서 작동하려면 setDMPermission(true) 필수
