using BlazorApp1.Helper;
using BlazorApp1.Shared;
using Models.SchedulerPro;
using System.Net.Http.Json;

namespace BlazorApp1.Pages.Planner
{
    public partial class Planner
    {





     

        private List<SchedulerEventMenuItemDto> EventMenu = new()
        {
            new SchedulerEventMenuItemDto
            {
                Id       = "openProject",
                Type     = "item",
                Text     = "Project openen",
                Icon     = "fa-solid fa-folder-open",
                ActionId = "OpenProject"
            },
            new SchedulerEventMenuItemDto
            {
                Id             = "lockEvent",
                Type           = "item",
                Text           = "Vergrendel",
                Icon           = "b-icon b-icon-lock",
                ActionId       = "Lock",
                OnlyWhenUnlocked = true,
                    SeparatorAbove = true
            },
            new SchedulerEventMenuItemDto
            {
                Id             = "unlockEvent",
                Type           = "item",
                Text           = "Ontgrendel",
                Icon           = "b-icon b-icon-unlock",
                ActionId       = "Unlock",
                OnlyWhenLocked = true
            },
            new SchedulerEventMenuItemDto
            {
                Id       = "deleteEvent",
                Type     = "item",
                Text     = "Verwijder",
                Icon     = "fa-solid fa-trash",
                ActionId = "Delete"
            }
        };
















        protected override async Task OnInitializedAsync()
        {
            try
            {
                var data = await Http.GetFromJsonAsync<PlannerDataDto>("data/planner-sample.json");

                if (data is not null)
                {
                    WorkTypes = data.WorkTypes ?? new();
                    Resources = data.Resources ?? new();
                    Events = data.Events ?? new();
                    Calendars = data.Calendars ?? new();
                    ResourceTimeRanges = data.ResourceTimeRanges ?? new();

                    foreach (var ev in Events)
                    {
                        var res = Resources.FirstOrDefault(r => r.Id == ev.ResourceId);
                        SchedulerTooltipBuilder.FillTooltip(ev, res, WorkTypes);
                    }
                }
                Console.WriteLine($"Loaded: {WorkTypes.Count} worktypes, {Resources.Count} resources, {Events.Count} events");
            }
            catch (Exception ex)
            {
                Console.WriteLine("FOUT bij laden planner-sample.json:");
                Console.WriteLine(ex);
            }
            _isLoaded = true;
        }

        private async Task SchedulerReady()
        {
            if (Scheduler is null) return;
            await Scheduler.RecalcHeightAsync();
        }







        private Task HandleEventClick(SchedulerEventDto e)
        {
            SelectedEvent = e;
            StateHasChanged();
            return Task.CompletedTask;
        }

        private Task HandleEventDblClick(SchedulerEventDto e)
        {
            // hier kan je bv. naar /project/{id} navigeren
            Console.WriteLine($"Dubbelklik op event {e.Id} (Project {e.ProjectId})");
            return Task.CompletedTask;
        }

        private Task HandleEventAdded(List<SchedulerEventDto> nieuweEvents)
        {
            Console.WriteLine($"Toegevoegd in scheduler: {nieuweEvents.Count} events");
            return Task.CompletedTask;
        }

        private Task HandleEventUpdated(SchedulerEventDto e)
        {
            // Bryntum stuurt soms een "tussen-update" waar nog niet alles is ingevuld.
            // Die slaan we gewoon over om ruis te vermijden.
            if (!e.StartDate.HasValue || !e.EndDate.HasValue || !e.Duration.HasValue)
                return Task.CompletedTask;

            Console.WriteLine(
                $"Event {e.Id} aangepast, nieuwe periode: {e.StartDate} - {e.EndDate} " +
                $"TotalHours: {e.TotalHours} Duration: {e.Duration} ResourceId: {e.ResourceId}"
            );

            return Task.CompletedTask;
        }

        private Task HandleEventRemoved(List<int> ids)
        {
            // gebruiker heeft event(s) verwijderd in Bryntum
            Console.WriteLine($"Verwijderd ids: {string.Join(",", ids)}");
            return Task.CompletedTask;
        }

        private async Task NieuwEventToevoegen()
        {
            if (Scheduler is null) return;

            var nieuw = new SchedulerEventDto
            {
                Id = 999, // in echte app: id van DB
                Name = "Nieuw project (C#)",
                ResourceId = 1,
                StartDate = new DateTime(2025, 1, 10),
                EndDate = new DateTime(2025, 1, 12),
                ProjectId = 999
            };

            // direct in de planner zetten, zonder alles te refreshen
            await Scheduler.AddEventAsync(nieuw);
        }




        private Task HandleEventDragStart(EventDragPayloadDto payload)
        {
            return Task.CompletedTask;
        }
        private async Task HandleEventDrag(EventDragPayloadDto payload)
        {
            if (Scheduler is null) return;

            var moved = payload.Events[0].Id;
            var movedLocal = Events.FirstOrDefault(e => e.Id == moved);
            if (movedLocal is null) return;

            await Task.CompletedTask;
        }



        private async Task HandleEventDrop(EventDropDto payload)
        {
            if (Scheduler is null) return;

            var moved = payload.MovedEvent;
            var movedLocal = Events.FirstOrDefault(e => e.Id == moved.Id);
            if (movedLocal is null) return;

            // Update basistijden van movedLocal (zodat checks kloppen)
            movedLocal.ResourceId = moved.ResourceId;
            movedLocal.StartDate = moved.StartDate;
            movedLocal.EndDate = moved.EndDate;

            // Pak alle events van dezelfde resource
            var sameResource = Events
                .Where(e => e.ResourceId == movedLocal.ResourceId)
                .ToList();

            foreach (var ev in sameResource)
            {
                // heeft deze event een overlap met een andere?
                var hasOverlap = sameResource.Any(other =>
                    other.Id != ev.Id &&
                    other.StartDate < ev.EndDate &&
                    other.EndDate > ev.StartDate
                );

                ev.IsDubbel = hasOverlap;
            }


            var tasks = sameResource.Select(e => Scheduler.UpdateEventAsync(e));
            await Task.WhenAll(tasks);

            StateHasChanged();
        }






        private Task HandleUnplannedDrop(UnplannedDropPayloadDto payload)
        {
            foreach (var ev in payload.Events)
            {
                Console.WriteLine($"Unplanned drop: event {ev.Id} -> resource {payload.ResourceId}");
                // hier later: DB updaten
            }
            return Task.CompletedTask;
        }





        private async Task HandleEventMenuClick(EventMenuClickDto dto)
        {
            if (Scheduler is null)
                return;

            var eventModel = Events.FirstOrDefault(e => e.Id == dto.EventId);
            if (eventModel is null)
                return;

            var needsUpdate = false;

            switch (dto.Action)
            {
                case "OpenProject":
                    // NavigationManager.NavigateTo($"/project/{dto.ProjectId}");
                    // Geen update naar scheduler nodig
                    return;

                case "Lock":
                    eventModel.IsLocked = true;
                    needsUpdate = true;
                    break;

                case "Unlock":
                    eventModel.IsLocked = false;
                    needsUpdate = true;
                    break;

                case "Delete":

                    Events.Remove(eventModel);

                    await Scheduler.RemoveEventAsync(eventModel.Id);
                    return;
            }

            if (needsUpdate)
            {
                await Scheduler.UpdateEventAsync(eventModel);
            }
        }




        private async Task ReloadPlanningAsync()
        {
            if (Scheduler is null) return;


            try
            {
                await Scheduler.RecalcHeightAsync();

                // optioneel: events nog eens ophalen uit JS, zodat Start/End altijd
                // exact gelijklopen met wat Bryntum denkt:
                var jsEvents = await Scheduler.GetEventsAsync();
                foreach (var jsEv in jsEvents)
                {
                    var local = Events.FirstOrDefault(x => x.Id == jsEv.Id);
                    if (local is null) continue;

                    local.StartDate = jsEv.StartDate;
                    local.EndDate = jsEv.EndDate;
                    local.ResourceId = jsEv.ResourceId;
                }

                await RecalculateAllDurationsAsync();
            }
            finally
            {

            }
        }

        private Task HandleSchedulerNotification(SchedulerNotificationDto dto)
        {
            // Kies titel + tekst op basis van Code
            var (title, text) = dto.Code switch
            {
                "DragBlocked.Locked" => (
                    "Vergrendeld",
                    "Dit event is vergrendeld en kan niet verplaatst worden."
                ),

                // toekomstige codes:
                // "Overlap.Warning" => ("Dubbel geboekt", "Er is een overlap met een andere planning."),

                _ when !string.IsNullOrWhiteSpace(dto.Message) => (
                    "Planner",
                    dto.Message!
                ),

                _ => ("Planner", "Onbekende melding.")
            };

            // Kies toast type op basis van Level
            switch (dto.Level)
            {
                case "Error":
                    ShowErrorToast(text, title);
                    break;
                case "Warning":
                    ShowInfoToast(text, title); // of aparte ShowWarningToast als je die maakt
                    break;
                default:
                    ShowInfoToast(text, title);
                    break;
            }

            return Task.CompletedTask;
        }



        private async Task RecalculateAllDurationsAsync()
        {
            if (Scheduler is null) return;

            var tasks = new List<Task>();

            foreach (var ev in Events)
            {
                if (!ev.ResourceId.HasValue) continue;
                if (!ev.StartDate.HasValue) continue;

                // Als TotalHours nog niet gezet is (veel van je JSON-events hebben geen totalHours),
                // dan initialiseren we hem één keer op basis van de huidige duur.
                if (!ev.TotalHours.HasValue || ev.TotalHours <= 0)
                {
                    if (ev.EndDate.HasValue)
                    {
                        var rawHours = (ev.EndDate.Value - ev.StartDate.Value).TotalHours;
                        ev.TotalHours = (int)Math.Round(rawHours);
                    }
                    else
                    {
                        ev.TotalHours = 8; // fallback
                    }
                }

                var res = Resources.FirstOrDefault(r => r.Id == ev.ResourceId.Value);
                if (res is null) continue;

                var factor = res.CrewFactor;
                if (factor <= 0) factor = 1;

                // echte duur in kalender-uren
                var effectiveDuration = ev.TotalHours.Value / factor;

                ev.DurationUnit = "hour";
                ev.Duration = effectiveDuration;

                Console.WriteLine(
                    $"Recalc event {ev.Id}: Start={ev.StartDate} TotalHours={ev.TotalHours} CrewFactor={factor} Duration={effectiveDuration}");

                // Dit stuurt de nieuwe Duration (en andere properties) naar Bryntum
                tasks.Add(Scheduler.UpdateEventAsync(ev));
            }

            await Task.WhenAll(tasks);
        }
    }
}
