namespace Models.SchedulerPro
{
    public class SchedulerToolbarItemDto
    {
        public string Type { get; set; } = "button"; // "button", "spacer", "separator"
        public string? Ref { get; set; }
        public string? Icon { get; set; }
        public string? Text { get; set; }
        public string? Tooltip { get; set; }

        // Actie-id naar C# (OnHeaderButtonClick)
        public string? ActionId { get; set; }

        // Optioneel: uitlijning rechts
        public bool AlignRight { get; set; }

    }
}