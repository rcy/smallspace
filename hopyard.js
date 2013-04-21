
if (Meteor.isClient) {
  Meteor.subscribe('messages');
  Meteor.subscribe('links');

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

  Template.message.when = function() {
    return moment(this.created).format("HH:mm");
  }
  Template.message.user = function() {
    return Meteor.users.findOne(this.userId).username;
  }

  Template.links.links = function() {
    return Links.find({}, {sort: {created: -1}, limit: 30});
  }
  Template.link.isOwner = function() {
    return this.userId === Meteor.userId();
  }
  Template.link.user = function() {
    return Meteor.users.findOne(this.userId).username;
  }
  Template.link.when = function() {
    return moment(this.created).format("dddd, MMMM Do YYYY, HH:mm");
  }
  Template.link.inlineOrLink = function() {
    var match = this.url.match(/youtube.com\/watch\?v=(.+)/)
    if (match) {
      var video_id = match[1];
      return '<iframe id="ytplayer" type="text/html" width="400px" height="300px" src="http://www.youtube.com/embed/'+video_id+'?autoplay=0&origin=http://localhost:3000 frameborder="0"/>';
    } else {
      var match = this.url.match(/(jpg|gif)$/);
      if (match) {
        return '<img src="'+this.url+'" width="75%" />'
      } else {
        return '<a href="'+this.url+'" target="_blank">'+this.url+'</a>';
      }
    }
  }
  Template.link.events = {
    'click .delete': function(e) {
      if (confirm('Delete this link? (NOTE: It will remain in the chat log)'))
        Links.remove(this._id);
    }
  };

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
    $('.links').height(bot-top);
  }
  scrollChat = function() {
    var $chat = $('.chat-container .chat');
    if (($chat.scrollTop() === 0)
        || (25 + $chat.scrollTop()) >= ($chat.prop('scrollHeight') - $chat.prop('offsetHeight'))) {
      $chat.scrollTop(1000000);
    }
  }
}

if (Meteor.isServer) {
  Meteor.publish('messages', function() {
    return Messages.find({});
  });
  Meteor.publish('links', function() {
    return Links.find({});
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
