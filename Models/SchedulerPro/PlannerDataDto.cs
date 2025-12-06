namespace Models.SchedulerPro
{
    public class PlannerDataDto
    {
        public List<WorkTypeDto> WorkTypes { get; set; } = new();
        public List<ResourceDto> Resources { get; set; } = new();
        public List<SchedulerEventDto> Events { get; set; } = new();
        public List<SchedulerCalendarDto>? Calendars { get; set; } = new();
        public List<SchedulerResourceTimeRangeDto>? ResourceTimeRanges { get; set; } = new();
    }
}