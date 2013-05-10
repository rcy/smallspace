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
  todoListItemInsert: function(object) {
    var todoList = TodoLists.findOne(object.todoListId);
    console.log('todoListItemInsert', object, todoList);
    var todoListObj = { userId: Meteor.userId(),
                        created: Date.now(),
                        updated: Date.now(),
                        todoListId: object.todoListId,
                        spaceId: object.spaceId,
                        text: object.text };

    var id = TodoListElements.insert(todoListObj);

    if (Meteor.isServer) {
      // mention this in chat
      // XXX make a method for this
      Messages.insert( { userId: Meteor.userId(),
                         created: Date.now(),
                         alert: true,
                         text: 'added "' + object.text + '" to "' + todoList.name + '"' ,
                         spaceId: object.spaceId
                       } );
    }

    return id;
  },
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
