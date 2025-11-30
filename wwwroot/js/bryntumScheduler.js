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
        return {
            id: eventRecord.id,
            name: eventRecord.name,
            resourceId: eventRecord.resourceId,
            startDate: eventRecord.startDate,
            endDate: eventRecord.endDate,
            projectId: eventRecord.projectId ?? null
        };
    }

    function toPlainDragContext(context) {
        const res = context.newResource || context.resourceRecord || null;
        return {
            resourceId: res ? res.id : null,
            startDate: context.startDate || null,
            endDate: context.endDate || null
        };
    }

    // ========== init vanuit Blazor ==========

    function init(elementId, config, dotNetRef) {
        const targetEl = document.getElementById(elementId);
        if (!targetEl) {
            console.warn('Element niet gevonden:', elementId);
            return;
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


            startDate: config.startDate ? new Date(config.startDate) : new Date(),
            endDate: config.endDate ? new Date(config.endDate) : new Date(),

            resources: config.resources || [],
            events: config.events || [],

            columns: config.columns || [
                { text: 'Naam', field: 'name', width: 150 }
            ],

            listeners: {
                eventClick({ eventRecord }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventClickFromJs', toPlainEvent(eventRecord));
                },
                eventDblClick({ eventRecord }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventDblClickFromJs', toPlainEvent(eventRecord));
                },
                // drag in de planner zelf
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
                    dotNetRef.invokeMethodAsync('OnEventDropFromJs', {
                        events: eventRecords.map(toPlainEvent),
                        ctx: toPlainDragContext(context)
                    });
                }
            }
        });

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
                add({ records }) {
                    dotNetRef.invokeMethodAsync(
                        'OnEventStoreAddFromJs',
                        records.map(r => toPlainEvent(r))
                    );
                },
                update({ record }) {
                    dotNetRef.invokeMethodAsync(
                        'OnEventStoreUpdateFromJs',
                        toPlainEvent(record)
                    );
                },
                remove({ records }) {
                    dotNetRef.invokeMethodAsync(
                        'OnEventStoreRemoveFromJs',
                        records.map(r => r.id)
                    );
                }
            });
        }

        schedulers[elementId] = {
            scheduler,
            unplannedGrid,
            dotNetRef
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

    return {
        init,
        addEvent,
        updateEvent,
        removeEvent,
        getEvents
    };
})();
