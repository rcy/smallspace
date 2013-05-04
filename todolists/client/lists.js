Deps.autorun(function() {
  var spaceId = Session.get('currentSpace');
  var listId = Session.get('activeList');
  Meteor.subscribe('list-elements', spaceId, listId);
});

Template.listsTab.helpers({
  lists: function() {
    return Lists.find({spaceId: Session.get('currentSpace')});
  },
  activeList: function() {
    return Lists.findOne(Session.get('activeList'));
  }
});

Template.listsTab.events({
  'click .new': function(e) {
    var listId = Lists.insert({ name: generateListName(),
                                userId: Meteor.userId(),
                                created: Date.now(),
                                updated: Date.now(),
                                spaceId: Session.get('currentSpace') });
    Session.set('activeList', listId);
  }
});

Template.listItem.helpers({
});
Template.listItem.events({
  'click': function(e) {
    Session.set('activeList', this._id);
    return false;
  }
});

Template.listContent.helpers({
  elements: function() {
    return ListElements.find({listId: Session.get('activeList'), trash: {$ne: true}}, {sort: {created: -1}});
  }
});
Template.listContent.events({
  'click .back': function(e) {
    Session.set('activeList', null);
    return false;
  },
  'click .delete': function(e) {
    if (confirm('really delete "' + this.name + '"?')) {
      Lists.remove(Session.get('activeList'));
      Session.set('activeList', null);
    }

    return false;
  },
  'submit form': function(e) {
    e.preventDefault();
    var $inp = $(e.target).find('input');

    if ($inp.val()) {
      var listObj = {userId: Meteor.userId(),
                     created: Date.now(),
                     updated: Date.now(),
                     listId: Session.get('activeList'),
                     spaceId: Session.get('currentSpace'),
                     text: $inp.val()};

      var result = ListElements.insert(listObj);
      $inp.val('');
    }
    return false;
  },

  // contenteditable list name events
  // on blur or RET, save the new title
  'blur .name': function(e) {
    renameList(this._id, $(e.target).text());
  },
  'keyup .name': function(e) {
    if (e.keyCode === 13)
      renameList(this._id, $(e.target).text());
  },
  'keydown .name': function(e) {
    // prevent text area from flashing a newline
    if (e.keyCode === 13)
      return false;
  }
});

Template.listElement.events({
  'click .toggle': function(e) {
    ListElements.update(this._id, {$set: {checked: !this.checked}});
    return false;
  },
  'click .trash': function(e) {
    e.preventDefault();
    Meteor.call('trash', 'ListElements', this._id);
    //ListElements.update(this._id, {$set: {trash: true}});
    return false;
  }
});
Template.listElement.helpers({
  checked: function() {
    return this.checked ? 'checked' : '';
  }
});

function generateListName() {
  return 'untitled todo list';
}
