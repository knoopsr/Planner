using Models.SchedulerPro;

namespace BlazorApp1.Pages.Planner
{
    public partial class Planner
    {



        private async Task ApplyResourceFilterAsync()
        {
            if (Scheduler is null) return;

            // Start met alle resources
            IEnumerable<ResourceDto> query = Resources;

            // 1) Filter op naam
            if (!string.IsNullOrWhiteSpace(ResourceSearchText))
            {
                var term = ResourceSearchText.Trim().ToLowerInvariant();
                query = query.Where(r => r.Name?.ToLowerInvariant().Contains(term) == true);
            }

            // 2) Filter op werktypes
            if (SelectedWorkTypeIds != null && SelectedWorkTypeIds.Any())
            {
                var selectedSet = SelectedWorkTypeIds.ToHashSet();
                query = query.Where(r => r.WorkTypeIds.Any(id => selectedSet.Contains(id)));
            }

            var visibleResourceIds = query.Select(r => r.Id).ToList();

            // Naar Bryntum sturen
            await Scheduler.ApplyResourceFilterAsync(visibleResourceIds);
        }

        private async Task ApplyEventSearchFilterAsync()
        {
            if (Scheduler is null) return;

            IEnumerable<SchedulerEventDto> query = Events;

            // 1) zoeken op tekst (naam, eventueel projectnaam als je die later toevoegt)
            if (!string.IsNullOrWhiteSpace(EventSearchText))
            {
                var term = EventSearchText.Trim().ToLowerInvariant();

                query = query.Where(e =>
                    (!string.IsNullOrEmpty(e.Name) && e.Name.ToLowerInvariant().Contains(term))
                // als je later extra velden hebt:
                // || (!string.IsNullOrEmpty(e.ProjectName) && e.ProjectName.ToLowerInvariant().Contains(term))
                );
            }

            // 2) optioneel: filter op ProjectId
            if (SelectedProjectIdForEvents.HasValue)
            {
                var pid = SelectedProjectIdForEvents.Value;
                query = query.Where(e => e.ProjectId == pid);
            }

            var visibleEventIds = query.Select(e => e.Id).ToList();

            // Naar Bryntum sturen
            await Scheduler.ApplyEventFilterAsync(visibleEventIds);
        }



        private Task OpenFilterPopup()
        {
            IsFilterPopupVisible = true;

            return Task.CompletedTask;
        }

        private void CloseFilterPopup()
        {
            IsFilterPopupVisible = false;
        }


    }
}
