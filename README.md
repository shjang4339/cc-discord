# cc-discord

Remote Claude Code execution via Discord - A Discord bot version of [cc-telegram](https://github.com/hada0127/cc-telegram)

Control Claude Code tasks from your phone or any device with Discord!

## Features

- **Remote Task Execution**: Create and manage Claude Code tasks via Discord DM
- **Parallel Processing**: Run multiple tasks simultaneously (configurable)
- **Priority System**: Urgent (🔴), High (🟠), Normal (🟢), Low (🔵)
- **Auto Retry**: Automatic retry on failure with configurable max attempts
- **Real-time Monitoring**: Check task status and recent output
- **Secure**: Encrypted token storage, single-user authorization

## Installation

```bash
# Global install
npm install -g cc-discord

# Or use npx
npx cc-discord
```

## Quick Start

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section → "Add Bot"
4. Copy the **Bot Token** (you'll need this)
5. Enable **Message Content Intent** under Privileged Gateway Intents

### 2. Generate Bot Invite URL

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Send Messages
   - Embed Links
   - Attach Files
   - Use Slash Commands
4. Copy the generated URL and open it to invite the bot

### 3. Run Setup

```bash
cc-discord
```

On first run, you'll be guided through setup:
- Enter your Bot Token
- Enter your Application (Client) ID

### 4. Deploy Commands

```bash
cc-discord --deploy
# or
npm run deploy
```

### 5. Start the Bot

```bash
cc-discord
```

### 6. Register Your User

Send `/start` to your bot via Discord DM to register your user ID.

## Discord Commands

| Command | Description |
|---------|-------------|
| `/new` | Create a new task |
| `/list` | Show pending tasks |
| `/status` | Show running tasks with recent output |
| `/completed` | Show completed tasks |
| `/failed` | Show failed tasks (with retry option) |
| `/cancel` | Cancel a pending/running task |
| `/debug` | Show system information |
| `/reset` | Reset all data |

## Task Types

### Simple Task
- Single execution
- No completion criteria
- Best for quick, one-off tasks

### Complex Task
- Includes completion criteria
- Auto-retry on failure
- Uses plan mode for better results
- Best for multi-step tasks

## Configuration

Configuration is stored in `.cc-discord/config.json` (encrypted).

| Option | Description | Default |
|--------|-------------|---------|
| `botToken` | Discord bot token | - |
| `clientId` | Application client ID | - |
| `userId` | Authorized user ID | - |
| `defaultMaxRetries` | Default retry count | 15 |
| `parallelExecution` | Enable parallel tasks | false |
| `maxParallel` | Max concurrent tasks | 1 |
| `taskTimeout` | Task timeout (ms) | 1800000 |

## CLI Options

```bash
cc-discord              # Start the bot
cc-discord --setup      # Run setup wizard
cc-discord --deploy     # Deploy slash commands
cc-discord --version    # Show version
cc-discord --help       # Show help
```

## Requirements

- Node.js 18.0.0 or higher
- Claude Code CLI installed and configured

## Project Structure

```
cc-discord/
├── src/
│   ├── discord/
│   │   ├── client.js         # Discord client setup
│   │   ├── deploy-commands.js # Command deployment
│   │   └── commands/         # Slash command handlers
│   ├── config.js             # Configuration management
│   ├── tasks.js              # Task queue management
│   ├── executor.js           # Claude Code execution
│   ├── i18n.js               # Internationalization
│   ├── init.js               # Setup wizard
│   ├── cli.js                # CLI entry point
│   └── index.js              # Public API
├── package.json
└── README.md
```

## Differences from cc-telegram

| Feature | cc-telegram | cc-discord |
|---------|-------------|------------|
| Message limit | 4096 chars | 2000 chars (Embed: 4096) |
| Commands | Text-based | Slash commands |
| Buttons | Inline keyboard | Discord buttons |
| Multi-step input | State machine | Modals |
| File upload limit | 50MB | 10MB |

## Security

- Bot token and user ID are encrypted with AES-256-GCM
- Only registered user can interact with the bot
- All data stored locally

## License

MIT

## Credits

Based on [cc-telegram](https://github.com/hada0127/cc-telegram) by hada0127

## Links

- [GitHub Repository](https://github.com/shjang4339/cc-discord)
- [Original cc-telegram](https://github.com/hada0127/cc-telegram)
- [Discord.js Documentation](https://discord.js.org/)
