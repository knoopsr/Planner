// wwwroot/js/bryntumScheduler.js
window.bryntumScheduler = (function () {
    const schedulers = {};

    // Bryntum UMD globals
    const {
        SchedulerPro,
        Grid,
        Splitter,
        DragHelper,
        DateHelper,
        StringHelper,
        DomHelper
    } = bryntum.schedulerpro;


    const viewPresets = {
        // Standaard dag/week
        Default: {
            base: 'hourAndDay',
            tickWidth: 30,
            timeResolution: { unit: 'minute', increment: 30 },
            headers: [
                { unit: 'day', dateFormat: 'ddd DD/MM' },
                { unit: 'hour', dateFormat: 'HH:mm' }
            ],
            shiftUnit: 'day',
            shiftIncrement: 1,
            displayDateFormat: 'DD/MM HH:mm'
        },

        // Werkweek (ma–vr)
        WorkWeek: {
            base: 'hourAndDay',
            tickWidth: 20,
            timeResolution: { unit: 'minute', increment: 15 },
            headers: [
                { unit: 'month', align: 'start', dateFormat: 'MMM yyyy' },
                {
                    unit: 'week',
                    renderer: d => `WK${DateHelper.format(d, 'WW')}`
                },
                {
                    unit: 'day',
                    renderer: d => DateHelper.format(d, 'ddd DD/MM')
                },
                { unit: 'hour', dateFormat: 'HH' }
            ],
            shiftUnit: 'day',
            shiftIncrement: 7,
            displayDateFormat: 'HH:mm'
        },

        // Bijvoorbeeld heel project in weken
        ProjectWeeks: {
            base: 'weekAndDay',
            tickWidth: 40,
            headers: [
                { unit: 'month', dateFormat: 'MMM yyyy' },
                { unit: 'week', dateFormat: 'WW' }
            ],
            shiftUnit: 'week',
            shiftIncrement: 4,
            displayDateFormat: 'DD/MM'
        }
    };





    // ========== Unplanned grid ==========

    class UnplannedGrid extends Grid {
        static $name = 'UnplannedGrid';

        static configurable = {
            selectionMode: { cell: false },
            features: {
                stripe: true,
                sort: 'name'
            },
            columns: [
                { text: 'Project', field: 'name', flex: 1 },
                { text: 'Klant', field: 'client', flex: 1, hidden: true },
                { text: 'Duur', field: 'duration', width: 80 }
            ],
            rowHeight: 40,
            disableGridRowModelWarning: true,
            header: 'Nog te plannen'
        };

        set project(project) {
            const me = this;

            // Alle events zonder assignments in de assignmentStore
            me.store = project.eventStore.chain(ev => {
                const asgs = project.assignmentStore.getAssignmentsForEvent(ev) || [];
                return asgs.length === 0;
            });

            const refilter = () => me.store.fillFromMaster();

            // Wanneer events of assignments veranderen → unplanned opnieuw opbouwen
            project.eventStore.on({ add: refilter, update: refilter, remove: refilter, thisObj: me });
            project.assignmentStore.on({ add: refilter, update: refilter, remove: refilter, thisObj: me });

            // direct 1e keer vullen
            refilter();
        }
    }


    // ========== Drag helper voor unplanned -> scheduler ==========

    class UnplannedDrag extends DragHelper {
        static configurable = {
            callOnFunctions: true,
            autoSizeClonedTarget: false,
            unifiedProxy: true,
            removeProxyAfterDrop: false,
            cloneTarget: true,
            // planner-tijdlijn
            dropTargetSelector: '.b-timeline-sub-grid, .b-timeline-subgrid',
            // rijen in unplanned-grid
            targetSelector: '.b-grid-row:not(.b-group-row)'
        };

        afterConstruct() {
            if (this.schedule?.scrollManager) {
                this.scrollManager = this.schedule.scrollManager;
            }
        }

        createProxy(grabbedElement) {
            const { schedule, grid, context } = this;
            const rec = grid.getRecordFromElement(grabbedElement);
            const proxy = document.createElement('div');

            let widthPx = 120;
            try {
                const px = schedule.timeAxisViewModel.getDistanceForDuration(rec.durationMS);
                if (Number.isFinite(px)) widthPx = px;
            } catch { }

            Object.assign(proxy.style, {
                width: `${widthPx}px`,
                maxWidth: `${schedule.timeAxisSubGrid?.width || 10000}px`,
                height: `${(schedule.rowHeight || 60) - 2 * (schedule.resourceMargin || 2)}px`
            });

            proxy.classList.add('b-bryntum', 'b-sch-event-wrap', 'b-sch-horizontal', 'b-unassigned-class');
            proxy.innerHTML = StringHelper.xss`
                <div class="b-sch-event b-has-content">
                    <div class="b-sch-event-content">${rec.name || ''}</div>
                </div>
            `;

            let totalDuration = 0;
            (grid.selectedRecords || []).forEach(r => totalDuration += (r.duration || 0));
            context.totalDuration = totalDuration;

            return proxy;
        }

        onDragStart({ context }) {
            const { schedule, grid } = this;
            const grabbed = grid.getRecordFromElement(context.grabbed);

            const selected = (grid.selectedRecords && grid.selectedRecords.length)
                ? grid.selectedRecords.slice()
                : (grabbed ? [grabbed] : []);

            context.events = selected;

            const { store } = grid;
            context.relatedElements = (selected || [])
                .sort((a, b) => store.indexOf(a) - store.indexOf(b))
                .map(rec => rec !== grabbed && grid.rowManager.getRowFor(rec)?.element)
                .filter(Boolean);

            try { schedule.enableScrollingCloseToEdges(schedule.timeAxisSubGrid); } catch { }
            if (schedule?.features?.eventTooltip) schedule.features.eventTooltip.disabled = true;
        }

        onDrag({ context }) {
            const { schedule } = this;
            const newStart = schedule.getDateFromCoordinate(context.newX, 'round', false);
            const target = context.target && schedule.resolveResourceRecord(context.target);

            context.valid = Boolean(newStart && target);
            context.resource = target || null;
        }

        async onDrop({ context }) {
            const schedule = this.schedule;
            const { element, relatedElements = [], events = [], resource } = context;

            if (!context.valid || !resource) {
                schedule?.disableScrollingCloseToEdges(schedule.timeAxisSubGrid);
                if (schedule?.features?.eventTooltip) schedule.features.eventTooltip.disabled = false;
                return false;
            }

            const coordinate = DomHelper.getTranslateX(element);
            const dropDate = schedule.getDateFromCoordinate(coordinate, 'round', false);
            if (!dropDate) {
                schedule?.disableScrollingCloseToEdges(schedule.timeAxisSubGrid);
                if (schedule?.features?.eventTooltip) schedule.features.eventTooltip.disabled = false;
                return false;
            }

            const eventBarEls = [element, ...relatedElements];

            for (let i = 0; i < events.length; i++) {
                const ev = events[i];
                await schedule.scheduleEvent({
                    eventRecord: ev,
                    startDate: i === 0 ? dropDate : events[i - 1].endDate,
                    resourceRecord: resource,
                    element: eventBarEls[i]
                });
            }

            schedule?.disableScrollingCloseToEdges(schedule.timeAxisSubGrid);
            if (schedule?.features?.eventTooltip) schedule.features.eventTooltip.disabled = false;

            // C# laten weten welke unplanned items gedropt zijn
            const owner = Object.values(schedulers).find(x => x.scheduler === schedule);
            if (owner?.dotNetRef) {
                owner.dotNetRef.invokeMethodAsync('OnUnplannedDropFromJs', {
                    resourceId: resource.id,
                    events: events.map(toPlainEvent)
                });
            }

            return true;
        }
    }

    // ========== helpers ==========

    function toPlainEvent(eventRecord) {
        if (!eventRecord) return null;

        const rawId = eventRecord.id;
        let numericId = null;

        if (typeof rawId === 'number') {
            numericId = rawId;
        } else if (typeof rawId === 'string') {
            // probeer string → number (bv. "123")
            const parsed = Number(rawId);
            if (Number.isFinite(parsed)) {
                numericId = parsed;
            }
        }

        return {
            id: numericId,  
            name: eventRecord.name,
            resourceId: eventRecord.resourceId,
            startDate: eventRecord.startDate,
            endDate: eventRecord.endDate,
            projectId: eventRecord.projectId ?? null,
            tooltipHeader: eventRecord.tooltipHeader ?? null,
            tooltipBody: eventRecord.tooltipBody ?? null,
            duration: eventRecord.duration ?? null,
            durationUnit: eventRecord.durationUnit ?? null,
            uren: eventRecord.uren ?? null
        };
    }
    function isValidEventForDotNet(ev) {
        return ev && typeof ev.id === 'number' && Number.isFinite(ev.id) && ev.id > 0;
    }
    function toPlainDragContext(context) {
        const res = context.newResource || context.resourceRecord || null;
        return {
            resourceId: res ? res.id : null,
            startDate: context.startDate || null,
            endDate: context.endDate || null
        };
    }
    function buildToolbar(config, dotNetRef) {
        const items = (config && Array.isArray(config.toolbarItems))
            ? config.toolbarItems
            : null;

        if (!items) {
            return []; // of een default toolbar als je wil
        }

        const result = [];

        items.forEach(item => {
            // spacer naar rechts
            if (item.alignRight) {
                result.push('->');
            }

            switch (item.type) {
                case 'spacer':
                    result.push('->');
                    break;

                case 'separator':
                    result.push('|');
                    break;

                case 'button':
                default:
                    result.push({
                        type: 'button',
                        ref: item.ref || undefined,
                        icon: item.icon || null,
                        text: item.text || '',
                        tooltip: item.tooltip || null,
                        onClick: () => {
                            if (dotNetRef && item.actionId) {
                                dotNetRef.invokeMethodAsync(
                                    'OnHeaderButtonClickFromJs',
                                    item.actionId
                                );
                            }
                        }
                    });
                    break;
            }
        });

        return result;
    }
    function buildEventMenuItems(config, dotNetRef) {
        const itemsCfg = (config && Array.isArray(config.eventMenuItems))
            ? config.eventMenuItems
            : null;

        if (!itemsCfg) return null;

        const items = {};

        itemsCfg.forEach(src => {
            const id = src.Id || src.id;
            if (!id) return;

            const type = (src.Type || src.type || 'item');

            // nog steeds: echte separator-items
            if (type === 'separator') {
                items[id] = '-';
                return;
            }

            const text = src.Text || src.text || '';
            const icon = src.Icon || src.icon || null;
            const actionId = src.ActionId || src.actionId || id;
            const onlyWhenLocked = src.OnlyWhenLocked || src.onlyWhenLocked || false;
            const onlyWhenUnlocked = src.OnlyWhenUnlocked || src.onlyWhenUnlocked || false;
            const separatorAbove = src.SeparatorAbove || src.separatorAbove || false;

            items[id] = {
                id,
                text,
                icon,

                // lijn boven dit item
                separator: separatorAbove,

                onlyWhenLocked,
                onlyWhenUnlocked,

                onItem({ eventRecord }) {
                    if (!dotNetRef || !actionId) return;

                    dotNetRef.invokeMethodAsync(
                        'OnEventMenuClickFromJs',
                        {
                            action: actionId,
                            eventId: eventRecord.id,
                            projectId: eventRecord.projectId ?? null
                        }
                    );
                }
            };
        });

        return items;
    }
    function findOverlaps(scheduler, eventRecord) {
        const store = scheduler.eventStore;

        return store.query(ev =>
            ev !== eventRecord &&
            ev.resourceId === eventRecord.resourceId &&
            ev.startDate < eventRecord.endDate &&
            ev.endDate > eventRecord.startDate
        ).map(toPlainEvent);
    }




    function resolveViewPreset(config) {
        // vanuit C# komt bv. config.viewPresetKey = "WorkWeek"
        const key = config && config.viewPresetKey;

        if (key && viewPresets[key]) {
            return viewPresets[key];
        }

        // als C# gewoon een Bryntum string stuurt: "hourAndDay"
        if (typeof key === 'string') {
            return key;
        }

        // fallback
        return viewPresets.Default;
    }


    // ========== init vanuit Blazor ==========

    function init(elementId, config, dotNetRef) {
        const targetEl = document.getElementById(elementId);
        if (!targetEl) {
            console.warn('Element niet gevonden:', elementId);
            return;
        }


        function notify(level, code, message, extra = {}) {
            if (!dotNetRef) return;

            const dto = {
                level: level || 'Info',
                code: code || '',
                message: message || null,
                eventId: extra.eventId ?? null,
                resourceId: extra.resourceId ?? null
            };

            try {
                dotNetRef.invokeMethodAsync('OnNotificationFromJs', dto);
            } catch (e) {
                console.warn('OnNotificationFromJs failed', e);
            }
        }

        function notifyError(code, message, extra) {
            notify('Error', code, message, extra);
        }

        function notifyWarning(code, message, extra) {
            notify('Warning', code, message, extra);
        }

        function notifyInfo(code, message, extra) {
            notify('Info', code, message, extra);
        }



        // layout: scheduler | splitter | unplanned naast elkaar
        targetEl.style.display = 'flex';
        targetEl.style.flexDirection = 'row';
        targetEl.style.width = '100%';
      
        targetEl.style.flex = '1 1 auto';

        function calcHeight() {
            const rect = targetEl.getBoundingClientRect();
            return window.innerHeight - rect.top;
        }

        const scheduler = new SchedulerPro({
            appendTo: targetEl,
            autoHeight: false,
            height: calcHeight(),
            flex: 1,

            eventStyle: 'colored',

            createEventOnDblClick: false,
            createEventOnDrag: false,


            startDate: config.startDate ? new Date(config.startDate) : new Date(),
            endDate: config.endDate ? new Date(config.endDate) : new Date(),

            viewPreset: resolveViewPreset(config), 


            resources: config.resources || [],
            events: config.events || [],

            features: {
                resourceTimeRanges: true,
                nonWorkingTime: true, 
                eventTooltip: {
                    cls: 'mp-event-tooltip',
                    template({ eventRecord }) {
                        const header = eventRecord.tooltipHeader || eventRecord.name || '';
                        const body = eventRecord.tooltipBody || '';

                        return StringHelper.xss`
                            <div class="mp-tip">
                                <div class="mp-tip-header">${header}</div>
                                <div class="mp-tip-body">${body}</div>
                            </div>
                        `;
                    }
                },   
                eventResize: false,
                eventMenu: {
                    // standaard Bryntum items uitzetten
                    items: Object.assign({
                        editEvent: false,
                        deleteEvent: false,
                        unassignEvent: false,
                        copyEvent: false,
                        cutEvent: false,
                        eventColor: false,
                        showDetails: false,
                        splitEvent: false
                    }, buildEventMenuItems(config, dotNetRef) || {}),

          
                    processItems({ items, eventRecord }) {        

                     
                        const isLocked = eventRecord.isLocked === true;

                        Object.values(items).forEach(it => {
                            if (!it || typeof it === 'string') return; // separator

                            if (it.onlyWhenLocked) {
                                it.hidden = !isLocked;
                            } else if (it.onlyWhenUnlocked) {
                                it.hidden = isLocked;
                            } else {
                                it.hidden = false;
                            }
                        });
                    }

                },
                dependencies: {
                    allowCreate: false,
                    allowDropOnEventBar: false
                }
       
            },

            project: {
                calendar: 'general',
                calendarManagerStore: {
                    data: (config.calendars && config.calendars.length)
                        ? config.calendars
                        : [
                            {
                                id: 'general',
                                name: 'Standaard',
                                intervals: [
                                    {
                                        recurrentStartDate: 'on Mon at 08:00',
                                        recurrentEndDate: 'on Fri at 16:00',
                                        isWorking: true
                                    },
                                    {
                                        recurrentStartDate: 'on Sat at 00:00',
                                        recurrentEndDate: 'on Mon at 00:00',
                                        isWorking: false
                                    }
                                ]
                            }
                        ]
                }
            },


            tbar: buildToolbar(config, dotNetRef),

            columns: config.columns || [
                { text: 'Naam', field: 'name', width: 150 }
            ],

            listeners: {
                beforeEventDrag({ eventRecords }) {
                    const hasLocked = eventRecords.some(ev => ev.isLocked === true);
                    if (hasLocked) {
                        notifyError(
                            'DragBlocked.Locked',
                            'Dit event is vergrendeld en kan niet verplaatst worden.',
                            {
                                eventId: eventRecords[0]?.id ?? null,
                                resourceId: eventRecords[0]?.resourceId ?? null
                            }
                        );
                        return false;
                    }
                    return true;
                },
                eventClick({ eventRecord }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventClickFromJs', toPlainEvent(eventRecord));
                },
                eventDblClick({ eventRecord }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventDblClickFromJs', toPlainEvent(eventRecord));
                },
                eventDragStart({ eventRecords, context }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventDragStartFromJs', {
                        events: eventRecords.map(toPlainEvent),
                        ctx: toPlainDragContext(context)
                    });
                },
                eventDrag({ eventRecords, context }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventDragFromJs', {
                        events: eventRecords.map(toPlainEvent),
                        ctx: toPlainDragContext(context)
                    });
                },
                eventDrop({ eventRecords, context }) {
                    if (!dotNetRef) return;

                    const scheduler = this;
                    const moved = eventRecords[0];

                    const overlaps = findOverlaps(scheduler, moved);

                    dotNetRef.invokeMethodAsync('OnEventDropFromJs', {
                        movedEvent: toPlainEvent(moved),
                        overlaps: overlaps,
                        ctx: toPlainDragContext(context)
                    });
                }

            }
        });

        if (config.resourceTimeRanges && config.resourceTimeRanges.length) {
            scheduler.resourceTimeRangeStore.data = config.resourceTimeRanges;
        }



        // splitter tussen planner en unplanned-grid
        const splitter = new Splitter({
            appendTo: targetEl,
            showButtons: 'end'
        });

        // unplanned-grid rechts
        const unplannedGrid = new UnplannedGrid({
            ref: 'unplanned',
            flex: '0 0 320px',
            collapsible: true,
            collapsed: false,
            appendTo: targetEl,
            project: scheduler.project
        });

        // drag van unplanned -> scheduler
        new UnplannedDrag({
            grid: unplannedGrid,
            schedule: scheduler,
            constrain: false,
            outerElement: unplannedGrid.element
        });

        // hoogte mee laten schalen
        window.addEventListener('resize', () => {
            const h = calcHeight();
            targetEl.style.height = h + 'px';
            scheduler.height = h;
            scheduler.refresh?.();
        });

    
        // eventStore changes naar C#
        if (dotNetRef) {
            scheduler.eventStore.on({
                // 1) UI-aanmaak van events blokkeren als id geen number is
                beforeAdd({ records }) {
                    const hasBad = records.some(r => typeof r.id !== 'number');
                    if (hasBad) {
                        return false;  // add annuleren
                    }
             
                },

                add({ records }) {
                    const payload = records
                        .map(r => toPlainEvent(r))
                        .filter(isValidEventForDotNet);

                    if (!payload.length) return;

                    dotNetRef.invokeMethodAsync(
                        'OnEventStoreAddFromJs',
                        payload
                    );
                },

                update({ record }) {
                    const payload = toPlainEvent(record);
                    if (!isValidEventForDotNet(payload)) return;

                    dotNetRef.invokeMethodAsync(
                        'OnEventStoreUpdateFromJs',
                        payload
                    );
                },

                remove({ records }) {
                    const ids = records
                        .map(r => r.id)
                        .filter(id => typeof id === 'number' && Number.isFinite(id) && id > 0);

                    if (!ids.length) return;

                    dotNetRef.invokeMethodAsync(
                        'OnEventStoreRemoveFromJs',
                        ids
                    );
                }
            });
        }



        schedulers[elementId] = {
            scheduler,
            unplannedGrid,
            dotNetRef,
            targetEl
        };
    }

    // ====== CRUD vanuit C# ======

    function addEvent(elementId, evt) {
        const entry = schedulers[elementId];
        if (!entry) return;
        entry.scheduler.eventStore.add(evt);
    }

    function updateEvent(elementId, evt) {
        const entry = schedulers[elementId];
        if (!entry) return;
        const rec = entry.scheduler.eventStore.getById(evt.id);
        if (!rec) return;
        rec.set(evt);
    }

    function removeEvent(elementId, id) {
        const entry = schedulers[elementId];
        if (!entry) return;
        const rec = entry.scheduler.eventStore.getById(id);
        if (rec) entry.scheduler.eventStore.remove(rec);
    }

    function getEvents(elementId) {
        const entry = schedulers[elementId];
        if (!entry) return [];
        return entry.scheduler.eventStore.records.map(r => toPlainEvent(r));
    }

    function setViewPreset(elementId, key) {
        const entry = schedulers[elementId];
        if (!entry) return;

        const preset = resolveViewPreset({ viewPresetKey: key });
        entry.scheduler.viewPreset = preset;
    }

    function setTimeSpan(elementId, start, end) {
        const entry = schedulers[elementId];
        if (!entry) return;

        const scheduler = entry.scheduler;

        const s = start ? new Date(start) : null;
        const e = end ? new Date(end) : null;

        scheduler.setTimeSpan(s, e);
    }

    function setResourceFilter(elementId, resourceIds) {
        const entry = schedulers[elementId];
        if (!entry) return;

        const scheduler = entry.scheduler;
        const store = scheduler.resourceStore;

        // bestaande filter verwijderen
        store.removeFilter('blazorResourceFilter');

        if (!resourceIds || !resourceIds.length) {
            // lege lijst = alles tonen
            return;
        }

        const idSet = new Set(resourceIds);

        store.filter({
            id: 'blazorResourceFilter',
            filterBy(record) {
                // record.id is de resource Id
                return idSet.has(record.id);
            }
        });
    }

    function setFilter(elementId, filter) {
        const entry = schedulers[elementId];
        if (!entry) return;

        const scheduler = entry.scheduler;
        const store = scheduler.eventStore;

        const ids = filter && Array.isArray(filter.visibleEventIds)
            ? filter.visibleEventIds
            : null;

        store.removeFilter('blazorFilter');

        if (!ids || ids.length === 0) {
            return; // alles tonen
        }

        store.filter({
            id: 'blazorFilter',
            filterBy(record) {
                return ids.includes(record.id);
            }
        });

        // eventueel unplannedGrid mee filteren
        if (entry.unplannedGrid && entry.unplannedGrid.store) {
            const uStore = entry.unplannedGrid.store;
            uStore.removeFilter('blazorFilter');
            uStore.filter({
                id: 'blazorFilter',
                filterBy(record) {
                    return ids.includes(record.id);
                }
            });
        }
    }

    function recalcHeight(elementId) {
        const entry = schedulers[elementId];
        if (!entry) return;

        const { scheduler, targetEl } = entry;
        if (!scheduler || !targetEl) return;

        const rect = targetEl.getBoundingClientRect();
        const h = window.innerHeight - rect.top;

        targetEl.style.height = h + 'px';
        scheduler.height = h;
        scheduler.refresh?.();
    }





    return {
        init,
        addEvent,
        updateEvent,
        removeEvent,
        getEvents,
        setFilter,
        setViewPreset,
        setTimeSpan,
        setResourceFilter,
        recalcHeight
    };
})();
