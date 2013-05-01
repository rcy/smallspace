// connected-users.js
//
// keeps track of connected users, and publishes to client so that
// presence information can be shared

ConnectedUsers = new Meteor.Collection('connected-users');

if (Meteor.isServer) {
  Meteor.publish('connected-users', function() {
    return ConnectedUsers.find();
  });

  Meteor.methods({
    heartbeat: function() {
      var cu = ConnectedUsers.findOne({ userId: this.userId });

      if (cu)
        ConnectedUsers.update(cu._id, {$set: { timestamp: Date.now() }});
      else
        ConnectedUsers.insert({ userId: this.userId, timestamp: Date.now() });
    }
  });

  Meteor.startup( function() {
    Meteor.setInterval( function() {
      ConnectedUsers.remove({timestamp: {$lt: Date.now() - 10000}});
    }, 5000);
  });
}

if (Meteor.isClient) {
  Meteor.startup( function() {
    Meteor.subscribe('connected-users');

    Meteor.setInterval( function() {
      Meteor.call('heartbeat');
    }, 5000);

    ConnectedUsers.find().observe({
      added: function(cu) {
        console.log('presence: +', cu.userId);
      },
      removed: function(cu) {
        console.log('presence: -', cu.userId);
      }
    });
  });

}
