using BlazorApp1;
using DataService;
using DataService.Klanten;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

// ApiOptions uit config binden
builder.Services.Configure<ApiOptions>(options =>
{
    builder.Configuration.GetSection("Api").Bind(options);
});

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddDevExpressBlazor();

// Algemene HttpClient (zonder BaseAddress op de host-app forceren)
builder.Services.AddScoped(sp => new HttpClient());

// KlantenService registreren voor DI
builder.Services.AddScoped<IKlantenService, KlantenService>();

await builder.Build().RunAsync();
