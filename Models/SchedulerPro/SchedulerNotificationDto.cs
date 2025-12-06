namespace Models.SchedulerPro
{
    public class SchedulerNotificationDto
    {
        public string Level { get; set; } = "Info";

        public string Code { get; set; } = string.Empty;

        public string? Message { get; set; }

        public int? EventId { get; set; }
        public int? ResourceId { get; set; }
    }
}