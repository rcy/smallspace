// connected-users.js
//
// keeps track of connected users, and publishes to client so that
// presence information can be shared

// https://github.com/tmeasday/meteor-presence

if (Meteor.isServer) {
  Meteor.publish('userPresence', function(spaceId) {
    // Setup some filter to find the users your logged in user
    // cares about. It's unlikely that you want to publish the
    // presences of _all_ the users in the system.
    var filter = {"state.currentSpace": spaceId};

    // ProTip: unless you need it, don't send lastSeen down as it'll make your
    // templates constantly re-render (and use bandwidth)
    return Meteor.presences.find(filter, {fields: {state: true, userId: true}});
  });
}

if (Meteor.isClient) {
  Meteor.startup( function() {
    Deps.autorun(function() {
      Meteor.subscribe('userPresence', Session.get('currentSpace'));
    });
  });

  Meteor.Presence.state = function() {
    return {
      online: true,
      currentSpace: Session.get('currentSpace')
    }
  }

  Template.connected.helpers({
    onlineUsers: function() {
      return Meteor.presences.find();
    }
  });
}
