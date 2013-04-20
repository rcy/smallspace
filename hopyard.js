
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
          $input.attr('disabled', false).val('');
        }
      });
      return false;
    }
  }

  Template.chatWindow.rendered = function() {
    resizeChat();
    scrollChat();
  }

  Meteor.startup(function() {
    $(window).resize(function(evt) {
      resizeChat();
      scrollChat();
    });
  });

  resizeChat = function() {
    var top = $('.chat-container .chat').position().top;
    var bot = $('.chat-container form').position().top;
    $('.chat-container .chat').height(bot - top);
  }
  scrollChat = function() {
    var $chat = $('.chat-container .chat');
    if ((25 + $chat.scrollTop()) >= ($chat.prop('scrollHeight')
                                     - $chat.prop('offsetHeight'))) {
      $chat.scrollTop(1000000);
    }
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
