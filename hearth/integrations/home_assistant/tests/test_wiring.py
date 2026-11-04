"""Focused HA wiring units using deliberately minimal import/API stand-ins.

These exercise our methods, not HA lifecycle, schemas, services or rendering.
No Home Assistant/aiohttp/probatio installation or network access is required.
"""

import asyncio
import sys
import unittest
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from enum import IntFlag, StrEnum
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

from support import (
    KEY,
    UTC,
    Response,
    Session,
    client,
    event,
    make_client,
    module,
    state,
)


class HomeAssistantError(Exception):
    pass


class ConfigEntryAuthFailed(HomeAssistantError):
    pass


class UpdateFailed(HomeAssistantError):
    pass


class AbortFlow(Exception):
    pass


class ConfigFlow:
    def __init_subclass__(cls, **kwargs):
        pass

    def __init__(self):
        self.hass = SimpleNamespace(async_create_task=asyncio.create_task)
        self.existing_ids = set()

    async def async_set_unique_id(self, value):
        self.unique_id = value

    def _abort_if_unique_id_configured(self):
        if self.unique_id in self.existing_ids:
            raise AbortFlow("already_configured")

    def _abort_if_unique_id_mismatch(self):
        if self.unique_id != self.entry.unique_id:
            raise AbortFlow("unique_id_mismatch")

    def _get_reauth_entry(self):
        return self.entry

    def async_create_entry(self, **kwargs):
        return {"type": "create_entry", **kwargs}

    def async_update_reload_and_abort(self, entry, **kwargs):
        self.update = (entry, kwargs)
        return {"type": "abort", "reason": "reauth_successful"}

    def async_show_form(self, **kwargs):
        return {"type": "form", **kwargs}

    def async_show_progress(self, **kwargs):
        return {"type": "progress", **kwargs}

    def async_show_progress_done(self, **kwargs):
        return {"type": "progress_done", **kwargs}

    def async_abort(self, **kwargs):
        return {"type": "abort", **kwargs}

    def add_suggested_values_to_schema(self, schema, suggested_values):
        self.suggestions = suggested_values
        return schema


class Coordinator:
    @classmethod
    def __class_getitem__(cls, value):
        return cls

    def __init__(self, hass, logger, **kwargs):
        self.hass = hass
        self.settings = kwargs
        self.last_update_success = True
        self.listeners = []

    def async_set_updated_data(self, value):
        self.data = value
        self.last_update_success = True

    def async_set_update_error(self, error):
        self.last_exception = error
        self.last_update_success = False

    def async_add_listener(self, callback):
        self.listeners.append(callback)
        return lambda: self.listeners.remove(callback)


class CoordinatorEntity:
    @classmethod
    def __class_getitem__(cls, value):
        return cls

    def __init__(self, coordinator, **kwargs):
        self.coordinator = coordinator
        self.write_count = 0

    @property
    def available(self):
        return self.coordinator.last_update_success

    def async_write_ha_state(self):
        self.write_count += 1

    def _handle_coordinator_update(self):
        self.async_write_ha_state()


@dataclass
class CalendarEvent:
    start: date | datetime
    end: date | datetime
    summary: str
    uid: str


class TodoItemStatus(StrEnum):
    NEEDS_ACTION = "needs_action"
    COMPLETED = "completed"


class TodoListEntityFeature(IntFlag):
    UPDATE_TODO_ITEM = 4


@dataclass
class TodoItem:
    summary: str
    uid: str
    status: TodoItemStatus
    due: date | datetime | None = None
    description: str | None = None


def _stubs():
    result = {}

    def add(name, **attributes):
        stub = ModuleType(name)
        stub.__path__ = []
        stub.__dict__.update(attributes)
        result[name] = stub
        return stub

    for name in (
        "homeassistant",
        "homeassistant.components",
        "homeassistant.helpers",
        "homeassistant.util",
    ):
        add(name)
    add(
        "homeassistant.config_entries",
        ConfigEntry=SimpleNamespace,
        ConfigFlow=ConfigFlow,
        ConfigFlowResult=dict,
    )
    add("homeassistant.core", HomeAssistant=SimpleNamespace, callback=lambda fn: fn)
    add(
        "homeassistant.exceptions",
        HomeAssistantError=HomeAssistantError,
        ConfigEntryAuthFailed=ConfigEntryAuthFailed,
    )
    add(
        "homeassistant.helpers.update_coordinator",
        DataUpdateCoordinator=Coordinator,
        CoordinatorEntity=CoordinatorEntity,
        UpdateFailed=UpdateFailed,
    )
    add("homeassistant.helpers.device_registry", DeviceInfo=dict)
    add("homeassistant.helpers.entity_platform", AddEntitiesCallback=object)
    add("homeassistant.components.select", SelectEntity=type("SelectEntity", (), {}))
    add("homeassistant.components.sensor", SensorEntity=type("SensorEntity", (), {}))
    add("homeassistant.components.switch", SwitchEntity=type("SwitchEntity", (), {}))
    add("homeassistant.const", EntityCategory=SimpleNamespace(CONFIG="config"))
    add(
        "homeassistant.components.todo",
        TodoListEntity=type("TodoListEntity", (), {}),
        TodoItem=TodoItem,
        TodoItemStatus=TodoItemStatus,
        TodoListEntityFeature=TodoListEntityFeature,
    )
    add(
        "homeassistant.components.calendar",
        CalendarEntity=type("CalendarEntity", (), {}),
        CalendarEvent=CalendarEvent,
    )
    add("homeassistant.util.dt", now=lambda: datetime.now(UTC))
    add(
        "homeassistant.helpers.aiohttp_client",
        async_create_clientsession=lambda *args, **kwargs: None,
    )
    add(
        "homeassistant.helpers.selector",
        TextSelector=lambda config: config,
        TextSelectorConfig=dict,
        TextSelectorType=SimpleNamespace(URL="url", PASSWORD="password"),
    )
    add("aiohttp", DummyCookieJar=type("DummyCookieJar", (), {}))
    add(
        "probatio",
        Schema=dict,
        Secret=lambda key: ("secret", key),
        Required=lambda key: ("required", key),
        Optional=lambda key, **kwargs: ("optional", key),
    )
    return result


class WiringTests(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        cls.patcher = patch.dict(sys.modules, _stubs())
        cls.patcher.start()
        cls.coordinator_module = module("coordinator")
        cls.select_module = module("select")
        cls.sensor_module = module("sensor")
        cls.calendar_module = module("calendar")
        cls.flow_module = module("config_flow")
        cls.todo_module = module("todo")
        cls.switch_module = module("switch")

    @classmethod
    def tearDownClass(cls):
        cls.patcher.stop()

    def make_coordinator(self, data=None):
        entry = SimpleNamespace(unique_id="household_demo", reauths=0)

        def reauth(hass):
            entry.reauths += 1

        entry.async_start_reauth = reauth
        coord = self.coordinator_module.HearthCoordinator(
            SimpleNamespace(), entry, make_client(Session())
        )
        coord.data = state() if data is None else data
        return coord

    def test_ten_second_coordinator(self):
        self.assertEqual(
            self.make_coordinator().settings["update_interval"], timedelta(seconds=10)
        )

    async def test_module_switch_retains_observed_off_state_and_can_enable_it(self):
        coord = self.make_coordinator()
        coord.data["permissions"]["controlModules"] = True
        coord.data["modules"] = dict.fromkeys(client.MODULE_LABELS, True)
        coord.data["modules"]["games"] = False
        switch = self.switch_module.HearthModuleSwitch(coord, "games")
        coord.async_set_module = AsyncMock()
        self.assertTrue(switch.available)
        self.assertFalse(switch.is_on)
        await switch.async_turn_on()
        coord.async_set_module.assert_awaited_once_with("games", True)
        self.assertFalse(switch.is_on)  # No optimistic update.
        coord.data["modules"]["games"] = True
        self.assertTrue(switch.is_on)
        coord.data["permissions"]["controlModules"] = False
        self.assertFalse(switch.available)
        self.assertIsNone(switch.is_on)
        with self.assertRaises(HomeAssistantError):
            await switch.async_turn_off()

    def test_module_switches_never_inherit_old_grant_authority_and_tabs_filter(self):
        coord = self.make_coordinator()
        switch = self.switch_module.HearthModuleSwitch(coord, "home")
        self.assertFalse(switch.available)
        coord.data["modules"] = dict.fromkeys(client.MODULE_LABELS, False)
        tab = self.select_module.HearthTabSelect(coord, "screen_kitchen")
        self.assertEqual(tab.options, ["today", "more"])
        self.assertIsNone(switch.is_on)

    async def test_module_switch_entities_appear_once_only_after_new_authority(self):
        coord = self.make_coordinator()
        coord.data["modules"] = dict.fromkeys(client.MODULE_LABELS, True)
        entry = SimpleNamespace(runtime_data=coord, async_on_unload=lambda fn: None)
        entities = []
        await self.switch_module.async_setup_entry(
            SimpleNamespace(), entry, entities.extend
        )
        self.assertEqual(entities, [])
        coord.data["permissions"]["controlModules"] = True
        for callback in coord.listeners:
            callback()
            callback()
        self.assertEqual(len(entities), 11)
        self.assertEqual(len({entity._attr_unique_id for entity in entities}), 11)
        self.assertTrue(all(entity.module_id != "nba" for entity in entities))
        coord.data["permissions"]["moduleIds"] = list(client.MODULE_LABELS)
        for callback in coord.listeners:
            callback()
            callback()
        self.assertEqual(len(entities), 14)
        self.assertEqual(len({entity._attr_unique_id for entity in entities}), 14)
        coord.data["permissions"]["controlModules"] = False
        self.assertTrue(all(not entity.available for entity in entities))

    def test_morning_tab_requires_explicit_new_module_approval_and_enabled_state(self):
        coord = self.make_coordinator()
        coord.data["modules"] = dict.fromkeys(client.MODULE_LABELS, True)
        tab = self.select_module.HearthTabSelect(coord, "screen_kitchen")
        self.assertNotIn("morning_routine", tab.options)
        coord.data["permissions"]["moduleIds"] = list(client.MODULE_LABELS)
        self.assertIn("morning_routine", tab.options)
        coord.data["modules"]["morningRoutine"] = False
        self.assertNotIn("morning_routine", tab.options)

    def test_disabled_module_hides_even_previously_cached_entity_content(self):
        coord = self.chore_control()
        coord.data["modules"] = dict.fromkeys(client.MODULE_LABELS, True)
        coord.data["modules"].update(chores=False, calendar=False)
        opened = self.sensor_module.HearthChoreCount(coord, "open")
        todo = self.todo_module.HearthChoresTodo(coord)
        calendar = self.calendar_module.HearthCalendar(coord)
        self.assertFalse(opened.available)
        self.assertIsNone(opened.native_value)
        self.assertEqual(opened.extra_state_attributes, {})
        self.assertIsNone(todo.todo_items)
        self.assertFalse(calendar.available)
        self.assertIsNone(calendar.event)
        self.assertEqual(calendar.extra_state_attributes, {})

    async def test_module_coordinator_refreshes_after_acceptance_and_does_not_optimistically_change(
        self,
    ):
        coord = self.make_coordinator()
        coord.data["permissions"]["controlModules"] = True
        original = coord.data
        coord.client.async_set_module = AsyncMock()
        updated = client.validate_state(state())
        updated["permissions"]["controlModules"] = True
        updated["modules"]["photos"] = False
        coord.client.async_state = AsyncMock(return_value=updated)
        await coord.async_set_module("photos", False)
        coord.client.async_set_module.assert_awaited_once_with("photos", False)
        self.assertIs(coord.data, updated)
        self.assertNotIn("modules", original)

    async def test_module_coordinator_auth_failure_requests_reauth_without_changing_state(
        self,
    ):
        coord = self.make_coordinator()
        coord.data["permissions"]["controlModules"] = True
        coord.client.async_set_module = AsyncMock(
            side_effect=client.HearthAuthError("fixture")
        )
        original = coord.data
        with self.assertRaises(HomeAssistantError):
            await coord.async_set_module("games", False)
        self.assertEqual(coord.entry.reauths, 1)
        self.assertIs(coord.data, original)

    def chore_control(self):
        data = state()
        data["permissions"]["controlChores"] = True
        data["chores"]["localDate"] = (
            datetime.now(ZoneInfo("Australia/Perth")).date().isoformat()
        )
        return self.make_coordinator(data)

    def test_todo_is_opt_in_and_never_turns_failed_or_truncated_data_into_empty(self):
        coord = self.chore_control()
        todo = self.todo_module.HearthChoresTodo(coord)
        self.assertTrue(todo.available)
        self.assertEqual(todo.todo_items[0].summary, "Alex · Feed the dog")
        self.assertEqual(
            todo._attr_supported_features, TodoListEntityFeature.UPDATE_TODO_ITEM
        )
        for change in [
            lambda: coord.data["permissions"].update(controlChores=False),
            lambda: coord.data["chores"].update(truncated=True),
            lambda: coord.data["chores"].update(localDate="2000-01-01"),
            lambda: coord.data.update(chores=None),
            lambda: coord.data.update(generatedAt="2000-01-01T00:00:00Z"),
        ]:
            coord.data = self.chore_control().data
            change()
            self.assertFalse(todo.available)
            self.assertIsNone(todo.todo_items)

    async def test_todo_complete_and_reopen_use_ids_not_titles_without_optimism(self):
        coord = self.chore_control()
        todo = self.todo_module.HearthChoresTodo(coord)
        coord.async_set_chore_completion = AsyncMock()
        original = todo.todo_items[0]
        await todo.async_update_todo_item(
            TodoItem(
                uid=original.uid,
                summary=original.summary,
                status=TodoItemStatus.COMPLETED,
            )
        )
        coord.async_set_chore_completion.assert_awaited_once_with(
            "chore_demo", coord.data["chores"]["localDate"], True, None
        )
        self.assertEqual(todo.todo_items[0].status, TodoItemStatus.NEEDS_ACTION)
        coord.data["chores"]["items"][0].update(
            state="completed", completionId="completion_seen"
        )
        original = todo.todo_items[0]
        await todo.async_update_todo_item(
            TodoItem(
                uid=original.uid,
                summary=original.summary,
                status=TodoItemStatus.NEEDS_ACTION,
            )
        )
        self.assertEqual(
            coord.async_set_chore_completion.await_args.args[-2:],
            (False, "completion_seen"),
        )

    async def test_todo_rejects_edits_unknown_locked_and_skipped_targets(self):
        coord = self.chore_control()
        todo = self.todo_module.HearthChoresTodo(coord)
        coord.async_set_chore_completion = AsyncMock()
        original = todo.todo_items[0]
        for item in [
            TodoItem("Renamed", original.uid, TodoItemStatus.COMPLETED),
            TodoItem(original.summary, "chore_unknown", TodoItemStatus.COMPLETED),
            TodoItem(
                original.summary,
                original.uid,
                TodoItemStatus.COMPLETED,
                description="Edit",
            ),
        ]:
            with self.assertRaises(HomeAssistantError):
                await todo.async_update_todo_item(item)
        for change in [{"locked": True}, {"locked": False, "state": "skipped"}]:
            coord.data["chores"]["items"][0].update(change)
            self.assertEqual(todo.todo_items, [])
            with self.assertRaises(HomeAssistantError):
                await todo.async_update_todo_item(
                    TodoItem(original.summary, original.uid, TodoItemStatus.COMPLETED)
                )
        coord.async_set_chore_completion.assert_not_awaited()

    async def test_chore_coordinator_refreshes_only_after_acceptance_and_handles_revocation(
        self,
    ):
        coord = self.chore_control()
        observed = coord.data
        coord.client.async_set_chore_completion = AsyncMock()
        updated = self.chore_control().data
        updated["chores"]["items"][0].update(
            state="completed", completionId="completion_seen"
        )
        coord.client.async_state = AsyncMock(return_value=updated)
        await coord.async_set_chore_completion(
            "chore_demo", observed["chores"]["localDate"], True, None
        )
        self.assertIs(coord.data, updated)
        coord.client.async_set_chore_completion = AsyncMock(
            side_effect=client.HearthAuthError("Rejected")
        )
        with self.assertRaises(HomeAssistantError):
            await coord.async_set_chore_completion(
                "chore_demo", observed["chores"]["localDate"], True, None
            )
        self.assertEqual(coord.entry.reauths, 1)
        self.assertFalse(coord.last_update_success)

    def test_cold_start_has_only_observed_tab_and_child_device(self):
        coord = self.make_coordinator()
        select = self.select_module.HearthTabSelect(coord, "screen_kitchen")
        self.assertEqual(select.current_option, "today")
        self.assertEqual(select.device_info["via_device"], ("hearth", "household_demo"))
        self.assertEqual(
            select.device_info["identifiers"],
            {("hearth", "household_demo_screen_screen_kitchen")},
        )
        coord.data["screens"][0].update(currentTab=None)
        self.assertFalse(select.available)
        self.assertIsNone(select.current_option)

    async def test_select_receipt_does_not_change_observed_state(self):
        coord = self.make_coordinator()
        select = self.select_module.HearthTabSelect(coord, "screen_kitchen")
        coord.async_navigate = AsyncMock(
            side_effect=HomeAssistantError("No acknowledgement")
        )
        with self.assertRaises(HomeAssistantError):
            await select.async_select_option("chores")
        self.assertEqual(select.current_option, "today")
        coord.async_navigate.assert_awaited_once_with("screen_kitchen", "chores")

    async def test_offline_select_or_nonallowlisted_tab_never_sends_command(self):
        coord = self.make_coordinator()
        select = self.select_module.HearthTabSelect(coord, "screen_kitchen")
        coord.async_navigate = AsyncMock()
        with self.assertRaises(HomeAssistantError):
            await select.async_select_option("admin")
        coord.data["screens"][0]["online"] = False
        with self.assertRaises(HomeAssistantError):
            await select.async_select_option("today")
        coord.async_navigate.assert_not_called()

    def test_counts_have_titles_only_in_attributes_and_signal_truncation(self):
        coord = self.make_coordinator()
        coord.data["chores"]["truncated"] = True
        opened = self.sensor_module.HearthChoreCount(coord, "open")
        completed = self.sensor_module.HearthChoreCount(coord, "completed")
        self.assertEqual(opened.native_value, 3)
        self.assertEqual(completed.native_value, 2)
        self.assertTrue(opened.extra_state_attributes["truncated"])
        self.assertEqual(
            opened.extra_state_attributes["items"][0]["title"], "Feed the dog"
        )
        self.assertNotIn("items", completed.extra_state_attributes)

    def test_optional_data_failures_leave_select_available(self):
        for enabled in (True, False):
            coord = self.make_coordinator()
            coord.data["permissions"] = {
                "shareChores": enabled,
                "shareCalendar": enabled,
            }
            coord.data["chores"] = coord.data["calendar"] = None
            opened = self.sensor_module.HearthChoreCount(coord, "open")
            calendar = self.calendar_module.HearthCalendar(coord)
            self.assertFalse(opened.available)
            self.assertIsNone(opened.native_value)
            self.assertEqual(opened.extra_state_attributes, {})
            self.assertFalse(calendar.available)
            self.assertIsNone(calendar.event)
            self.assertTrue(
                self.select_module.HearthTabSelect(coord, "screen_kitchen").available
            )

    def test_stale_calendar_available_offline_calendar_unavailable(self):
        coord = self.make_coordinator()
        calendar = self.calendar_module.HearthCalendar(coord)
        coord.data["calendar"]["freshness"] = "stale"
        self.assertTrue(calendar.available)
        self.assertEqual(calendar.extra_state_attributes["freshness"], "stale")
        coord.data["calendar"]["freshness"] = "offline"
        self.assertFalse(calendar.available)
        self.assertIsNone(calendar.event)

    async def test_calendar_event_types_sorting_and_exclusive_query_edges(self):
        coord = self.make_coordinator()
        calendar = self.calendar_module.HearthCalendar(coord)
        zone = ZoneInfo("Australia/Perth")
        start = datetime(2026, 10, 15, tzinfo=zone)
        end = datetime(2026, 10, 16, tzinfo=zone)
        all_day = event(all_day=True)
        timed = {
            **event(event_id="event_two"),
            "start": "2026-10-15T09:00:00+08:00",
            "end": "2026-10-15T10:00:00+08:00",
        }
        before = {
            **event(event_id="event_before"),
            "start": "2026-10-14T15:00:00Z",
            "end": "2026-10-14T16:00:00Z",
        }
        after = {
            **event(event_id="event_after"),
            "start": "2026-10-15T16:00:00Z",
            "end": "2026-10-15T17:00:00Z",
        }
        coord.async_calendar = AsyncMock(
            return_value={
                "freshness": "stale",
                "events": [after, timed, before, all_day],
            }
        )
        events = await calendar.async_get_events(SimpleNamespace(), start, end)
        self.assertEqual([item.uid for item in events], ["event_one", "event_two"])
        self.assertIs(type(events[0].start), date)
        self.assertEqual(events[0].end, date(2026, 10, 16))
        self.assertIsInstance(events[1].start, datetime)
        self.assertEqual(events[1].start.utcoffset(), timedelta(hours=8))
        self.assertEqual(calendar.extra_state_attributes["range_freshness"], "stale")

    async def test_calendar_errors_make_entity_unavailable_and_never_empty(self):
        coord = self.make_coordinator()
        calendar = self.calendar_module.HearthCalendar(coord)
        coord.async_calendar = AsyncMock(
            side_effect=HomeAssistantError("Incomplete calendar")
        )
        start = datetime(2026, 10, 15, tzinfo=UTC)
        with self.assertRaises(HomeAssistantError):
            await calendar.async_get_events(
                SimpleNamespace(), start, start + timedelta(days=1)
            )
        self.assertFalse(calendar.available)
        self.assertIsNone(calendar.event)
        self.assertGreater(calendar.write_count, 0)
        calendar._handle_coordinator_update()
        self.assertTrue(calendar.available)

    async def test_coordinator_401_requires_reauth(self):
        coord = self.make_coordinator()
        coord.client = make_client(Session(Response({}, status=401)))
        with self.assertRaises(ConfigEntryAuthFailed):
            await coord._async_update_data()
        coord.client = SimpleNamespace(
            async_navigate_and_wait=AsyncMock(
                side_effect=client.HearthAuthError("Rejected")
            )
        )
        with self.assertRaises(HomeAssistantError):
            await coord.async_navigate("screen_kitchen", "today")
        self.assertEqual(coord.entry.reauths, 1)
        self.assertFalse(coord.last_update_success)

    async def test_poll_transport_failure_is_update_failure(self):
        coord = self.make_coordinator()
        coord.client = make_client(Session(OSError(KEY)))
        with self.assertRaises(UpdateFailed) as raised:
            await coord._async_update_data()
        self.assertNotIn(KEY, str(raised.exception))

    async def test_new_screens_added_once_removed_screen_unavailable(self):
        coord = self.make_coordinator()
        entry = SimpleNamespace(runtime_data=coord, async_on_unload=lambda fn: None)
        entities = []
        await self.select_module.async_setup_entry(
            SimpleNamespace(), entry, entities.extend
        )
        for callback in coord.listeners:
            callback()
        self.assertEqual(len(entities), 1)
        coord.data["screens"] = [{**coord.data["screens"][0], "id": "screen_new"}]
        for callback in coord.listeners:
            callback()
        self.assertEqual(len(entities), 2)
        self.assertFalse(entities[0].available)
        self.assertTrue(entities[1].available)

    async def test_config_flow_uniqueness_and_reauth_household_check(self):
        const = module("const")
        data = {
            const.CONF_URL: "https://hearth.invalid",
            const.CONF_AUTOMATION_KEY: KEY,
        }

        async def completed():
            return {"id": "household_demo", "name": "Demo"}, data

        flow = self.flow_module.HearthConfigFlow()
        flow._pairing_task = asyncio.create_task(completed())
        await flow._pairing_task
        result = await flow.async_step_finish()
        self.assertEqual(result["type"], "create_entry")
        self.assertEqual(flow.unique_id, "household_demo")
        flow.existing_ids.add("household_demo")
        flow._pairing_task = asyncio.create_task(completed())
        await flow._pairing_task
        with self.assertRaisesRegex(AbortFlow, "already_configured"):
            await flow.async_step_finish()
        flow._reauth = True
        flow.entry = SimpleNamespace(unique_id="different_house", data=data)
        flow._pairing_task = asyncio.create_task(completed())
        await flow._pairing_task
        with self.assertRaisesRegex(AbortFlow, "unique_id_mismatch"):
            await flow.async_step_finish()
        self.assertFalse(hasattr(flow, "update"))

    async def test_flow_errors_and_forms_never_offer_or_echo_a_key(self):
        flow = self.flow_module.HearthConfigFlow()
        const = module("const")
        data = {const.CONF_URL: "https://hearth.invalid"}
        for error, expected in (
            (client.HearthConnectionError(KEY), "cannot_connect"),
            (client.HearthProtocolError(KEY), "invalid_bridge"),
        ):
            flow._start = AsyncMock(side_effect=error)
            result = await flow.async_step_user(data)
            self.assertEqual(result["errors"]["base"], expected)
            self.assertNotIn(KEY, repr(result))
            self.assertNotIn(const.CONF_AUTOMATION_KEY, repr(result))
        flow.entry = SimpleNamespace(unique_id="household_demo", data=data)
        result = await flow.async_step_reauth_confirm()
        self.assertNotIn(const.CONF_AUTOMATION_KEY, repr(result))
        self.assertNotIn(const.CONF_AUTOMATION_KEY, flow.suggestions)

    async def test_flow_creates_hidden_random_credential_cookie_free_and_cleans_up(
        self,
    ):
        const = module("const")
        flow = self.flow_module.HearthConfigFlow()
        pairing = {
            "id": "pairing_fixture",
            "code": "ABCDEF",
            "expiresAt": datetime.now(UTC).isoformat(),
            "interval": 3,
        }
        session = Session(Response(pairing))
        session.detach = lambda: setattr(session, "detached", True)

        async def wait(*args):
            await asyncio.Future()

        with (
            patch.object(
                self.flow_module, "async_create_clientsession", return_value=session
            ) as factory,
            patch.object(client.HearthClient, "async_wait_for_pairing", new=wait),
        ):
            result = await flow.async_step_user(
                {const.CONF_URL: "https://hearth.invalid/"}
            )
            self.assertEqual(result["type"], "progress")
            self.assertEqual(result["description_placeholders"], {"code": "ABCDEF"})
            generated = session.calls[0][2]["json"]["secret"]
            self.assertRegex(generated, r"^ha_[A-Za-z0-9_-]{43}$")
            self.assertNotEqual(generated, KEY)
            self.assertNotIn(generated, repr(result))
            self.assertNotIn("Authorization", session.calls[0][2]["headers"])
            self.assertTrue(factory.call_args.kwargs["verify_ssl"])
            self.assertFalse(factory.call_args.kwargs["trust_env"])
            self.assertIn("cookie_jar", factory.call_args.kwargs)
            task = flow._pairing_task
            await asyncio.sleep(0)
            again = await flow.async_step_pair()
            self.assertIs(again["progress_task"], task)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
            self.assertTrue(session.detached)
            result = await flow.async_step_finish()
            self.assertEqual(result["reason"], "pairing_failed")

    async def test_flow_finishes_progress_and_detaches_after_approval_or_failure(self):
        for failure in (False, True):
            flow = self.flow_module.HearthConfigFlow()
            session = Session(
                Response(
                    {
                        "id": "pairing_fixture",
                        "code": "ABCDEF",
                        "expiresAt": datetime.now(UTC).isoformat(),
                        "interval": 3,
                    }
                )
            )
            session.detach = lambda owned=session: setattr(owned, "detached", True)
            with (
                patch.object(
                    self.flow_module, "async_create_clientsession", return_value=session
                ),
                patch.object(
                    client.HearthClient,
                    "async_wait_for_pairing",
                    new=AsyncMock(
                        side_effect=client.HearthProtocolError("Failed")
                        if failure
                        else None,
                        return_value=state(),
                    ),
                ),
            ):
                await flow.async_step_user({"url": "https://hearth.invalid"})
                await asyncio.gather(flow._pairing_task, return_exceptions=True)
                self.assertEqual(
                    (await flow.async_step_pair())["type"], "progress_done"
                )
                result = await flow.async_step_finish()
                self.assertEqual(result["type"], "abort" if failure else "create_entry")
                self.assertTrue(session.detached)


if __name__ == "__main__":
    unittest.main()
