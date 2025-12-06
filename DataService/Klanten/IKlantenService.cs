using Models.Klanten;

namespace DataService.Klanten
{
    public interface IKlantenService
    {
        Task<List<KlantenModel>> GetAll(CancellationToken ct = default);
        Task<KlantenModel?> GetByIdAsync(int id, CancellationToken ct = default);

        Task<KlantenModel?> UpdateAsync(KlantenModel klant, CancellationToken ct = default);

    }
}
