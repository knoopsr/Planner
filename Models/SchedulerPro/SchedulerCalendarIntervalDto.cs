namespace Models.SchedulerPro
{
    public class SchedulerCalendarIntervalDto
    {
        public string RecurrentStartDate { get; set; } = "";
        public string RecurrentEndDate { get; set; } = "";
        public bool IsWorking { get; set; } = true;
    }
}