namespace DataService
{
    public class ApiOptions
    {
        public bool UseDev { get; set; } = true;

        public string BaseUrlDev { get; set; } = "https://wpferp.knoopsr.be/";
        public string BaseUrlProd { get; set; } = "https://wpferp.knoopsr.be/";

        public int TimeoutSeconds { get; set; } = 30;
    }
}