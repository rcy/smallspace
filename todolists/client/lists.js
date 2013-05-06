Deps.autorun(function() {
  var spaceId = Session.get('currentSpace');
  var todoListId = Session.get('activeTodoList');
  Meteor.subscribe('todoListElements', spaceId, todoListId);
});

Template.todoListsTab.helpers({
  todoLists: function() {
    return TodoLists.find({spaceId: Session.get('currentSpace')});
  },
  activeTodoList: function() {
    return TodoLists.findOne(Session.get('activeTodoList'));
  }
});

Template.todoListsTab.events({
  'click .new': function(e) {
    var todoListId = TodoLists.insert({ name: generateTodoListName(),
                                        userId: Meteor.userId(),
                                        created: Date.now(),
                                        updated: Date.now(),
                                        spaceId: Session.get('currentSpace') });
    Session.set('activeTodoList', todoListId);
  }
});

Template.todoListItem.helpers({
});
Template.todoListItem.events({
  'click': function(e) {
    Session.set('activeTodoList', this._id);
    return false;
  }
});

Template.todoListContent.helpers({
  elements: function() {
    return TodoListElements.find({todoListId: Session.get('activeTodoList'), trash: {$ne: true}}, {sort: {created: -1}});
  }
});
Template.todoListContent.events({
  'click .back': function(e) {
    Session.set('activeTodoList', null);
    return false;
  },
  'click .delete': function(e) {
    if (confirm('really delete "' + this.name + '"?')) {
      TodoLists.remove(Session.get('activeTodoList'));
      Session.set('activeTodoList', null);
    }

    return false;
  },
  'submit form': function(e) {
    e.preventDefault();
    var $inp = $(e.target).find('input');

    if ($inp.val()) {
      var todoListObj = { userId: Meteor.userId(),
                          created: Date.now(),
                          updated: Date.now(),
                          todoListId: Session.get('activeTodoList'),
                          spaceId: Session.get('currentSpace'),
                          text: $inp.val() };

      var result = TodoListElements.insert(todoListObj, function(x,y) { console.log(x,y) });
      $inp.val('');
    }
    return false;
  },

  // contenteditable todoList name events
  // on blur or RET, save the new title
  'blur .name': function(e) {
    renameTodoList(this._id, $(e.target).text());
  },
  'keyup .name': function(e) {
    if (e.keyCode === 13)
      renameTodoList(this._id, $(e.target).text());
  },
  'keydown .name': function(e) {
    // prevent text area from flashing a newline
    if (e.keyCode === 13)
      return false;
  }
});

Template.todoListElement.events({
  'click .toggle': function(e) {
    TodoListElements.update(this._id, {$set: {checked: !this.checked}});
    return false;
  },
  'click .trash': function(e) {
    e.preventDefault();
    Meteor.call('trash', 'TodoListElements', this._id);
    //TodoListElements.update(this._id, {$set: {trash: true}});
    return false;
  }
});
Template.todoListElement.helpers({
  checked: function() {
    return this.checked ? 'checked' : '';
  }
});

function generateTodoListName() {
  return 'untitled todolist';
}
