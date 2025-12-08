using BlazorApp1.Shared;
using BlazorApp1.Shared.App;
using Models.SchedulerPro;

namespace BlazorApp1.Pages.Planner
{
    public partial class Planner 
    {
        private SchedulerPro? Scheduler;

        private List<ResourceDto> Resources = new();
        private List<SchedulerEventDto> Events = new();
        private List<WorkTypeDto> WorkTypes = new();
        private List<SchedulerCalendarDto> Calendars = new();
        private List<SchedulerResourceTimeRangeDto> ResourceTimeRanges = new();

        private enum ViewMode
        {
            Custom,
            Day,
            Week,
            Month
        }



        private DateTime _referenceDate = DateTime.Today;
        private ViewMode _currentViewMode = ViewMode.Week;



        private SchedulerEventDto? SelectedEvent;


        private bool IsFilterPopupVisible;
        private int? SelectedProjectId;

        private DateTime ViewStart = new DateTime(2025, 1, 1);
        private DateTime ViewEnd = new DateTime(2025, 1, 31);

        private DateTime FilterStart = new DateTime(2025, 1, 1);
        private DateTime FilterEnd = new DateTime(2025, 1, 31);


        private string? ResourceSearchText;
        private IEnumerable<int> SelectedWorkTypeIds = new List<int>();

        private string? EventSearchText;
        private int? SelectedProjectIdForEvents;

        private bool _isLoaded;
        private EventDropDto? _pendingConflict;
        private bool _isConflictPopupVisible;


    }
}
