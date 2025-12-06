using Microsoft.Extensions.Options;
using Models.Klanten;
using System.Net.Http.Json;
using DataService; 

namespace DataService.Klanten
{
    public class KlantenService : IKlantenService
    {
        private readonly HttpClient _http;

        public KlantenService(HttpClient http, IOptions<ApiOptions> options)
        {
            _http = http;

            var opt = options.Value;
            var baseUrl = opt.UseDev ? opt.BaseUrlDev : opt.BaseUrlProd;

            // Altijd BaseAddress op je API zetten
            _http.BaseAddress = new Uri(baseUrl);
            _http.Timeout = TimeSpan.FromSeconds(opt.TimeoutSeconds);
            _http.DefaultRequestHeaders.UserAgent.ParseAdd("Planner-Web/1.0");
            _http.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        }

        public async Task<List<KlantenModel>> GetAll(CancellationToken ct = default)
        {
            var response = await _http.GetAsync("api/klanten", ct);
            response.EnsureSuccessStatusCode();

            var result = await response.Content
                .ReadFromJsonAsync<List<KlantenModel>>(cancellationToken: ct);

            return result ?? new();
        }

        public async Task<KlantenModel?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            var response = await _http.GetAsync($"api/klanten/{id}", ct);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content
                .ReadFromJsonAsync<KlantenModel>(cancellationToken: ct);
        }

        public async Task<KlantenModel?> UpdateAsync(KlantenModel klant, CancellationToken ct = default)
        {
            // Ik ga uit van een REST-achtige endpoint:
            // PUT api/klanten/{id}
            var response = await _http.PutAsJsonAsync($"api/klanten/{klant.Id}", klant, ct);

            if (!response.IsSuccessStatusCode)
            {
                // hier kan je nog logging doen of exceptions gooien
                return null;
            }

            return await response.Content.ReadFromJsonAsync<KlantenModel>(cancellationToken: ct);
        }



    }
}
