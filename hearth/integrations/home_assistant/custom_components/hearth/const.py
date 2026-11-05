"""Constants for the local Hearth bridge v1."""

DOMAIN = "hearth"
CONF_URL = "url"
CONF_AUTOMATION_KEY = "automation_key"
CONF_ALLOW_LOOPBACK_HTTP = "allow_loopback_http"
POLL_SECONDS = 10
REQUEST_TIMEOUT_SECONDS = 8
COMMAND_TIMEOUT_SECONDS = 35
ACK_POLL_SECONDS = 1
MODULE_LABELS = {
    "calendar": "Calendar",
    "weather": "Weather",
    "reminders": "Reminders",
    "chores": "Chores and pocket money",
    "lists": "Lists",
    "meals": "Meals",
    "home": "Home controls",
    "photos": "Photos",
    "games": "Games",
    "notices": "Notices",
    "dailyVerse": "Daily Bible verse",
    "nba": "NBA",
    "morningRoutine": "Morning Routine",
    "fitness": "Fitness",
    "afternoonRoutine": "Afternoon Routine",
}
LEGACY_MODULE_IDS = tuple(key for key in MODULE_LABELS if key not in ("nba", "morningRoutine", "fitness", "afternoonRoutine"))
TAB_MODULES = {
    "morning_routine": "morningRoutine",
    "calendar": "calendar",
    "calendar_week": "calendar",
    "calendar_month": "calendar",
    **{
        key: key
        for key in (
            "weather",
            "reminders",
            "chores",
            "lists",
            "meals",
            "home",
            "photos",
            "games",
        )
    },
}
MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_CALENDAR_DAYS = 31
MAX_CALENDAR_CHUNKS = 24
MAX_CALENDAR_EVENTS = 10000

# Wire IDs, in the order of packages/shared/src/home-assistant-bridge.ts.
# Labels are presentation only; requests and observed state always use these IDs.
TAB_LABELS = {
    "today": "Today",
    "morning_routine": "Morning Routine",
    "calendar": "Agenda",
    "calendar_week": "Week",
    "calendar_month": "Month",
    "weather": "Weather",
    "reminders": "Reminders",
    "chores": "Chores",
    "lists": "Lists",
    "meals": "Meals",
    "home": "Home",
    "photos": "Photos",
    "games": "Games",
    "more": "More",
}
