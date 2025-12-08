using Models.SchedulerPro;

namespace BlazorApp1.Pages.Planner
{
    public partial class Planner
    {

        private List<SchedulerToolbarItemDto> Toolbar = new()
    {
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnOpenFilter",
            Icon = "b-icon-search",
            Text = "Filter",
            Tooltip = "Toon het Filter Menu",
            ActionId = "FilterMenu"
        },
         new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnPrev",
            Text = "<",
            Tooltip = "Vorige periode",
            ActionId = "NavPrev"
        },
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnToday",
            Text = "Vandaag",
            Tooltip = "Ga naar vandaag",
            ActionId = "NavToday"
        },
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnNext",
            Text = ">",
            Tooltip = "Volgende periode",
            ActionId = "NavNext"
        },

        // View-modus: dag / week / maand
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnViewDay",
            Text = "Dag",
            Tooltip = "Dag-weergave",
            ActionId = "ViewDay"
        },
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnViewWeek",
            Text = "Week",
            Tooltip = "Week-weergave",
            ActionId = "ViewWeek"
        },
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnViewMonth",
            Text = "Maand",
            Tooltip = "Maand-weergave",
            ActionId = "ViewMonth"
        },
        new SchedulerToolbarItemDto
        {
            Type = "spacer",
            AlignRight = true
        },
        new SchedulerToolbarItemDto
        {
            Type = "button",
            Ref = "btnReload",
            Icon = "b-icon-refresh",
            Tooltip = "Planning herladen",
            ActionId = "ReloadPlanning"
        }
    };



        private async Task HandleHeaderButtonClick(string actionId)
        {
            switch (actionId)
            {
                case "FilterMenu":
                    await OpenFilterPopup();
                    break;

                case "ReloadPlanning":
                    await ReloadPlanningAsync();
                    break;

                case "NavPrev":
                    await GoPrevAsync();
                    break;

                case "NavToday":
                    await GoTodayAsync();
                    break;

                case "NavNext":
                    await GoNextAsync();
                    break;

                case "ViewDay":
                    await SetDayViewAsync();
                    break;

                case "ViewWeek":
                    await SetWeekViewAsync();
                    break;

                case "ViewMonth":
                    await SetMonthViewAsync();
                    break;
            }
        }

    }
}
