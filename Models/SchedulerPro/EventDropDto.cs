namespace Models.SchedulerPro
{
    public class EventDropDto
    {
        public SchedulerEventDto MovedEvent { get; set; } = default!;
        public List<SchedulerEventDto> Overlaps { get; set; } = new();
        public DragContextDto Ctx { get; set; } = new();
    }
}