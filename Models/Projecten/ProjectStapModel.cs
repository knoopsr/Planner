namespace Models.Projecten
{
    public class ProjectStapModel
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int VolgNr { get; set; }
        public string Naam { get; set; }
        public string Status { get; set; }
        public DateTime? StartDatum { get; set; }
        public DateTime? EindDatum { get; set; }
    }
}