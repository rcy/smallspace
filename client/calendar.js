Meteor.startup(function() {
  Deps.autorun(function() {
    // react to collection changes by triggering calendar refetch
    var ignoreResult = CalendarEvents.find({spaceId: Session.get('currentSpace')}).fetch();
    $('.calendar').fullCalendar('refetchEvents');
  });
});

Template.calendarTab.helpers({
});
Template.calendarTab.rendered = function() {
  $('.calendar').fullCalendar({
    header: {
      right: 'prev,next today',
      //center: 'title',
      //right: 'month,agendaWeek,agendaDay'
    },

    editable: true,

    eventSources: [
      function(start, end, callback) {
        var events = CalendarEvents.find().fetch();
        callback(events);
      }
    ],

    dayClick: function(date, allDay, jsEvent, view) {
      var title = prompt('add event for ' + moment(date).format("ddd, MMM YYYY"));
      if (title) {
        // XXX move to method call, and insert message in chat window along with it
        var event = { spaceId: Session.get('currentSpace'),
                      userId: Meteor.userId(),
                      title: title,
                      start: date
                    };

        CalendarEvents.insert(event);
      }
    },

    eventClick: function(event, jsEvent, view) {
      if (confirm('delete "' + event.title + '"?'))
        CalendarEvents.remove(event._id);
    },

    eventDrop: function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
      CalendarEvents.update(event._id, { $set: { start: event.start } });
    }
  });
}
Template.calendarTab.events = {
}
