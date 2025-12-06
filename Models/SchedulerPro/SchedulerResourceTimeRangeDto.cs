namespace Models.SchedulerPro
{
    public class SchedulerResourceTimeRangeDto
    {
        public int Id { get; set; }
        public int ResourceId { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public string? CssClass { get; set; }
        public string? Type { get; set; }   // optional, bv. "NotWorking"
    }
}