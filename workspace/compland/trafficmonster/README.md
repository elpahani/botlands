# TrafficMonster — Multi-Channel Telegram Publisher

## File Structure

```
trafficmonster/
├── channels/
│   └── @channelname/
│       ├── posts/          # Posts waiting to send
│       └── sent/           # Sent posts archive
├── queue/
│   ├── active/            # Currently processing
│   ├── scheduled/         # Scheduled for later
│   ├── failed/            # Failed to send
│   └── archive/           # Old sent posts
├── templates/
│   ├── posts/             # Post templates
│   └── media/             # Images, videos
├── scripts/
│   └── poster.py          # Main publisher script
├── config/
│   └── channels.json      # Channel configs
└── logs/
    └── YYYY-MM-DD.log     # Daily logs
```

## Post Format

```markdown
TYPE: text
CHANNEL: @araspins
BUTTON: 🎰 Получить бонус | https://bc.game/i-4e0l2svvq-n/

🎰 **BC.Game — Best Crypto Casino**

⭐ Rating: 4.8/5
💰 Bonus: 360%

Content here...
```

## Commands

```bash
# Send all posts for @araspins
python3 scripts/poster.py @araspins

# Dry run (test without sending)
python3 scripts/poster.py @araspins --dry-run
```

## Scheduling via Workland

Create tasks with:
- time: 10:00, 14:00, 20:00
- programId: trafficmonster-poster
- Auto-execution enabled
