namespace Models.SchedulerPro
{
    public class EventMenuClickDto
    {
        public string Action { get; set; } = "";
        public int EventId { get; set; }
        public int? ProjectId { get; set; }
    }
}