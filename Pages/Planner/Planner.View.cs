namespace BlazorApp1.Pages.Planner
{
    public partial class Planner
    {




        private async Task UpdateTimeSpanForCurrentViewAsync()
        {
            if (Scheduler is null) return;

            switch (_currentViewMode)
            {
                case ViewMode.Day:
                    FilterStart = _referenceDate.Date;
                    FilterEnd = FilterStart.AddDays(1);
                    break;

                case ViewMode.Week:
                    var (ws, we) = GetWeekRange(_referenceDate, workWeekOnly: false);
                    FilterStart = ws;
                    FilterEnd = we;
                    break;

                case ViewMode.Month:
                    FilterStart = new DateTime(_referenceDate.Year, _referenceDate.Month, 1);
                    FilterEnd = FilterStart.AddMonths(1).AddDays(-1);
                    break;

                default: // Custom: zelfde lengte behouden rond referenceDate
                    var span = (FilterEnd - FilterStart).TotalDays;
                    if (span <= 0) span = 7;
                    FilterStart = _referenceDate.Date;
                    FilterEnd = FilterStart.AddDays(span);
                    break;
            }

            await Scheduler.SetTimeSpanAsync(FilterStart, FilterEnd);
        }





        private async Task ApplyDateRangeAsync()
        {
            if (Scheduler is null) return;

            await Scheduler.SetTimeSpanAsync(FilterStart, FilterEnd);
            // eventueel popup sluiten:
            // IsFilterPopupVisible = false;
        }




        private async Task ToonDezeWeek()
        {
            if (Scheduler is null) return;

            var (start, end) = GetWeekRange(DateTime.Today);
            FilterStart = start;
            FilterEnd = end;
            await Scheduler.SetTimeSpanAsync(start, end);
        }

        private async Task ToonVolgendeWeek()
        {
            if (Scheduler is null) return;

            var volgendeWeek = DateTime.Today.AddDays(7);
            var (start, end) = GetWeekRange(volgendeWeek);
            FilterStart = start;
            FilterEnd = end;
            await Scheduler.SetTimeSpanAsync(start, end);
        }

        private async Task ToonDezeMaand()
        {
            if (Scheduler is null) return;

            var vandaag = DateTime.Today;
            var start = new DateTime(vandaag.Year, vandaag.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);

            FilterStart = start;
            FilterEnd = end;

            await Scheduler.SetTimeSpanAsync(start, end);
        }

        private async Task SetDayViewAsync()
        {
            if (Scheduler is null) return;

            _currentViewMode = ViewMode.Day;

            await Scheduler.SetViewPresetAsync("Default");
            await UpdateTimeSpanForCurrentViewAsync();
        }

        private async Task SetWeekViewAsync()
        {
            if (Scheduler is null) return;

            _currentViewMode = ViewMode.Week;

            await Scheduler.SetViewPresetAsync("WorkWeek");
            await UpdateTimeSpanForCurrentViewAsync();
        }


        private (DateTime Start, DateTime End) GetWeekRange(DateTime date, bool workWeekOnly = false)
        {
            var dagVanWeek = (int)date.DayOfWeek; // zondag = 0
            var monday = date.Date.AddDays(-((dagVanWeek + 6) % 7)); // maandag

            if (workWeekOnly)
            {
                return (monday, monday.AddDays(5)); // ma–za (5 = 5 dagen verder, dus tot zaterdag exclusief zondag)
            }

            return (monday, monday.AddDays(7)); // ma–ma (7 dagen bereik)
        }



        private async Task SetMonthViewAsync()
        {
            if (Scheduler is null) return;

            _currentViewMode = ViewMode.Month;

            await Scheduler.SetViewPresetAsync("Maand");
            await UpdateTimeSpanForCurrentViewAsync();
        }


        private async Task ShiftViewAsync(int direction)
        {
            if (Scheduler is null) return;

            switch (_currentViewMode)
            {
                case ViewMode.Day:
                    _referenceDate = _referenceDate.AddDays(direction);
                    break;

                case ViewMode.Week:
                    _referenceDate = _referenceDate.AddDays(7 * direction);
                    break;

                case ViewMode.Month:
                    _referenceDate = _referenceDate.AddMonths(direction);
                    break;

                default:
                    // bv. zelfde als week
                    _referenceDate = _referenceDate.AddDays(7 * direction);
                    break;
            }

            await UpdateTimeSpanForCurrentViewAsync();
        }

        private Task GoPrevAsync() => ShiftViewAsync(-1);
        private Task GoNextAsync() => ShiftViewAsync(1);


        private async Task GoTodayAsync()
        {
            if (Scheduler is null) return;

            _referenceDate = DateTime.Today;
            await UpdateTimeSpanForCurrentViewAsync();
        }



        private async Task ToonWerkweek()
        {
            if (Scheduler is null) return;

            await Scheduler.SetViewPresetAsync("WorkWeek");

            var (start, end) = GetWeekRange(DateTime.Today, workWeekOnly: true);
            FilterStart = start;
            FilterEnd = end;

            await Scheduler.SetTimeSpanAsync(start, end);
        }

        private async Task ToonProjectWeeks()
        {
            if (Scheduler is null) return;

            await Scheduler.SetViewPresetAsync("ProjectWeeks");

            // bv. hele maand van het eerste event
            var minStart = Events
                .Where(e => e.StartDate.HasValue)
                .Min(e => e.StartDate!.Value);

            var start = new DateTime(minStart.Year, minStart.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);

            FilterStart = start;
            FilterEnd = end;

            await Scheduler.SetTimeSpanAsync(start, end);
        }

    }
}
