
if (Meteor.isClient) {
  Deps.autorun(function() {
    var spaceId = Session.get('currentSpace');
    if (spaceId) {
      Meteor.subscribe('messages', spaceId);
      Meteor.subscribe('links', spaceId);
      Meteor.subscribe('invites', spaceId);
    }
  });
  Meteor.subscribe('spaces');
  Meteor.subscribe('allUserData');

  Handlebars.registerHelper("currentSpace", function() {
    return Session.get('currentSpace');
  });

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });

  Template.header.currentSpace = function() {
    var space = Spaces.findOne({_id: Session.get('currentSpace')})
    return space && space.name;
  }
  Template.header.events = {
    'click .title': function(e) {
      Router.setSpace(null);
      return false;
    }
  }

  Template.spaceList.spaces = function() {
    return Spaces.find();
  }
  Template.spaceList.events = {
    'click a': function(e) {
      var spaceId = $(e.target).attr('href');
      Router.setSpace(spaceId);
      return false;
    },
    'click .new': function(e) {
      var name = prompt('new space name:');
      Meteor.call('createSpace', {name: name}, function(err, result) {
        console.log(err, result);
        Router.setSpace(result);
      });
      return false;
    }
  }

  Template.chatWindow.messages = function() {
    return Messages.find();
  }
  Template.chatWindow.events = {
    "submit form": function(e) {
      var $input = $(e.target).find('input');
      $input.attr('disabled', true);
      Meteor.call('post', {text: $input.val(), spaceId: Session.get('currentSpace')},
                  function(err, result) {
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
    var user = Meteor.users.findOne(this.userId);
    return user && user.username;
  }

  Template.links.links = function() {
    return Links.find({}, {sort: {created: -1}, limit: 30});
  }
  Template.link.isOwner = function() {
    return this.userId === Meteor.userId();
  }
  Template.link.user = function() {
    var user = Meteor.users.findOne(this.userId);
    return user && user.username;
  }
  Template.link.when = function() {
    return moment(this.created).format("dddd, MMMM Do YYYY, HH:mm");
  }
  Template.link.link = function() {
    return '<a href="'+this.url+'" target="_blank">'+this.url+'</a>';
  }
  Template.link.inline = function() {
    var match = this.url.match(/youtube.com\/watch\?.*v=(.+)/)
    if (match) {
      var video_id = match[1];
      return '<iframe id="ytplayer" type="text/html" width="400px" height="300px" src="http://www.youtube.com/embed/'+video_id+'?autoplay=0&origin=http://smallspace.meteor.com frameborder="0"/>';
    } else {
      var match = this.url.match(/(jpg|gif|png)$/);
      if (match) {
        return '<a href="'+this.url+'" target="_blank"><img src="'+this.url+'" width="50%" /></a>'
      } else {
        return '';
      }
    }
  }
  Template.link.events = {
    'click .delete': function(e) {
      if (confirm('Delete this link? (NOTE: It will remain in the chat log)'))
        Links.remove(this._id);
    }
  };


  // XXX use a generic date helper for this:
  Template.invite.when = function() {
    return moment(this.created).fromNow();
  }

  Template.invite.events = {
    'click .cancel': function(e) {
      if (confirm('cancel invite for ' + this.email + '?'))
        Invites.remove(this._id);
      return false;
    }
  }
  Template.users.invites = function() {
    return Invites.find();
  }
  Template.users.events = {
    "submit form.invite": function(e) {
      e.preventDefault();
      var $inp = $(e.target).find('input');
      var addr = $inp.val();
      var space = Spaces.findOne(Session.get('currentSpace'));

      // XXX for now, just return if form is empty.  Should validate
      // email also, but server will throw exception if it cannot
      // deliver.
      if (!addr) return false;

      Meteor.call('inviteByEmail', addr, space, function(err, result) {
        console.log('returned from sending invite', err, result);
        if (err) {
          alert('error sending email');
        } else {
          $inp.val('');
        }
      });
      return false;
    }
  }

  Meteor.startup(function() {
    $(window).resize(function(evt) {
      resizeChat();
      scrollChat();
    });
    Backbone.history.start({pushState: true});
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

  // router
  var SpaceRouter = Backbone.Router.extend({
    routes: {
      "": "menu",
      ":spaceId": "main"
    },
    menu: function() {
      console.log('menu');
      Session.set('currentSpace', null);
    },
    main: function(spaceId) {
      var oldSpace = Session.get('currentSpace');
      if (oldSpace !== spaceId) {
        Session.set('currentSpace', spaceId);
      }
    },
    setSpace: function(spaceId) {
      this.navigate(spaceId, true);
    }
  });
  Router = new SpaceRouter;
}

if (Meteor.isServer) {
  Meteor.publish('messages', function(spaceId) {
    return Messages.find({spaceId: spaceId});
  });
  Meteor.publish('links', function(spaceId) {
    return Links.find({spaceId: spaceId});
  });
  Meteor.publish('invites', function(spaceId) {
    return Invites.find({spaceId: spaceId});
  });
  Meteor.publish('spaces', function() {
    return Spaces.find();
  });
  Meteor.publish('allUserData', function() {
    return Meteor.users.find();
  });

  Meteor.startup(function () {
    // code to run on server at startup
    //console.log(process.env);
  });
}
