"""Contract and transport behavior with a fake session; no network or HA."""

import asyncio
import json
import re
import ssl
import unittest
from copy import deepcopy
from datetime import date, datetime, timedelta
from itertools import pairwise
from pathlib import Path
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

from support import (
    COMPONENT,
    KEY,
    UTC,
    Response,
    Session,
    client,
    command,
    event,
    make_client,
    module,
    state,
)


class SchemaTests(unittest.TestCase):
    def test_old_module_defaults_and_disabled_data_are_never_projected(self):
        old = client.validate_state(state())
        self.assertFalse(old["permissions"]["controlModules"])
        self.assertTrue(all(old["modules"][key] for key in client.LEGACY_MODULE_IDS))
        self.assertFalse(old["modules"]["nba"])
        self.assertNotIn("nba", old["permissions"]["moduleIds"])
        raw = state()
        raw["modules"] = dict.fromkeys(client.MODULE_LABELS, True)
        raw["modules"].update(chores=False, calendar=False)
        raw["permissions"]["controlModules"] = True
        result = client.validate_state(raw)
        self.assertIsNone(result["chores"])
        self.assertIsNone(result["calendar"])
        self.assertNotIn(raw["chores"]["items"][0]["title"], json.dumps(result))
        for invalid in (None, {}, {**raw["modules"], "weather": 1}):
            with (
                self.subTest(invalid=invalid),
                self.assertRaises(client.HearthProtocolError),
            ):
                client.validate_state({**raw, "modules": invalid})
        del raw["modules"]
        with self.assertRaises(client.HearthProtocolError):
            client.validate_state(raw)

    def test_old_permissions_never_gain_control_and_completion_ids_require_opt_in(self):
        old = state()
        old["permissions"].pop("controlChores")
        old["chores"]["items"][0]["completionId"] = "completion_hidden"
        projected = client.validate_state(old)
        self.assertFalse(projected["permissions"]["controlChores"])
        self.assertIsNone(projected["chores"]["items"][0]["completionId"])
        old["permissions"].update(controlChores=True, shareChores=False)
        with self.assertRaises(client.HearthProtocolError):
            client.validate_state(old)

    def test_control_projection_rejects_ambiguous_ids_or_missing_completion_identity(
        self,
    ):
        data = state()
        data["permissions"]["controlChores"] = True
        data["chores"]["items"][0]["state"] = "completed"
        with self.assertRaises(client.HearthProtocolError):
            client.validate_state(data)
        data["chores"]["items"][0]["completionId"] = "completion_fixture"
        self.assertEqual(
            client.validate_state(data)["chores"]["items"][0]["completionId"],
            "completion_fixture",
        )
        data["chores"]["items"].append(deepcopy(data["chores"]["items"][0]))
        with self.assertRaises(client.HearthProtocolError):
            client.validate_state(data)

    def test_canonical_shared_fixture_roundtrip_and_calendar_semantics(self):
        fixture_path = (
            Path(__file__).resolve().parents[3]
            / "packages/shared/fixtures/home-assistant-bridge-v1/state.json"
        )
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        validated = client.validate_state(fixture)
        expected = {
            **fixture,
            "permissions": {**fixture["permissions"], "controlModules": False, "moduleIds": list(client.LEGACY_MODULE_IDS)},
            "modules": {**dict.fromkeys(client.LEGACY_MODULE_IDS, True), "nba": False, "morningRoutine": False, "fitness": False},
        }
        self.assertEqual(validated, expected)

        all_day = next(
            item for item in validated["calendar"]["events"] if item["allDay"]
        )
        day_start, day_end = client.event_values(all_day)
        self.assertIs(type(day_start), date)
        self.assertIs(type(day_end), date)
        self.assertEqual((day_start, day_end), (date(2026, 10, 15), date(2026, 10, 16)))
        self.assertEqual(day_end - day_start, timedelta(days=1))

        timed = next(
            item for item in validated["calendar"]["events"] if not item["allDay"]
        )
        time_start, time_end = client.event_values(timed)
        self.assertIsInstance(time_start, datetime)
        self.assertIsInstance(time_end, datetime)
        self.assertEqual(time_start.isoformat(), timed["start"])
        self.assertEqual(time_end.isoformat(), timed["end"])
        self.assertEqual(time_start.utcoffset(), timedelta(hours=8))
        self.assertEqual(time_end.utcoffset(), timedelta(hours=8))
        self.assertEqual(time_end - time_start, timedelta(hours=1))

    def test_shared_tab_ids_and_translated_labels_stay_in_sync(self):
        source = (
            Path(__file__).resolve().parents[3]
            / "packages/shared/src/home-assistant-bridge.ts"
        )
        text = source.read_text()
        tab_block = text.split("export const SCREEN_TAB_PATHS = {", 1)[1].split(
            "} as const", 1
        )[0]
        self.assertEqual(
            list(module("const").TAB_LABELS),
            re.findall(r"^  ([a-z_]+):", tab_block, re.MULTILINE),
        )
        strings = json.loads((COMPONENT / "strings.json").read_text())
        english = json.loads((COMPONENT / "translations/en.json").read_text())
        self.assertEqual(strings, english)
        self.assertEqual(
            strings["entity"]["select"]["visible_tab"]["state"],
            module("const").TAB_LABELS,
        )

    def test_state_safe_projection_and_chore_counts(self):
        original = state()
        original["private"] = "must not reach attributes"
        original["chores"]["items"][0]["notes"] = "private"
        original["screens"][0]["token"] = KEY
        result = client.validate_state(original)
        self.assertEqual(result["chores"]["open"], 3)
        self.assertNotIn("private", result)
        self.assertNotIn("notes", result["chores"]["items"][0])
        self.assertNotIn(KEY, json.dumps(result))

    def test_enabled_null_and_disabled_null_are_preserved(self):
        for enabled in (True, False):
            with self.subTest(enabled=enabled):
                data = state()
                data["permissions"] = {"shareChores": enabled, "shareCalendar": enabled}
                data["chores"] = data["calendar"] = None
                result = client.validate_state(data)
                self.assertIsNone(result["chores"])
                self.assertIsNone(result["calendar"])
                self.assertEqual(result["permissions"]["shareChores"], enabled)
                self.assertTrue(client.screen_available(result, result["screens"][0]))

    def test_bad_state_fields_are_rejected(self):
        changes = [
            lambda s: s.update(version=True),
            lambda s: s.update(version=2),
            lambda s: s.update(generatedAt="2026-10-15T00:00:00"),
            lambda s: s["household"].update(id="../adult"),
            lambda s: s["household"].update(timezone="No/Such_Zone"),
            lambda s: s["permissions"].update(shareChores=1),
            lambda s: s["screens"][0].update(currentTab="admin"),
            lambda s: s["screens"][0].update(currentTab="https://other.invalid"),
            lambda s: s["screens"].append(deepcopy(s["screens"][0])),
            lambda s: s.update(screens=s["screens"] * 21),
            lambda s: s["chores"].update(open=True),
            lambda s: s["chores"].update(completed=-1),
            lambda s: s["chores"].update(items=s["chores"]["items"] * 251),
            lambda s: s["chores"].update(localDate="2026-02-30"),
            lambda s: s["chores"]["items"][0].update(state="done"),
        ]
        for change in changes:
            with self.subTest(change=changes.index(change)):
                data = state()
                change(data)
                with self.assertRaises(client.HearthProtocolError):
                    client.validate_state(data)

    def test_command_statuses_and_bounds(self):
        for status in ("pending", "applied", "expired", "superseded", "cancelled"):
            self.assertEqual(client.validate_command(command(status))["status"], status)
        for changes in (
            {"status": "accepted"},
            {"tab": "setup"},
            {"expiresAt": "2000-01-01T00:00:00Z"},
        ):
            with self.assertRaises(client.HearthProtocolError):
                client.validate_command({**command(), **changes})

    def test_screen_presence_and_null_tab(self):
        for changes in (
            {"online": False},
            {"currentTab": None},
            {"lastSeenAt": None},
            {"lastSeenAt": (datetime.now(UTC) - timedelta(seconds=16)).isoformat()},
        ):
            data = state()
            data["screens"][0].update(changes)
            self.assertFalse(client.screen_available(data, data["screens"][0]))
        data = state()
        data["generatedAt"] = (datetime.now(UTC) - timedelta(seconds=31)).isoformat()
        self.assertFalse(client.screen_available(data, data["screens"][0]))

    def test_url_and_key_boundaries(self):
        self.assertEqual(
            client.normalize_url("https://hearth.invalid/"), "https://hearth.invalid"
        )
        for url in (
            "http://hearth.invalid",
            "http://127.0.0.1",
            "https://user:password@hearth.invalid",
            "https://hearth.invalid/path",
            "https://hearth.invalid?key=secret",
            "https://hearth.invalid/#secret",
            "file:///tmp/hearth",
            "https://hearth.invalid\n",
            "https://hearth.invalid:0",
            "https://hearth.invalid\\evil",
        ):
            with self.subTest(url=url), self.assertRaises(client.HearthProtocolError):
                client.normalize_url(url)
        for url in ("http://127.0.0.1:8123", "http://[::1]:8123"):
            self.assertEqual(client.normalize_url(url, allow_loopback_http=True), url)
        for url in (
            "http://localhost:8123",
            "http://192.168.1.2",
            "http://localhost.invalid",
            "http://0.0.0.0",
        ):
            with self.assertRaises(client.HearthProtocolError):
                client.normalize_url(url, allow_loopback_http=True)
        for key in ("Bearer " + KEY, "ha_short", KEY + "\n", "tv_" + "A" * 43):
            with self.assertRaises(client.HearthAuthError) as raised:
                client.validate_key(key)
            self.assertNotIn(key, str(raised.exception))


class ClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_pairing_start_retries_exactly_without_authorization_or_code_as_secret(
        self,
    ):
        pairing = {
            "id": "pairing_fixture",
            "code": "ABCDEF",
            "expiresAt": datetime.now(UTC).isoformat(),
            "interval": 3,
        }
        session = Session(TimeoutError(), Response(pairing))
        self.assertEqual(
            await make_client(session).async_start_pairing("request_fixture"), pairing
        )
        self.assertEqual(session.calls[0], session.calls[1])
        self.assertNotIn("Authorization", session.calls[0][2]["headers"])
        self.assertEqual(session.calls[0][2]["json"]["secret"], KEY)
        self.assertFalse(session.calls[0][2]["allow_redirects"])
        for change in [
            {"code": "ABC123"},
            {"interval": 0},
            {"id": "../escape"},
            {"expiresAt": "not-a-date"},
        ]:
            with self.assertRaises(client.HearthProtocolError):
                await make_client(
                    Session(Response({**pairing, **change}))
                ).async_start_pairing("request_fixture")

    async def test_pairing_poll_replays_lost_exchange_then_validates_real_state(self):
        session = Session(
            Response({"state": "waiting", "receipt": None}),
            TimeoutError(),
            Response({"state": "connected", "receipt": {"replayed": True}}),
            Response(state()),
        )
        with patch.object(client.asyncio, "sleep", new=AsyncMock()) as sleep:
            result = await make_client(session).async_wait_for_pairing(
                "pairing_fixture"
            )
        self.assertEqual(result["household"]["id"], "household_demo")
        self.assertEqual(sleep.await_count, 3)
        self.assertEqual(session.calls[1], session.calls[2])
        for call in session.calls[:3]:
            self.assertNotIn("Authorization", call[2]["headers"])
            self.assertEqual(call[2]["json"], {"secret": KEY})
        self.assertEqual(
            session.calls[3][2]["headers"]["Authorization"], f"HearthAutomation {KEY}"
        )

    async def test_pairing_denial_and_cancel_never_fetch_household_state(self):
        for response in [
            Response(status=403),
            Response({"state": "connected", "receipt": None}),
            asyncio.CancelledError(),
        ]:
            session = Session(response)
            with (
                patch.object(client.asyncio, "sleep", new=AsyncMock()),
                self.assertRaises((client.HearthError, asyncio.CancelledError)),
            ):
                await make_client(session).async_wait_for_pairing("pairing_fixture")
            self.assertEqual(len(session.calls), 1)

    async def test_chore_transport_retry_is_exact_and_response_is_bound(self):
        receipt = {
            "id": "chore_demo",
            "localDate": "2026-10-15",
            "state": "completed",
            "completionId": "completion_fixture",
            "replayed": True,
        }
        session = Session(TimeoutError(), Response(receipt))
        result = await make_client(session).async_set_chore_completion(
            "chore_demo", "2026-10-15", True, None
        )
        self.assertTrue(result["replayed"])
        self.assertEqual(len(session.calls), 2)
        self.assertEqual(session.calls[0], session.calls[1])
        self.assertEqual(session.calls[0][2]["json"]["completionId"], None)
        bad = {**receipt, "id": "chore_other"}
        with self.assertRaises(client.HearthProtocolError):
            await make_client(Session(Response(bad))).async_set_chore_completion(
                "chore_demo", "2026-10-15", True, None
            )

    async def test_module_transport_retry_is_exact_and_response_is_bound(self):
        receipt = {
            "configuration": {
                "householdId": "household_demo",
                "enabled": dict.fromkeys(client.MODULE_LABELS, True),
            },
            "audit": {},
            "replayed": True,
        }
        receipt["configuration"]["enabled"]["weather"] = False
        session = Session(TimeoutError(), Response(receipt))
        connection = make_client(session)
        connection._household_id = "household_demo"
        result = await connection.async_set_module("weather", False)
        self.assertTrue(result["replayed"])
        self.assertEqual(session.calls[0], session.calls[1])
        self.assertEqual(session.calls[0][0], "PUT")
        self.assertEqual(session.calls[0][2]["json"]["enabled"], False)
        self.assertNotIn("audit", result)
        for bad in (
            {
                **receipt,
                "configuration": {
                    **receipt["configuration"],
                    "householdId": "household_other",
                },
            },
            {**receipt, "configuration": {**receipt["configuration"], "enabled": {}}},
            {**receipt, "replayed": 1},
        ):
            connection = make_client(Session(Response(bad)))
            connection._household_id = "household_demo"
            with self.assertRaises(client.HearthError):
                await connection.async_set_module("weather", False)
        for module_id, enabled in (("../admin", True), ("weather", 1)):
            empty = Session()
            with self.assertRaises(client.HearthProtocolError):
                await make_client(empty).async_set_module(module_id, enabled)
            self.assertEqual(empty.calls, [])
        denied = Session(Response(status=403), Response(receipt))
        with self.assertRaises(client.HearthError):
            await make_client(denied).async_set_module("weather", False)
        self.assertEqual(len(denied.calls), 1)

    async def test_reopen_sends_observed_completion_and_never_retries_http_errors(self):
        receipt = {
            "id": "chore_demo",
            "localDate": "2026-10-15",
            "state": "pending",
            "completionId": None,
            "replayed": False,
        }
        session = Session(Response(receipt))
        await make_client(session).async_set_chore_completion(
            "chore_demo", "2026-10-15", False, "completion_seen"
        )
        self.assertEqual(session.calls[0][2]["json"]["completionId"], "completion_seen")
        denied = Session(Response(status=403), Response(receipt))
        with self.assertRaises(client.HearthError):
            await make_client(denied).async_set_chore_completion(
                "chore_demo", "2026-10-15", True, None
            )
        self.assertEqual(len(denied.calls), 1)

    async def test_invalid_chore_update_never_reaches_http(self):
        for args in [
            ("../admin", "2026-10-15", True, None),
            ("chore_demo", "2026-10-15", False, None),
            ("chore_demo", "yesterday", True, None),
            ("chore_demo", "2026-10-15", True, "completion_wrong"),
        ]:
            session = Session()
            with self.assertRaises(client.HearthProtocolError):
                await make_client(session).async_set_chore_completion(*args)
            self.assertEqual(session.calls, [])

    async def test_distinct_auth_tls_and_no_redirects(self):
        session = Session(Response(state()))
        await make_client(session).async_state()
        method, url, options = session.calls[0]
        self.assertEqual(
            (method, url), ("GET", "https://hearth.invalid/api/v1/home-assistant/state")
        )
        self.assertEqual(options["headers"]["Authorization"], "HearthAutomation " + KEY)
        self.assertNotIn("Cookie", options["headers"])
        self.assertIs(options["ssl"], True)
        self.assertIs(options["allow_redirects"], False)
        self.assertIs(options["auto_decompress"], False)

    async def test_401_is_auth_failure_without_body_or_header_leak(self):
        session = Session(Response({"error": KEY}, status=401))
        with self.assertRaises(client.HearthAuthError) as raised:
            await make_client(session).async_state()
        self.assertNotIn(KEY, str(raised.exception))
        self.assertEqual(len(session.calls), 1)

    async def test_household_pinning(self):
        with self.assertRaises(client.HearthAuthError):
            await make_client(
                Session(Response(state())), household_id="another_house"
            ).async_state()

    async def test_body_bounds_compression_and_malformed_json(self):
        bad = [
            Response(raw=b"{"),
            Response(raw=b"[" * 1500),
            Response(state(), content_length=client.MAX_BODY_BYTES + 1),
            Response(raw=b" " * (client.MAX_BODY_BYTES + 1), content_length=1),
            Response(state(), content_type="text/html"),
            Response(state(), headers={"Content-Encoding": "gzip"}),
        ]
        for response in bad:
            with (
                self.subTest(response=bad.index(response)),
                self.assertRaises(client.HearthProtocolError),
            ):
                await make_client(Session(response)).async_state()

    async def test_timeout_is_bounded_and_cancellation_propagates(self):
        with (
            patch.object(client, "REQUEST_TIMEOUT_SECONDS", 0.005),
            self.assertRaises(client.HearthTransportError),
        ):
            await make_client(Session(Response(state(), delay=1))).async_state()
        with self.assertRaises(asyncio.CancelledError):
            await make_client(Session(asyncio.CancelledError())).async_state()

    async def test_same_request_id_retry_only_after_safe_transport_failure(self):
        for error in (OSError(KEY), TimeoutError(KEY)):
            session = Session(error, Response({"command": command(), "replayed": True}))
            await make_client(session).async_navigation(
                "screen_kitchen", "chores", "request_one"
            )
            self.assertEqual(len(session.calls), 2)
            self.assertEqual(session.calls[0], session.calls[1])
            self.assertEqual(
                session.calls[0][2]["json"],
                {"requestId": "request_one", "tab": "chores"},
            )

    async def test_never_retry_http_protocol_tls_or_unknown_failures(self):
        bad = [
            Response({}, status=code)
            for code in (301, 302, 307, 308, 400, 401, 403, 409, 429, 500)
        ]
        bad.extend([Response(raw=b"broken"), ssl.SSLError(KEY), RuntimeError(KEY)])
        for response in bad:
            session = Session(response)
            with (
                self.subTest(response=bad.index(response)),
                self.assertRaises(client.HearthError) as raised,
            ):
                await make_client(session).async_navigation(
                    "screen_kitchen", "chores", "request_one"
                )
            self.assertEqual(len(session.calls), 1)
            self.assertNotIn(KEY, str(raised.exception))

    async def test_transport_retry_is_limited_to_two_attempts(self):
        session = Session(OSError(KEY), OSError(KEY))
        with self.assertRaises(client.HearthTransportError):
            await make_client(session).async_navigation(
                "screen_kitchen", "chores", "request_one"
            )
        self.assertEqual(len(session.calls), 2)

    async def test_only_exact_subsequent_acknowledgement_is_success(self):
        pending = command()
        applied = {**pending, "status": "applied"}
        snapshots = []
        session = Session(
            Response(state()),
            Response({"command": pending, "replayed": False}),
            Response(state("today", observed=pending)),
            Response(state("chores", observed=applied)),
        )
        with patch.object(client, "ACK_POLL_SECONDS", 0):
            await make_client(session).async_navigate_and_wait(
                "screen_kitchen", "chores", snapshots.append
            )
        self.assertEqual(
            [s["screens"][0]["currentTab"] for s in snapshots],
            ["today", "today", "chores"],
        )

    async def test_navigation_cannot_launch_or_interrupt_another_app(self):
        for changes in ({"online": False}, {"currentTab": None}):
            data = state()
            data["screens"][0].update(changes)
            session = Session(Response(data))
            with self.assertRaises(client.HearthCommandError):
                await make_client(session).async_navigate_and_wait(
                    "screen_kitchen", "chores", lambda s: None
                )
            self.assertEqual([call[0] for call in session.calls], ["GET"])

    async def test_terminal_mismatched_or_missing_ack_is_error(self):
        pending = command()
        observations = [
            None,
            command(command_id="other_command"),
            command(tab="weather"),
            *[
                {**pending, "status": status}
                for status in ("expired", "superseded", "cancelled", "applied")
            ],
        ]
        for observed in observations:
            # Even "applied" is insufficient if the reported tab is still Today.
            session = Session(
                Response(state()),
                Response({"command": pending, "replayed": False}),
                Response(state(observed=observed)),
            )
            with (
                self.subTest(observed=observed),
                self.assertRaises(client.HearthCommandError),
            ):
                await make_client(session).async_navigate_and_wait(
                    "screen_kitchen", "chores", lambda s: None
                )

    async def test_pending_without_acknowledgement_times_out_and_keeps_observed_tab(
        self,
    ):
        pending = command()
        session = Session(
            Response(state()),
            Response({"command": pending, "replayed": False}),
            Response(state(observed=pending)),
        )
        snapshots = []
        with (
            patch.object(client, "COMMAND_TIMEOUT_SECONDS", 0.01),
            patch.object(client, "ACK_POLL_SECONDS", 1),
            self.assertRaisesRegex(client.HearthCommandError, "Timed out"),
        ):
            await make_client(session).async_navigate_and_wait(
                "screen_kitchen", "chores", snapshots.append
            )
        self.assertEqual(snapshots[-1]["screens"][0]["currentTab"], "today")

    async def test_replayed_applied_receipt_still_requires_fresh_state(self):
        applied = command("applied")
        session = Session(
            Response(state()),
            Response({"command": applied, "replayed": True}),
            Response(state("chores", observed=applied)),
        )
        await make_client(session).async_navigate_and_wait(
            "screen_kitchen", "chores", lambda s: None
        )
        self.assertEqual([call[0] for call in session.calls], ["GET", "POST", "GET"])

    async def test_invalid_navigation_never_sends_a_write(self):
        for screen_id, tab in (
            ("../admin", "chores"),
            ("screen_kitchen", "admin"),
            ("screen_kitchen", "/photos"),
        ):
            session = Session()
            with self.assertRaises(client.HearthProtocolError):
                await make_client(session).async_navigation(
                    screen_id, tab, "request_one"
                )
            self.assertEqual(session.calls, [])


class CalendarTests(unittest.IsolatedAsyncioTestCase):
    def test_all_day_wire_end_is_already_exclusive(self):
        item = client.validate_event(event(all_day=True))
        start, end = client.event_values(item)
        self.assertEqual(start.isoformat(), "2026-10-15")
        self.assertEqual(end.isoformat(), "2026-10-16")
        self.assertNotIsInstance(start, datetime)

    def test_timed_values_keep_offsets_and_reject_reversed_instants(self):
        item = event()
        item.update(start="2026-04-05T02:30:00+11:00", end="2026-04-05T02:30:00+10:00")
        start, end = client.event_values(client.validate_event(item))
        self.assertEqual(start.utcoffset(), timedelta(hours=11))
        self.assertEqual(end.utcoffset(), timedelta(hours=10))
        for changes in (
            {"end": item["start"]},
            {"end": "2000-01-01T00:00:00Z"},
            {"start": "2026-01-01T00:00:00"},
            {"title": "x" * 161},
            {"start": "2026-04-05T02:30:00+01:99"},
            {"allDay": True, "endLocalDate": item["startLocalDate"]},
        ):
            with self.assertRaises(client.HearthProtocolError):
                client.validate_event({**item, **changes})

    def test_chunks_bound_elapsed_utc_days_across_dst(self):
        zone = ZoneInfo("Australia/Sydney")
        start = datetime(2026, 3, 20, tzinfo=zone)
        end = datetime(2026, 5, 20, tzinfo=zone)
        chunks = list(client.calendar_chunks(start, end))
        self.assertEqual(chunks[0][0], start.astimezone(UTC))
        self.assertEqual(chunks[-1][1], end.astimezone(UTC))
        for lower, upper in chunks:
            self.assertLessEqual(upper - lower, timedelta(days=31))
            self.assertGreater(upper, lower)
        for earlier, later in pairwise(chunks):
            self.assertEqual(earlier[1], later[0])
        for lower, upper in (
            (end, start),
            (start, start),
            (start.replace(tzinfo=None), end),
        ):
            with self.assertRaises(client.HearthProtocolError):
                list(client.calendar_chunks(lower, upper))

    def test_ha_midnight_order_and_cross_timezone_fetch_window(self):
        zone = ZoneInfo("America/Los_Angeles")
        start = datetime(2026, 10, 15, tzinfo=zone)
        end = start + timedelta(days=1)
        item = event(all_day=True)
        lower, upper = client.event_bounds(item, zone)
        self.assertEqual((lower, upper), (start, end))
        fetch_start, fetch_end = client.calendar_fetch_window(
            start, end, ZoneInfo("Australia/Perth")
        )
        self.assertLessEqual(fetch_start, client.parse_instant(item["start"]))
        self.assertGreaterEqual(fetch_end, client.parse_instant(item["end"]))

    async def test_range_split_deduplicates_and_preserves_stale(self):
        item = event(all_day=True)
        session = Session(
            Response({"freshness": "current", "events": [item]}),
            Response({"freshness": "stale", "events": [item]}),
        )
        start = datetime(2026, 10, 1, tzinfo=UTC)
        result = await make_client(session).async_calendar(
            start, start + timedelta(days=42)
        )
        self.assertEqual(result, {"freshness": "stale", "events": [item]})
        self.assertEqual(len(session.calls), 2)
        for method, url, options in session.calls:
            self.assertEqual(
                (method, url),
                ("GET", "https://hearth.invalid/api/v1/home-assistant/calendar"),
            )
            params = options["params"]
            self.assertLessEqual(
                client.parse_instant(params["end"])
                - client.parse_instant(params["start"]),
                timedelta(days=31),
            )

    async def test_no_partial_or_offline_calendar_is_returned(self):
        start = datetime(2026, 10, 1, tzinfo=UTC)
        cases = [
            Response({"freshness": "offline", "events": []}),
            Response({"freshness": "current", "events": [], "truncated": True}),
            Response({"freshness": "current", "events": [event()] * 2001}),
            Response({}, status=413),
        ]
        for bad in cases:
            session = Session(
                Response({"freshness": "current", "events": [event()]}), bad
            )
            with self.assertRaises(client.HearthError):
                await make_client(session).async_calendar(
                    start, start + timedelta(days=42)
                )

    async def test_invalid_large_range_rejected_before_network(self):
        session = Session()
        start = datetime(2026, 10, 1, tzinfo=UTC)
        with self.assertRaises(client.HearthProtocolError):
            await make_client(session).async_calendar(
                start, start + timedelta(days=745)
            )
        self.assertEqual(session.calls, [])

    async def test_changed_occurrence_across_chunks_fails_explicitly(self):
        start = datetime(2026, 10, 1, tzinfo=UTC)
        first = {"freshness": "current", "events": [event()]}
        second = deepcopy(first)
        second["events"][0]["title"] = "Changed"
        with self.assertRaises(client.HearthProtocolError):
            await make_client(
                Session(Response(first), Response(second))
            ).async_calendar(start, start + timedelta(days=42))


if __name__ == "__main__":
    unittest.main()
