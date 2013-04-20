
if (Meteor.isClient) {
  Meteor.subscribe('messages');

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });

  Template.chatWindow.messages = function() {
    return Messages.find();
  }
  Template.chatWindow.events = {
    "submit form": function(e) {
      var $input = $(e.target).find('input');
      $input.attr('disabled', true);
      Meteor.call('post', $input.val(), function(err, result) {
        if (!err) {
          $input.val('');
          $input.attr('disabled', false);
        }
      });
      return false;
    }
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
