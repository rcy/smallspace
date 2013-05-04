Lists = new Meteor.Collection("lists");
ListElements = new Meteor.Collection("listElements");

if (Meteor.isServer) {
  Meteor.publish('lists', function(spaceId) {
    return Lists.find({spaceId: spaceId});
  });

  Meteor.publish('list-elements', function(spaceId, listId) {
    if (spaceId && listId) {
      console.log('list-elements publish', spaceId, listId);
      return ListElements.find( { spaceId: spaceId,
                                  listId: listId },
                                { sort: { created: -1 } } );
    }
  });

  Lists.allow({
    insert: function(userId, doc) {
      if ((doc.userId === userId) &&
          doc.spaceId &&
          Memberships.findOne({spaceId: doc.spaceId, userId: userId}))
        return true;
    },
    remove: function(userId, doc) {
      return Memberships.findOne({spaceId: doc.spaceId, userId: userId});
    },
    update: function(userId, doc) {
      return Memberships.findOne({spaceId: doc.spaceId, userId: userId});
    }
  });
  ListElements.allow({
    insert: function(userId, doc) { return true; },
    remove: function(userId, doc) { return true; },
    update: function(userId, doc) { return true; }
  });
}

Meteor.methods({
  trash: function(collectionName, id) {
    console.log('trash', id)
    var set = { $set: { trash: true, updated: Date.now() } };

    // XXX How to map from text collection name to actual object.  Maybe extend Meteor.collection
    switch (collectionName) {
    case 'ListElements':
      ListElements.update(id, set);
      break;
    }
  }
});

renameList = function(id, name) {
  Lists.update(id, { $set: { name: name, updated: Date.now() } });
}
