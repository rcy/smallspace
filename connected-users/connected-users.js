// connected-users.js
//
// keeps track of connected users, and publishes to client so that
// presence information can be shared

if (Meteor.isServer) {
  Meteor.publish('userPresence', function() {
    console.log('publish userPresence');
    // Setup some filter to find the users your logged in user
    // cares about. It's unlikely that you want to publish the
    // presences of _all_ the users in the system.
    var filter = {};

    // ProTip: unless you need it, don't send lastSeen down as it'll make your
    // templates constantly re-render (and use bandwidth)
    return Meteor.presences.find(filter, {fields: {state: true, userId: true}});
  });
}

if (Meteor.isClient) {
  Meteor.startup( function() {
    Meteor.subscribe('userPresence');

    Meteor.presences.find().observe({
      added: function(cu) {
        console.log('presence: +', cu.userId);
      },
      removed: function(cu) {
        console.log('presence: -', cu.userId);
      }
    });
  });

  Template.connected.helpers({
    onlineUsers: function() {
      console.log('connected online');
      return Meteor.presences.find();
    }
  });
}
