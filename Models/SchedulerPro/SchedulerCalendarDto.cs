namespace Models.SchedulerPro
{
    public class SchedulerCalendarDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string? ParentId { get; set; }

        public bool UnspecifiedTimeIsWorkingTime { get; set; } = false;

        public List<SchedulerCalendarIntervalDto> Intervals { get; set; } = new();
    }
}
