namespace Models.SchedulerPro
{
    public class ResourceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public List<int> WorkTypeIds { get; set; } = new List<int>();
        public string? Calendar { get; set; }

        public double CrewFactor { get; set; } = 1.0;
    }
}