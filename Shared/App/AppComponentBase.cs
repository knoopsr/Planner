using DevExpress.Blazor;
using Microsoft.AspNetCore.Components;

namespace BlazorApp1.Shared.App
{
    public abstract class AppComponentBase : ComponentBase
    {
        [Inject]
        protected IToastNotificationService ToastService { get; set; } = default!;

        protected void ShowSuccessToast(string message, string? title = null)
            => ToastService.ShowToast(new ToastOptions
            {
                Title = title ?? "Gelukt",
                Text = message,
                RenderStyle = ToastRenderStyle.Success,
                ThemeMode = ToastThemeMode.Auto
            });

        protected void ShowErrorToast(string message, string? title = null)
            => ToastService.ShowToast(new ToastOptions
            {
                Title = title ?? "Fout",
                Text = message,
                RenderStyle = ToastRenderStyle.Danger,
                ThemeMode = ToastThemeMode.Auto
            });

        protected void ShowInfoToast(string message, string? title = null)
            => ToastService.ShowToast(new ToastOptions
            {
                Title = title ?? "Info",
                Text = message,
                RenderStyle = ToastRenderStyle.Info,
                ThemeMode = ToastThemeMode.Auto
            });

        protected void ShowWarningToast(string message, string? title = null)
            => ToastService.ShowToast(new ToastOptions
            {
                Title = title ?? "Opgelet",
                Text = message,
                RenderStyle = ToastRenderStyle.Warning,
                ThemeMode = ToastThemeMode.Auto
            });
    }
}
