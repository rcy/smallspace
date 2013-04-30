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
                                spaceId: Session.get('currentSpace') });
    Session.set('activeList', listId);
  }
});

Template.listItem.helpers({
  active: function() {
    return Session.equals('activeList', this._id) ? 'active' : '';
  }
});
Template.listItem.events({
  'click': function(e) {
    Session.set('activeList', this._id);
    return false;
  }
});

Template.listContent.helpers({
  elements: function() {
    return ListElements.find({listId: Session.get('activeList')}, {sort: {created: -1}});
  }
});
Template.listContent.events({
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

    var listObj = {userId: Meteor.userId(),
                         created: Date.now(),
                         listId: Session.get('activeList'),
                         spaceId: Session.get('currentSpace'),
                         text: $inp.val()};
    console.log(listObj);
    var result = ListElements.insert(listObj);
    console.log(result);
    $inp.val('');
    return false;
  }
});

Template.listElement.events({
  'click': function(e) {
    ListElements.update(this._id, {$set: {checked: !this.checked}});
    return false;
  }
});
Template.listElement.helpers({
  checked: function() {
    return this.checked ? 'checked' : '';
  }
});

function generateListName() {
  var adj1 = ['cute', 'awesome', 'happy' ];
  var adj2 = ['small', 'tiny', 'mini', 'little'];
  var nouns = ['list', 'set', 'things'];
  return [adj1, adj2, nouns].map( function(set) { return Random.choice(set); } ).join(' ');
}
