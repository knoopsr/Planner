namespace Models.SchedulerPro
{
    public class UnplannedDropPayloadDto
    {
        public int ResourceId { get; set; }
        public List<SchedulerEventDto> Events { get; set; } = new();
    }
}