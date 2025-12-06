using Models.SchedulerPro;

namespace BlazorApp1.Helper
{
    public static class SchedulerTooltipBuilder
    {
        public static void FillTooltip(
            SchedulerEventDto e,
            ResourceDto? resource,
            IEnumerable<WorkTypeDto> allWorkTypes)
        {
            // Header
            e.TooltipHeader = string.IsNullOrWhiteSpace(e.Name)
                ? $"Project {e.ProjectId}"
                : e.Name;

            // Start / eind
            var startTxt = e.StartDate.HasValue
                ? e.StartDate.Value.ToString("ddd dd/MM HH:mm")
                : "";
            var endTxt = e.EndDate.HasValue
                ? e.EndDate.Value.ToString("ddd dd/MM HH:mm")
                : "";

            // Werktypes van deze resource (optioneel)
            string workTypesTxt = "";
            if (resource?.WorkTypeIds is { Count: > 0 })
            {
                var names = allWorkTypes
                    .Where(w => resource.WorkTypeIds.Contains(w.Id))
                    .Select(w => w.Name);
                workTypesTxt = string.Join(", ", names);
            }

            // Body in “neutrale” tekst met \n
            e.TooltipBody =
                $"Project: {e.ProjectId}\n" +
                (!string.IsNullOrEmpty(workTypesTxt) ? $"Werktypes: {workTypesTxt}\n" : "") +
                (startTxt != "" ? $"Van: {startTxt}\n" : "") +
                (endTxt != "" ? $"Tot: {endTxt}\n" : "");
        }
    }

}