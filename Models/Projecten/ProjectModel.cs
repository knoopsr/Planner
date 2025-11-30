namespace Models.Projecten
{
    public class ProjectModel
    {
        public int Id { get; set; }
        public string ProjectNr { get; set; } = "";
        public string Naam { get; set; } = "";
        public string Klant { get; set; } = "";
        public string Status { get; set; } = "";
        public DateTime StartDatum { get; set; }
    }
}