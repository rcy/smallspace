TodoLists = new Meteor.Collection("todoLists");
TodoListElements = new Meteor.Collection("todoListElements");

if (Meteor.isServer) {
  Meteor.publish('todoLists', function(spaceId) {
    return TodoLists.find( { spaceId: spaceId } );
  });

  Meteor.publish('todoListElements', function(spaceId, todoListId) {
    if (spaceId && todoListId) {
      return TodoListElements.find( { spaceId: spaceId,
                                      todoListId: todoListId },
                                    { sort: { created: -1 } } );
    }
  });

  TodoLists.allow({
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
  TodoListElements.allow({
    insert: function(userId, doc) { return true; },
    remove: function(userId, doc) { return true; },
    update: function(userId, doc) { return true; }
  });
}

Meteor.methods({
  trash: function(collectionName, id) {
    var set = { $set: { trash: true, updated: Date.now() } };

    // XXX How to map from text collection name to actual object.  Maybe extend Meteor.collection
    switch (collectionName) {
    case 'TodoListElements':
      TodoListElements.update(id, set);
      break;
    }
  }
});

renameTodoList = function(id, name) {
  TodoLists.update(id, { $set: { name: name, updated: Date.now() } });
}
