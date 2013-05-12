if (Meteor.isServer) {
  Meteor.publish('calendarEvents', function(spaceId) {
    return CalendarEvents.find({spaceId: spaceId});
  });

  CalendarEvents.allow({
    insert: function(userId, doc) {
      if ((doc.userId === userId) &&
          (Memberships.findOne({spaceId: doc.spaceId, userId: userId})))
        return true;
    },
    remove: function(userId, doc) {
      return Memberships.findOne({spaceId: doc.spaceId, userId: userId});
    },
    update: function(userId, doc) {
      return Memberships.findOne({spaceId: doc.spaceId, userId: userId});
    }
  });
}
