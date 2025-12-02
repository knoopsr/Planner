
using System.ComponentModel.DataAnnotations;
namespace Models.Klanten
{
    public class KlantenModel
    {
   
        public int Id { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "Naam is een verplicht veld.")]
        [StringLength(100, ErrorMessage = "Naam mag maximaal 100 tekens lang zijn.")]
        public string Naam { get; set; } = string.Empty;

        public string? Achternaam { get; set; }

        public string? Straat { get; set; }

        public int? Nummer { get; set; }

        public string? Busnummer { get; set; }

        public string? Postcode { get; set; }

        public string? Gemeente { get; set; }

        public string? Land { get; set; }

        public string? Gsm { get; set; }
        [EmailAddress(ErrorMessage = "Geen geldig e-mailadres.")]
        public string? Email { get; set; }
        public bool IsActief { get; set; } = true;




        //override tostring for display purposes

        public override string ToString()
        {
            var achternaamPart = string.IsNullOrWhiteSpace(Achternaam) ? "" : $"{Achternaam}, ";
            return $"{Id} : {achternaamPart}{Naam}";
        }
    }
}
