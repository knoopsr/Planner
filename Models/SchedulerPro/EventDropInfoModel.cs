namespace Models.SchedulerPro
{
    public class EventDropInfo
    {
        public int Id { get; set; }

        public DateTime OldStartDate { get; set; }
        public DateTime OldEndDate { get; set; }
        public int? OldResourceId { get; set; }

        public DateTime NewStartDate { get; set; }
        public DateTime NewEndDate { get; set; }
        public int? NewResourceId { get; set; }
    }

}