"""Bounded, credential-safe bridge client and pure v1/date validation helpers.

The injected session is aiohttp in HA; a tiny fake session suffices for offline
stdlib tests. This module deliberately has no Home Assistant dependency.
"""

from __future__ import annotations

import asyncio
import ipaddress
import json
import re
import ssl
from collections.abc import Callable, Iterator
from datetime import UTC, date, datetime, time, timedelta, tzinfo
from typing import TYPE_CHECKING, Any, NoReturn
from urllib.parse import urlsplit, urlunsplit
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .const import (
    ACK_POLL_SECONDS,
    COMMAND_TIMEOUT_SECONDS,
    MAX_BODY_BYTES,
    MAX_CALENDAR_CHUNKS,
    MAX_CALENDAR_DAYS,
    MAX_CALENDAR_EVENTS,
    MODULE_LABELS,
    LEGACY_MODULE_IDS,
    REQUEST_TIMEOUT_SECONDS,
    TAB_LABELS,
)

if TYPE_CHECKING:
    from aiohttp import ClientSession

JsonObject = dict[str, Any]
_ID = re.compile(r"[a-z][a-z0-9_-]{2,95}\Z")
_KEY = re.compile(r"ha_[A-Za-z0-9_-]{43}\Z")
_DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}\Z")
_INSTANT = re.compile(
    r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
    r"(?::[0-9]{2}(?:\.[0-9]+)?)?(?:Z|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])\Z"
)
_COMMAND_STATUSES = {"pending", "applied", "expired", "superseded", "cancelled"}
_CHORE_STATES = {"pending", "completed", "skipped", "excused", "cancelled"}


class HearthError(Exception):
    """Safe error: messages never contain response bodies, URLs or credentials."""


class HearthAuthError(HearthError):
    """A 401 requires reauthentication."""


class HearthConnectionError(HearthError):
    """The bridge could not be reached safely."""


class HearthTransportError(HearthConnectionError):
    """A timeout/socket failure permits one exact idempotent command retry."""


class HearthProtocolError(HearthError):
    """Unexpected HTTP or invalid/bounded v1 data."""


class HearthCommandError(HearthError):
    """Navigation was not acknowledged by the visible paired screen."""


def _invalid() -> NoReturn:
    raise HearthProtocolError("Invalid Hearth bridge v1 response") from None


def _object(value: Any, fields: set[str]) -> JsonObject:
    if not isinstance(value, dict) or not fields <= value.keys():
        _invalid()
    return value


def _string(value: Any, maximum: int | None = None) -> str:
    if not isinstance(value, str) or (maximum is not None and len(value) > maximum):
        _invalid()
    return value


def _identifier(value: Any) -> str:
    if not isinstance(value, str) or not _ID.fullmatch(value):
        _invalid()
    return value


def _boolean(value: Any) -> bool:
    if type(value) is not bool:
        _invalid()
    return value


def _count(value: Any) -> int:
    if type(value) is not int or value < 0:
        _invalid()
    return value


def _enum(value: Any, choices: Any) -> str:
    if not isinstance(value, str) or value not in choices:
        _invalid()
    return value


def _array(value: Any, maximum: int) -> list[Any]:
    if not isinstance(value, list) or len(value) > maximum:
        _invalid()
    return value


def parse_date(value: Any) -> date:
    """Read a real wire date without inventing a time or changing its end."""
    try:
        if not isinstance(value, str) or not _DATE.fullmatch(value):
            _invalid()
        return date.fromisoformat(value)
    except ValueError:
        _invalid()


def parse_instant(value: Any) -> datetime:
    """Read an ISO instant, retaining its supplied UTC offset."""
    try:
        if not isinstance(value, str) or not _INSTANT.fullmatch(value):
            _invalid()
        result = datetime.fromisoformat(value)
        if result.utcoffset() is None:
            _invalid()
        return result
    except ValueError:
        _invalid()


def _timestamp(value: Any) -> str:
    parse_instant(value)
    return value


def normalize_url(value: str, *, allow_loopback_http: bool = False) -> str:
    """Accept only an origin, HTTPS by default; no URL credentials or paths.

    HTTP requires explicit consent AND a literal loopback IP. No DNS-based
    localhost exception can send an unencrypted key to a different machine.
    """
    try:
        if not isinstance(value, str) or any(
            ord(c) <= 32 or ord(c) == 127 for c in value
        ):
            raise ValueError
        parsed = urlsplit(value)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
            or "\\" in value
            or "%" in parsed.netloc
            or (parsed.port is not None and not 1 <= parsed.port <= 65535)
        ):
            raise ValueError
        if parsed.scheme == "http" and not (
            allow_loopback_http and ipaddress.ip_address(parsed.hostname).is_loopback
        ):
            raise ValueError
        return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))
    except (ValueError, TypeError):
        raise HearthProtocolError("Use a trusted HTTPS Hearth origin") from None


def validate_key(value: Any) -> str:
    if not isinstance(value, str) or not _KEY.fullmatch(value):
        raise HearthAuthError("Invalid Hearth automation key") from None
    return value


def validate_command(value: Any) -> JsonObject:
    item = _object(value, {"id", "tab", "status", "createdAt", "expiresAt"})
    result = {
        "id": _identifier(item["id"]),
        "tab": _enum(item["tab"], TAB_LABELS),
        "status": _enum(item["status"], _COMMAND_STATUSES),
        "createdAt": _timestamp(item["createdAt"]),
        "expiresAt": _timestamp(item["expiresAt"]),
    }
    if parse_instant(result["expiresAt"]) <= parse_instant(result["createdAt"]):
        _invalid()
    return result


def validate_event(value: Any) -> JsonObject:
    item = _object(
        value,
        {"id", "title", "start", "end", "startLocalDate", "endLocalDate", "allDay"},
    )
    result = {
        "id": _identifier(item["id"]),
        "title": _string(item["title"], 160),
        "start": _timestamp(item["start"]),
        "end": _timestamp(item["end"]),
        "startLocalDate": parse_date(item["startLocalDate"]).isoformat(),
        "endLocalDate": parse_date(item["endLocalDate"]).isoformat(),
        "allDay": _boolean(item["allDay"]),
    }
    if parse_instant(result["end"]) <= parse_instant(result["start"]):
        _invalid()
    if result["allDay"] and result["endLocalDate"] <= result["startLocalDate"]:
        _invalid()
    return result


def validate_calendar(value: Any) -> JsonObject:
    item = _object(value, {"freshness", "events"})
    # v1 returns an explicit HTTP error on overflow, never a partial result.
    if item.get("truncated", False) is not False:
        raise HearthProtocolError("Incomplete Hearth calendar response") from None
    return {
        "freshness": _enum(item["freshness"], {"current", "stale", "offline"}),
        "events": [validate_event(event) for event in _array(item["events"], 2000)],
    }


def validate_state(value: Any) -> JsonObject:
    """Validate v1 and project only allowlisted fields into HA memory."""
    item = _object(
        value,
        {
            "version",
            "generatedAt",
            "household",
            "permissions",
            "screens",
            "chores",
            "calendar",
        },
    )
    if type(item["version"]) is not int or item["version"] != 1:
        _invalid()
    household = _object(item["household"], {"id", "name", "timezone"})
    zone = _string(household["timezone"], 80)
    try:
        ZoneInfo(zone)
    except (ZoneInfoNotFoundError, ValueError):
        _invalid()
    permissions = _object(item["permissions"], {"shareChores", "shareCalendar"})
    control_chores = _boolean(permissions.get("controlChores", False))
    if control_chores and not permissions["shareChores"]:
        _invalid()
    result: JsonObject = {
        "version": 1,
        "generatedAt": _timestamp(item["generatedAt"]),
        "household": {
            "id": _identifier(household["id"]),
            "name": _string(household["name"]),
            "timezone": zone,
        },
        "permissions": {
            name: _boolean(permissions[name])
            for name in ("shareChores", "shareCalendar")
        },
        "screens": [],
        "chores": None,
        "calendar": None,
    }
    result["permissions"]["controlChores"] = control_chores
    result["permissions"]["controlModules"] = _boolean(
        permissions.get("controlModules", False)
    )
    if result["permissions"]["controlModules"] and "modules" not in item:
        _invalid()
    module_ids = [
        _enum(name, MODULE_LABELS)
        for name in _array(permissions.get("moduleIds", list(LEGACY_MODULE_IDS)), 15)
    ]
    if len(set(module_ids)) != len(module_ids):
        _invalid()
    result["permissions"]["moduleIds"] = module_ids
    modules = item.get("modules", dict.fromkeys(LEGACY_MODULE_IDS, True))
    modules = {**_object(modules, set(LEGACY_MODULE_IDS)), "nba": modules.get("nba", False), "morningRoutine": modules.get("morningRoutine", False), "fitness": modules.get("fitness", False), "afternoonRoutine": modules.get("afternoonRoutine", False)}
    result["modules"] = {name: _boolean(modules[name]) for name in MODULE_LABELS}
    seen: set[str] = set()
    for screen in _array(item["screens"], 20):
        screen = _object(
            screen, {"id", "name", "online", "currentTab", "lastSeenAt", "command"}
        )
        screen_id = _identifier(screen["id"])
        if screen_id in seen:
            _invalid()
        seen.add(screen_id)
        result["screens"].append(
            {
                "id": screen_id,
                "name": _string(screen["name"]),
                "online": _boolean(screen["online"]),
                "currentTab": None
                if screen["currentTab"] is None
                else _enum(screen["currentTab"], TAB_LABELS),
                "lastSeenAt": None
                if screen["lastSeenAt"] is None
                else _timestamp(screen["lastSeenAt"]),
                "command": None
                if screen["command"] is None
                else validate_command(screen["command"]),
            }
        )
    if (
        item["chores"] is not None
        and result["permissions"]["shareChores"]
        and result["modules"]["chores"]
    ):
        chores = _object(
            item["chores"], {"localDate", "open", "completed", "truncated", "items"}
        )
        entries = []
        chore_ids: set[str] = set()
        for chore in _array(chores["items"], 250):
            chore = _object(chore, {"id", "title", "assignee", "state"})
            chore_id = _identifier(chore["id"])
            if chore_id in chore_ids:
                _invalid()
            chore_ids.add(chore_id)
            completion_id = chore.get("completionId")
            if control_chores:
                _object(chore, {"completionId", "locked"})
                if (chore["state"] == "completed") != (completion_id is not None):
                    _invalid()
                if completion_id is not None:
                    _identifier(completion_id)
            entries.append(
                {
                    "id": chore_id,
                    "title": _string(chore["title"]),
                    "assignee": _string(chore["assignee"]),
                    "state": _enum(chore["state"], _CHORE_STATES),
                    "completionId": completion_id if control_chores else None,
                    "locked": _boolean(chore.get("locked", False)),
                }
            )
        result["chores"] = {
            "localDate": parse_date(chores["localDate"]).isoformat(),
            "open": _count(chores["open"]),
            "completed": _count(chores["completed"]),
            "truncated": _boolean(chores["truncated"]),
            "items": entries,
        }
    if (
        item["calendar"] is not None
        and result["permissions"]["shareCalendar"]
        and result["modules"]["calendar"]
    ):
        result["calendar"] = validate_calendar(item["calendar"])
    return result


def screen_by_id(state: JsonObject, screen_id: str) -> JsonObject | None:
    return next(
        (screen for screen in state["screens"] if screen["id"] == screen_id), None
    )


def screen_available(
    state: JsonObject, screen: JsonObject | None, now: datetime | None = None
) -> bool:
    """Presence means a reporting Hearth page, never TV power or app launch."""
    if (
        screen is None
        or not screen["online"]
        or screen["currentTab"] is None
        or screen["lastSeenAt"] is None
    ):
        return False
    now = now or datetime.now(UTC)
    return (
        -5 <= (now - parse_instant(state["generatedAt"])).total_seconds() <= 30
        and -5 <= (now - parse_instant(screen["lastSeenAt"])).total_seconds() <= 15
    )


def event_values(event: JsonObject) -> tuple[date | datetime, date | datetime]:
    """All-day bridge endLocalDate is ALREADY exclusive; never add a day."""
    if event["allDay"]:
        return parse_date(event["startLocalDate"]), parse_date(event["endLocalDate"])
    return parse_instant(event["start"]), parse_instant(event["end"])


def event_bounds(event: JsonObject, zone: tzinfo) -> tuple[datetime, datetime]:
    start, end = event_values(event)
    if isinstance(start, datetime) and isinstance(end, datetime):
        return start, end
    return datetime.combine(start, time.min, zone), datetime.combine(
        end, time.min, zone
    )


def calendar_fetch_window(
    start: datetime, end: datetime, household_zone: tzinfo
) -> tuple[datetime, datetime]:
    """Include date-only events when HA and the household use different zones."""
    local_start = datetime.combine(start.date(), time.min, household_zone)
    local_end = datetime.combine(
        end.date() + timedelta(days=1), time.min, household_zone
    )
    return min(start, local_start).astimezone(UTC), max(end, local_end).astimezone(UTC)


def calendar_chunks(
    start: datetime, end: datetime
) -> Iterator[tuple[datetime, datetime]]:
    """Split by elapsed UTC time, including across daylight-saving transitions."""
    if start.utcoffset() is None or end.utcoffset() is None:
        raise HearthProtocolError("Calendar bounds must include a timezone") from None
    cursor, end = start.astimezone(UTC), end.astimezone(UTC)
    if end <= cursor or end - cursor > timedelta(
        days=MAX_CALENDAR_DAYS * MAX_CALENDAR_CHUNKS
    ):
        raise HearthProtocolError(
            "Calendar range must be positive and at most 744 days"
        ) from None
    while cursor < end:
        following = min(cursor + timedelta(days=MAX_CALENDAR_DAYS), end)
        yield cursor, following
        cursor = following


class HearthClient:
    """Use only fixed bridge routes with a dedicated cookie-free session."""

    def __init__(
        self,
        session: ClientSession,
        url: str,
        key: str,
        *,
        allow_loopback_http: bool = False,
        household_id: str | None = None,
    ) -> None:
        self._session = session
        self._url = normalize_url(url, allow_loopback_http=allow_loopback_http)
        self._key = validate_key(key)
        self._household_id = household_id

    async def _request(
        self,
        method: str,
        path: str,
        *,
        payload: JsonObject | None = None,
        params: JsonObject | None = None,
        pairing: bool = False,
    ) -> Any:
        try:
            async with asyncio.timeout(REQUEST_TIMEOUT_SECONDS):
                async with self._session.request(
                    method,
                    self._url + path,
                    headers={
                        **(
                            {}
                            if pairing
                            else {"Authorization": f"HearthAutomation {self._key}"}
                        ),
                        "Accept": "application/json",
                        "Accept-Encoding": "identity",
                    },
                    json=payload,
                    params=params,
                    allow_redirects=False,
                    ssl=True,
                    raise_for_status=False,
                    auto_decompress=False,
                ) as response:
                    if response.status == 401:
                        raise HearthAuthError("Hearth automation key was rejected")
                    if response.status != 200:
                        raise HearthProtocolError("Hearth bridge request was rejected")
                    if (
                        response.content_type != "application/json"
                        or response.headers.get("Content-Encoding", "identity").lower()
                        != "identity"
                    ):
                        _invalid()
                    if (
                        response.content_length is not None
                        and response.content_length > MAX_BODY_BYTES
                    ):
                        raise HearthProtocolError(
                            "Hearth response exceeded the size limit"
                        )
                    body = bytearray()
                    async for chunk in response.content.iter_chunked(65536):
                        body.extend(chunk)
                        if len(body) > MAX_BODY_BYTES:
                            raise HearthProtocolError(
                                "Hearth response exceeded the size limit"
                            )
                    try:
                        return json.loads(body)
                    except (ValueError, UnicodeError, RecursionError):
                        _invalid()
        except HearthError:
            raise
        except ssl.SSLError:
            raise HearthConnectionError("Hearth TLS validation failed") from None
        except (TimeoutError, OSError):
            # No HTTP response was accepted. Retrying a command is safe ONLY
            # with the same requestId and payload (server has durable receipts).
            raise HearthTransportError("Hearth bridge transport failed") from None
        except Exception:  # noqa: BLE001 - Strip request headers/URLs from all transport failures.
            # Includes aiohttp disconnect/payload/protocol errors; these are
            # intentionally not retried. Never propagate request info/headers.
            raise HearthConnectionError("Could not read the Hearth bridge") from None

    async def async_start_pairing(self, request_id: str) -> JsonObject:
        payload = {"requestId": _identifier(request_id), "secret": self._key}
        for attempt in range(2):
            try:
                response = await self._request(
                    "POST",
                    "/api/v1/home-assistant/pairing-requests",
                    payload=payload,
                    pairing=True,
                )
                break
            except HearthTransportError:
                if attempt:
                    raise
        result = _object(response, {"id", "code", "expiresAt", "interval"})
        _identifier(result["id"])
        if (
            not isinstance(result["code"], str)
            or not re.fullmatch(r"[A-HJ-NP-Z]{6}", result["code"])
            or type(result["interval"]) is not int
            or result["interval"] != 3
        ):
            _invalid()
        _timestamp(result["expiresAt"])
        return result

    async def async_wait_for_pairing(
        self, pairing_id: str, interval: int = 3
    ) -> JsonObject:
        """Cancellable bounded device flow. The user code never authorizes a request."""
        _identifier(pairing_id)
        if interval != 3:
            _invalid()
        try:
            async with asyncio.timeout(300):
                while True:
                    await asyncio.sleep(interval)
                    try:
                        response = await self._request(
                            "POST",
                            f"/api/v1/home-assistant/pairing-requests/{pairing_id}/exchanges",
                            payload={"secret": self._key},
                            pairing=True,
                        )
                    except HearthTransportError:
                        # A lost exchange response may already have created the grant.
                        # Poll again with this exact proof, never generate a replacement secret.
                        continue
                    result = _object(response, {"state", "receipt"})
                    if result["state"] == "waiting" and result["receipt"] is None:
                        continue
                    if result["state"] != "connected" or not isinstance(
                        result["receipt"], dict
                    ):
                        _invalid()
                    return await self.async_state()
        except TimeoutError:
            raise HearthProtocolError("Hearth connection request expired") from None

    async def async_state(self) -> JsonObject:
        state = validate_state(
            await self._request("GET", "/api/v1/home-assistant/state")
        )
        if (
            self._household_id is not None
            and state["household"]["id"] != self._household_id
        ):
            raise HearthAuthError("Hearth household changed; reauthenticate") from None
        return state

    async def async_set_chore_completion(
        self,
        occurrence_id: str,
        local_date: str,
        is_completed: bool,
        completion_id: str | None,
    ) -> JsonObject:
        """Set an explicit status, never toggle; transport retries reuse one payload."""
        occurrence_id = _identifier(occurrence_id)
        local_date = parse_date(local_date).isoformat()
        _boolean(is_completed)
        if is_completed:
            if completion_id is not None:
                _invalid()
        else:
            _identifier(completion_id)
        payload = {
            "requestId": f"ha_chore_{uuid4().hex}",
            "localDate": local_date,
            "isCompleted": is_completed,
            "completionId": completion_id,
        }
        for attempt in range(2):
            try:
                response = await self._request(
                    "POST",
                    f"/api/v1/home-assistant/chores/{occurrence_id}/completion",
                    payload=payload,
                )
                break
            except HearthTransportError:
                if attempt:
                    raise
        receipt = _object(
            response, {"id", "localDate", "state", "completionId", "replayed"}
        )
        expected = "completed" if is_completed else "pending"
        if (
            receipt["id"] != occurrence_id
            or receipt["localDate"] != local_date
            or receipt["state"] != expected
        ):
            _invalid()
        if is_completed:
            _identifier(receipt["completionId"])
        elif receipt["completionId"] is not None:
            _invalid()
        return {
            "id": occurrence_id,
            "localDate": local_date,
            "state": expected,
            "completionId": receipt["completionId"],
            "replayed": _boolean(receipt["replayed"]),
        }

    async def async_set_module(self, module_id: str, enabled: bool) -> JsonObject:
        """Use one explicit state and exact request across bounded transport retries."""
        _enum(module_id, MODULE_LABELS)
        _boolean(enabled)
        payload = {"requestId": f"ha_module_{uuid4().hex}", "enabled": enabled}
        for attempt in range(2):
            try:
                response = await self._request(
                    "PUT",
                    f"/api/v1/home-assistant/modules/{module_id}",
                    payload=payload,
                )
                break
            except HearthTransportError:
                if attempt:
                    raise
        receipt = _object(response, {"configuration", "audit", "replayed"})
        configuration = _object(receipt["configuration"], {"householdId", "enabled"})
        household_id = _identifier(configuration["householdId"])
        if self._household_id is not None and household_id != self._household_id:
            raise HearthAuthError("Hearth household changed; reauthenticate") from None
        flags = _object(configuration["enabled"], set(LEGACY_MODULE_IDS))
        flags = {**flags, "nba": flags.get("nba", False), "morningRoutine": flags.get("morningRoutine", False), "fitness": flags.get("fitness", False), "afternoonRoutine": flags.get("afternoonRoutine", False)}
        flags = {name: _boolean(flags[name]) for name in MODULE_LABELS}
        if flags[module_id] != enabled:
            _invalid()
        return {
            "householdId": household_id,
            "enabled": flags,
            "replayed": _boolean(receipt["replayed"]),
        }

    async def async_navigation(
        self, screen_id: str, tab: str, request_id: str
    ) -> JsonObject:
        _identifier(screen_id)
        _identifier(request_id)
        _enum(tab, TAB_LABELS)
        payload = {"requestId": request_id, "tab": tab}
        for attempt in range(2):
            try:
                result = await self._request(
                    "POST",
                    f"/api/v1/home-assistant/screens/{screen_id}/navigation",
                    payload=payload,
                )
                break
            except HearthTransportError:
                if attempt:
                    raise
        result = _object(result, {"command", "replayed"})
        _boolean(result["replayed"])
        command = validate_command(result["command"])
        if command["tab"] != tab:
            _invalid()
        return command

    async def async_navigate_and_wait(
        self, screen_id: str, tab: str, on_state: Callable[[JsonObject], None]
    ) -> None:
        """A POST receipt is never success. Require a fresh exact ID+tab ack."""
        try:
            async with asyncio.timeout(COMMAND_TIMEOUT_SECONDS):
                state = await self.async_state()
                on_state(state)
                if not screen_available(state, screen_by_id(state, screen_id)):
                    raise HearthCommandError(
                        "The Hearth screen is not visible and online"
                    )
                command = await self.async_navigation(
                    screen_id, tab, "ha_" + uuid4().hex
                )
                if command["status"] not in {"pending", "applied"}:
                    raise HearthCommandError("Hearth navigation was not applied")
                while True:
                    state = await self.async_state()
                    on_state(state)
                    screen = screen_by_id(state, screen_id)
                    if not screen_available(state, screen):
                        raise HearthCommandError("The Hearth screen stopped reporting")
                    observed = screen["command"]
                    if (
                        observed is None
                        or observed["id"] != command["id"]
                        or observed["tab"] != tab
                    ):
                        raise HearthCommandError(
                            "Hearth navigation was replaced or cancelled"
                        )
                    if observed["status"] == "applied" and screen["currentTab"] == tab:
                        return
                    if observed["status"] != "pending" or datetime.now(
                        UTC
                    ) >= parse_instant(command["expiresAt"]):
                        raise HearthCommandError(
                            "Hearth navigation was not acknowledged"
                        )
                    await asyncio.sleep(ACK_POLL_SECONDS)
        except TimeoutError:
            raise HearthCommandError(
                "Timed out waiting for Hearth navigation acknowledgement"
            ) from None

    async def async_calendar(self, start: datetime, end: datetime) -> JsonObject:
        events: dict[str, JsonObject] = {}
        freshness = "current"
        # Materialize to validate the complete range before making any request.
        for lower, upper in list(calendar_chunks(start, end)):
            result = validate_calendar(
                await self._request(
                    "GET",
                    "/api/v1/home-assistant/calendar",
                    params={"start": lower.isoformat(), "end": upper.isoformat()},
                )
            )
            if result["freshness"] == "offline":
                raise HearthConnectionError("Hearth calendar is offline") from None
            if result["freshness"] == "stale":
                freshness = "stale"
            for event in result["events"]:
                if event["id"] in events and events[event["id"]] != event:
                    raise HearthProtocolError(
                        "Hearth calendar changed during the range read"
                    ) from None
                events[event["id"]] = event
            if len(events) > MAX_CALENDAR_EVENTS:
                raise HearthProtocolError(
                    "Hearth calendar range exceeded the size limit"
                ) from None
        return {"freshness": freshness, "events": list(events.values())}
