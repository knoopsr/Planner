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

        public string? TooltipHeader { get; set; }
        public string? TooltipBody { get; set; }

        public int? TotalHours { get; set; } = 20;

        public double? Duration { get; set; }
        public string DurationUnit { get; set; } = "hour";


        public string EventColor 
        {
            get {
                if (IsDubbel)
                {
                    return DubbelColor;
                }
                else
                {
                    if (IsLocked)
                    {
                        return LockedColor;
                    }
                    
                }


                return NormalColor;
            }
      }

        public string NormalColor { get; set; } = "orange";
        public string DubbelColor { get; set; } = "red";
        public string LockedColor { get; set; } = "green";

        public bool IsDubbel { get; set; }
        public bool IsLocked { get; set; }


    }
}