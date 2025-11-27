// wwwroot/js/bryntumScheduler.js
window.bryntumScheduler = (function () {
    const schedulers = {};

    function toPlainEvent(eventRecord) {
        return {
            id: eventRecord.id,
            name: eventRecord.name,
            resourceId: eventRecord.resourceId,
            startDate: eventRecord.startDate,
            endDate: eventRecord.endDate,
            projectId: eventRecord.projectId ?? null
        };
    }

    function init(elementId, config, dotNetRef) {
        const targetEl = document.getElementById(elementId);
        if (!targetEl) {
            console.warn("Element niet gevonden:", elementId);
            return;
        }

        const scheduler = new bryntum.schedulerpro.SchedulerPro({
            appendTo: targetEl,

            startDate: config.startDate ? new Date(config.startDate) : new Date(),
            endDate:   config.endDate   ? new Date(config.endDate)   : new Date(),

            resources: config.resources || [],
            events:    config.events || [],

            columns: config.columns || [
                { text: 'Naam', field: 'name', width: 150 }
            ],

            listeners: {
                // 1x klik op event
                eventClick({ eventRecord }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventClickFromJs', toPlainEvent(eventRecord));
                },

                // dubbelklik op event
                eventDblClick({ eventRecord }) {
                    if (!dotNetRef) return;
                    dotNetRef.invokeMethodAsync('OnEventDblClickFromJs', toPlainEvent(eventRecord));
                }
                

            }
        });

        // eventStore changes => terug naar C#
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
            dotNetRef
        };
    }

    // ====== CRUD vanuit C# aansturen ======

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
