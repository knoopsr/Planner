namespace Models.SchedulerPro
{
    public class SchedulerEventDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int? ResourceId { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int? ProjectId { get; set; }
    }
}