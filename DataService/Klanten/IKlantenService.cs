using Models.Klanten;

namespace DataService.Klanten
{
    public interface IKlantenService
    {
        Task<List<KlantenModel>> GetAll(CancellationToken ct = default);
        Task<KlantenModel?> GetKlantByIdAsync(int id, CancellationToken ct = default);
    }
}
