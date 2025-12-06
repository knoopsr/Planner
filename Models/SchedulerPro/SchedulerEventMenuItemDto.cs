namespace Models.SchedulerPro
{
    public class SchedulerEventMenuItemDto
    {
        public string Id { get; set; } = "";       // unieke key in Bryntum
        public string Type { get; set; } = "item"; // "item" of "separator"
        public string? Text { get; set; }
        public string? Icon { get; set; }

        public string? ActionId { get; set; }      // wat je aan C# doorgeeft
        public bool AlignBottom { get; set; }      // optioneel, als je later iets speciaals wil

        // optionele flags, om in JS te gebruiken in processItems(...)
        public bool OnlyWhenLocked { get; set; }
        public bool OnlyWhenUnlocked { get; set; }

        // NIEUW: lijn boven dit item
        public bool SeparatorAbove { get; set; }
    }
}