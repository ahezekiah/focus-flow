# Claude Code Statusline Setup

A statusline for Claude Code that shows the current model + thinking effort, plus usage bars for the 5-hour and 7-day rate-limit windows (with reset times).

Looks like: `Fable ✻ high | 5h ████░░ 42% ◷ ██░░░░ 1h 20m | wk ██░░░░ 18% ◷ ███░░░ Sat 5pm`

Two versions of the script are provided below: a bash version for macOS/Linux, and a PowerShell version for Windows.

## Windows (PowerShell)

No extra requirements — uses only built-in PowerShell/.NET, no `jq` needed. Tested on Windows PowerShell 5.1.

### 1. Save the script to `~/.claude/statusline.ps1`

```powershell

# ~/.claude/statusline.ps1

# Claude Code status line: model + thinking effort, then for each rate-limit

# window (5h / 7d): a usage bar and a time-through-window bar with reset time.

# Receives Claude Code status JSON on stdin. PowerShell port of statusline.sh.

$ErrorActionPreference = 'SilentlyContinue'

$inputText = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($inputText)) { exit 0 }

try {

    $data = $inputText | ConvertFrom-Json

} catch {

    exit 0

}

$ESC = [char]27

$RESET = "$ESC[0m"; $DIM = "$ESC[2m"; $CYAN = "$ESC[36m"

$GREEN = "$ESC[32m"; $YELLOW = "$ESC[33m"; $RED = "$ESC[31m"; $BLUE = "$ESC[34m"

# Scale bars to terminal width. ~64 cols of the line are labels/percentages/

# reset times; the rest is split across the 4 bars. Falls back to 18 when

# width is unavailable.

$cols = 0

try { $cols = $Host.UI.RawUI.WindowSize.Width } catch {}

if ($cols -gt 0) {

    $barWidth = [Math]::Floor(($cols - 64) / 4)

    if ($barWidth -lt 8) { $barWidth = 8 }

    if ($barWidth -gt 40) { $barWidth = 40 }

} else {

    $barWidth = 18

}

$FIVE_HOUR_WINDOW = 5 * 3600

$SEVEN_DAY_WINDOW = 7 * 86400

function Get-Bar {

    param([double]$Pct, [string]$Color)

    if ($Pct -lt 0) { $Pct = 0 }

    if ($Pct -gt 100) { $Pct = 100 }

    $filled = [Math]::Floor((($Pct * $barWidth) + 50) / 100)

    $s = ([string][char]0x2588 * $filled) + ([string][char]0x2591 * ($barWidth - $filled))

    return "$Color$s$RESET"

}

function Get-UsageColor {

    param([double]$Pct)

    if ($Pct -ge 80) { return $RED }

    elseif ($Pct -ge 50) { return $YELLOW }

    else { return $GREEN }

}

# Format a unix epoch into a human-friendly reset string:

# under 24h away -> "2h 10m" / "45m"; otherwise -> "Sat 5pm"; elapsed -> "soon"

function Format-Reset {

    param([long]$ResetsAt)

    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

    $diff = $ResetsAt - $now

    if ($diff -le 0) { return "soon" }

    if ($diff -lt 86400) {

        $hours = [Math]::Floor($diff / 3600)

        $mins = [Math]::Floor(($diff % 3600) / 60)

        if ($hours -gt 0) { return "${hours}h ${mins}m" } else { return "${mins}m" }

    }

    $dt = [DateTimeOffset]::FromUnixTimeSeconds($ResetsAt).ToLocalTime()

    $culture = [System.Globalization.CultureInfo]::InvariantCulture

    $day = $dt.ToString("ddd", $culture)

    $hour = $dt.ToString("%h", $culture)

    $ampm = $dt.ToString("tt", $culture).ToLower()

    return "$day $hour$ampm"

}

function Get-LimitSegment {

    param([string]$Label, $Pct, $Resets, [long]$Window)

    if ($null -eq $Pct -or "$Pct" -eq '') { return $null }

    $pctInt = [Math]::Round([double]$Pct)

    $color = Get-UsageColor $pctInt

    $seg = "$Label $(Get-Bar -Pct $pctInt -Color $color) $pctInt%"

    if ($Resets -and ("$Resets" -match '^\d+(\.\d+)?$')) {

        $resetsLong = [long][double]"$Resets"

        $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

        $remaining = $resetsLong - $now

        if ($remaining -lt 0) { $remaining = 0 }

        if ($remaining -gt $Window) { $remaining = $Window }

        $elapsedPct = [Math]::Floor((($Window - $remaining) * 100) / $Window)

        $seg += " $DIM$([char]0x25F7)$RESET $(Get-Bar -Pct $elapsedPct -Color $BLUE) $DIM$(Format-Reset $resetsLong)$RESET"

    }

    return $seg

}

$modelName = $data.model.display_name

$effort = $data.effort.level

$thinkOff = ($data.thinking.enabled -eq $false)

$parts = @()

if ($modelName) {

    $m = "$CYAN$modelName$RESET"

    if ($thinkOff) {

        $m += " $DIM$([char]0x273B) off$RESET"

    } elseif ($effort) {

        $m += " $DIM$([char]0x273B) $effort$RESET"

    }

    $parts += $m

}

$seg = Get-LimitSegment -Label "5h" -Pct $data.rate_limits.five_hour.used_percentage -Resets $data.rate_limits.five_hour.resets_at -Window $FIVE_HOUR_WINDOW

if ($seg) { $parts += $seg }

$seg = Get-LimitSegment -Label "wk" -Pct $data.rate_limits.seven_day.used_percentage -Resets $data.rate_limits.seven_day.resets_at -Window $SEVEN_DAY_WINDOW

if ($seg) { $parts += $seg }

if ($parts.Count -eq 0) { exit 0 }

$out = ($parts -join " $DIM|$RESET ")

Write-Output $out

```

### 2. Wire it up in `~/.claude/settings.json`

Add this key (merge with whatever's already in the file):

```json

{

  "statusLine": {

    "type": "command",

    "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\\Users\\<you>\\.claude\\statusline.ps1\""

  }

}

```

Use your actual home directory path (or resolve it with `$HOME` when editing by hand) — Claude Code does not expand `~` when it spawns the statusline command on Windows.

Restart Claude Code (or start a new session) and the statusline should appear at the bottom.

## macOS / Linux (bash)

## Requirements

- `jq` (`brew install jq`)

- macOS (the reset-time formatting uses `date -r`; on Linux change line 72 to `date -d "@$resets_at" "+%a %-I%p"`)

## Install

### 1. Save the script to `~/.claude/statusline.sh`

```bash

#!/usr/bin/env bash

# ~/.claude/statusline.sh

# Claude Code status line: model + thinking effort, then for each rate-limit

# window (5h / 7d): a usage bar and a time-through-window bar with reset time.

# Receives Claude Code status JSON on stdin.

input=$(cat 2>/dev/null) || input=""

[ -z "$input" ] && exit 0

command -v jq &>/dev/null || exit 0

ESC=$'\033'

RESET="${ESC}[0m"; DIM="${ESC}[2m"; CYAN="${ESC}[36m"

GREEN="${ESC}[32m"; YELLOW="${ESC}[33m"; RED="${ESC}[31m"; BLUE="${ESC}[34m"

# Scale bars to terminal width (Claude Code exports COLUMNS to the statusline).

# ~64 cols of the line are labels/percentages/reset times; the rest is split

# across the 4 bars. Falls back to 18 when COLUMNS is unavailable.

if [[ "${COLUMNS:-}" =~ ^[0-9]+$ ]] && (( COLUMNS > 0 )); then

  BAR_W=$(( (COLUMNS - 64) / 4 ))

  (( BAR_W < 8 )) && BAR_W=8

  (( BAR_W > 40 )) && BAR_W=40

else

  BAR_W=18

fi

FIVE_HOUR_WINDOW=$((5 * 3600))

SEVEN_DAY_WINDOW=$((7 * 86400))

vals=$(jq -r '[

  (.model.display_name // ""),

  (.effort.level // ""),

  ((.thinking.enabled == false) | tostring),

  ((.rate_limits.five_hour.used_percentage // "") | tostring),

  ((.rate_limits.five_hour.resets_at // "") | tostring),

  ((.rate_limits.seven_day.used_percentage // "") | tostring),

  ((.rate_limits.seven_day.resets_at // "") | tostring)

] | join("\u001f")' <<<"$input" 2>/dev/null) || exit 0

IFS=$'\x1f' read -r model effort think_off five_pct five_reset week_pct week_reset <<<"$vals"

# ── helpers ──────────────────────────────────────────────────────────────────

bar() {  # bar <int-percent> <color>

  local pct=$1 color=$2 s="" i filled

  (( pct < 0 )) && pct=0

  (( pct > 100 )) && pct=100

  filled=$(( (pct * BAR_W + 50) / 100 ))

  for (( i = 0; i < BAR_W; i++ )); do

    if (( i < filled )); then s+="█"; else s+="░"; fi

  done

  printf '%s%s%s' "$color" "$s" "$RESET"

}

usage_color() {  # green <50, yellow 50-79, red 80+

  local pct=$1

  if (( pct >= 80 )); then printf '%s' "$RED"

  elif (( pct >= 50 )); then printf '%s' "$YELLOW"

  else printf '%s' "$GREEN"; fi

}

# Format a unix epoch into a human-friendly reset string:

# under 24h away -> "2h 10m" / "45m"; otherwise -> "Sat 5pm"; elapsed -> "soon"

format_reset() {

  local resets_at=$1 now diff hours mins

  now=$(date +%s)

  diff=$(( resets_at - now ))

  if (( diff <= 0 )); then

    echo "soon"

  elif (( diff < 86400 )); then

    hours=$(( diff / 3600 ))

    mins=$(( (diff % 3600) / 60 ))

    if (( hours > 0 )); then echo "${hours}h ${mins}m"; else echo "${mins}m"; fi

  else

    date -r "$resets_at" "+%a %-I%p" 2>/dev/null | sed 's/AM/am/;s/PM/pm/'

  fi

}

limit_segment() {  # limit_segment <label> <pct> <resets_at> <window-seconds>

  local label=$1 pct=$2 resets=$3 window=$4

  [ -z "$pct" ] && return

  local pct_int

  pct_int=$(printf '%.0f' "$pct" 2>/dev/null) || return

  local seg="${label} $(bar "$pct_int" "$(usage_color "$pct_int")") ${pct_int}%"

  resets="${resets%%.*}"

  if [[ "$resets" =~ ^[0-9]+$ ]]; then

    local now remaining elapsed_pct

    now=$(date +%s)

    remaining=$(( resets - now ))

    (( remaining < 0 )) && remaining=0

    (( remaining > window )) && remaining=$window

    elapsed_pct=$(( (window - remaining) * 100 / window ))

    seg+=" ${DIM}◷${RESET} $(bar "$elapsed_pct" "$BLUE") ${DIM}$(format_reset "$resets")${RESET}"

  fi

  printf '%s' "$seg"

}

# ── build output ──────────────────────────────────────────────────────────────

parts=()

if [ -n "$model" ]; then

  m="${CYAN}${model}${RESET}"

  if [ "$think_off" = "true" ]; then

    m+=" ${DIM}✻ off${RESET}"

  elif [ -n "$effort" ]; then

    m+=" ${DIM}✻ ${effort}${RESET}"

  fi

  parts+=("$m")

fi

seg=$(limit_segment "5h" "$five_pct" "$five_reset" "$FIVE_HOUR_WINDOW")

[ -n "$seg" ] && parts+=("$seg")

seg=$(limit_segment "wk" "$week_pct" "$week_reset" "$SEVEN_DAY_WINDOW")

[ -n "$seg" ] && parts+=("$seg")

[ ${#parts[@]} -eq 0 ] && exit 0

out=""

for p in "${parts[@]}"; do

  [ -n "$out" ] && out+=" ${DIM}|${RESET} "

  out+="$p"

done

printf '%s\n' "$out"

```

### 2. Make it executable

```bash

chmod +x ~/.claude/statusline.sh

```

### 3. Wire it up in `~/.claude/settings.json`

Add this key (merge with whatever's already in the file):

```json

{

  "statusLine": {

    "type": "command",

    "command": "bash ~/.claude/statusline.sh"

  }

}

```

Restart Claude Code (or start a new session) and the statusline should appear at the bottom.

## What the bars mean

Each rate-limit window gets two bars:

- **Colored bar** — how much of the limit you've used (green < 50%, yellow 50–79%, red 80%+)

- **Blue bar after the ◷** — how far through the time window you are, with the reset time at the end ("2h 10m" if under a day away, "Sat 5pm" otherwise)

If usage is filling up faster than the blue time bar, you're on pace to hit the limit before it resets.
 