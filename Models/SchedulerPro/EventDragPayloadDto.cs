namespace Models.SchedulerPro
{
    public class EventDragPayloadDto
    {
        public List<SchedulerEventDto> Events { get; set; } = new();
        public DragContextDto Ctx { get; set; } = new();
    }
}