if (Meteor.isClient) {
  currentUserSpaceIds = function() {
    return _.pluck(Memberships.find().fetch(), 'spaceId');
  }

  // update title and navigation when visiting a space
  Deps.autorun(function () {
    var space = Spaces.findOne(Session.get("currentSpace"));
    if (space) {
      document.title = space.name;
      Router.navigate(space._id + '/' + slugify(space.name))
    } else
      document.title = "smallspace";
  });


  Deps.autorun(function() {
    var spaceId = Session.get('currentSpace');
    if (spaceId) {
      Meteor.subscribe('messages', spaceId);
      Meteor.subscribe('links', spaceId);
      Meteor.subscribe('space-invites', spaceId);
      Meteor.subscribe('space-memberships', spaceId);
      Meteor.subscribe('calendarEvents', spaceId);
      Meteor.subscribe('lists', spaceId);
    }
  });

  Deps.autorun(function() {
    var ms = Memberships.find().fetch();
    var is = Invites.find().fetch();
    var spaceIds = _.pluck(ms.concat(is), 'spaceId');
    Meteor.subscribe('spaces', spaceIds);
  });

  Deps.autorun(function() {
    Meteor.subscribe('recent-activity', currentUserSpaceIds());
  });

  Deps.autorun(function() {
    var inviteId = Session.get('currentInviteId');
    if (inviteId) {
      var userId = Meteor.userId();
      // make sure this current invite is set to this user
      Invites.update(inviteId, { $set: { userId: Meteor.userId() } });
    }
  });

  Meteor.subscribe('my-memberships');
  Meteor.subscribe('my-invites');

  // XXX this is BAD
  Meteor.subscribe('allUserData');

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });

  Template.header.helpers({
    currentSpace: function() {
      var space = Spaces.findOne({_id: Session.get('currentSpace')})
      return space && space.name;
    }
  });

  Template.header.events = {
    'click .title': function(e) {
      Router.setSpace(null);
      return false;
    }
  }

  Template.space.isMember = function() {
    return Memberships.findOne({spaceId: Session.get('currentSpace'), userId: Meteor.userId()});
  }

  Template.myInvitiationItem.events = {
    'click a.accept': function(e) {
      var invitation = this;
      Meteor.call('acceptInvite', invitation, function(err, result) {
        Router.setSpace(invitation.spaceId);
      });
      return false;
    }
  }

  Template.spaceList.helpers({
    memberSpaces: function() {
      var spaceIds = _.pluck(Memberships.find().fetch(), 'spaceId');
      return Spaces.find({_id: {$in: spaceIds}});
    },

    invitations: function() {
      return Invites.find({ $or: [ { email: Meteor.user().emails[0].address },
                                   { userId: Meteor.userId() } ]
                          });
    }
  });

  Template.spaceList.events = {
    'click .new': function(e) {
      var name = prompt('new space name:');
      Meteor.call('createSpace', {name: name}, function(err, result) {
        console.log(err, result);
        Router.setSpace(result);
      });
      return false;
    }
  }
  Template.spaceListItem.helpers({
    image: function() {
      return this.image || 'http://www.gravatar.com/avatar/'+md5(this._id)+'.jpg?d=monsterid&s=200'
    },
    recentActivity: function() {
      return RecentActivity.findOne({spaceId: this._id});
    }
  });

  Template.spaceListItem.events = {
    'click': function(e) {
      Router.setSpace(this._id);
      return false;
    }
  }

  Template.chatWindow.helpers({
    messages: function() {
      return Messages.find({spaceId: Session.get('currentSpace')}, {sort: {created: 1}});
    }
  });
  Template.chatWindow.events = {
    "submit form": function(e) {
      var $input = $(e.target).find('input');
      Meteor.call('postMessage',
                  { _id: Random.id(),
                    text: $input.val(),
                    spaceId: Session.get('currentSpace') },
                  function(err, result) {
                  });
      $input.val('');
      return false;
    }
  }
  Template.chatWindow.rendered = function() {
    resizeChat();
    scrollChat();
  }

  Template.rightSideNav.rendered = function() {
    resizeChat();
  }

  Template.rightSideNav.events = {
    // XXX hack to render calendar which is initally setup when the tab is hidden: http://arshaw.com/fullcalendar/docs/display/render/
    'click a[href=#calendarTab]': function() {
      Meteor.setTimeout(function() { $('.calendar').fullCalendar('render'); }, 0);
    }
  }

  Template.message.when = function() {
    return moment(this.created).format("MMM D HH:mm");
  }

  Template.rightSideNav.userId = function() {
    var space = Spaces.findOne(Session.get('currentSpace'));
    return space && space.userId;
  }
  Template.adminTab.events = {
    'click .delete': function(e) {
      if (confirm('delete space permanently?')) {
        Meteor.call('deleteSpace', Session.get('currentSpace'));
        Router.setSpace(null);
      }
    }
  }

  Template.linksTab.helpers({
    links: function() {
      return Links.find({spaceId: Session.get('currentSpace')}, {sort: {created: -1}, limit: 30});
    }
  });
  Template.link.helpers({
    isOwner: function() {
      return this.userId === Meteor.userId();
    },
    when: function() {
      return moment(this.created).format("dddd, MMMM Do YYYY, HH:mm");
    },
    link: function() {
      return '<a href="'+this.url+'" target="_blank">'+this.url+'</a>';
    },
    inline: function() {
      var match = this.url.match(/youtube.com\/.*watch\?.*v=([-a-zA-Z0-9]+)/)
      if (match) {
        var video_id = match[1];
        return '<iframe width="400px" height="225px" src="http://www.youtube.com/embed/'+video_id+'" allowfullscreen></iframe>';
      } else {
        var match = this.url.match(/(jpg|gif|png)$/);
        if (match) {
          return '<a href="'+this.url+'" target="_blank"><img src="'+this.url+'" width="50%" /></a>'
        } else {
          return '';
        }
      }
    }
  });
  Template.link.events = {
    'click .delete': function(e) {
      if (confirm('Delete this link? (NOTE: It will remain in the chat log)'))
        Links.remove(this._id);
    }
  };

  // XXX this is a hack to redirect back to home page after signing up from invite link
  // need to figure out how to catch signin/signup event
  Template.invite.rendered = function() {
    if (Meteor.userId()) {
      Router.setSpace(null);
    }
  }

  // XXX use a generic date helper for this:
  Template.inviteListItem.when = function() {
    return moment(this.created).fromNow();
  }

  Template.inviteListItem.events = {
    'click .cancel': function(e) {
      if (confirm('cancel invite for ' + this.email + '?'))
        Invites.remove(this._id);
      return false;
    }
  }

  Template.membersTab.helpers({
    memberList: function() {
      return Memberships.find({spaceId: Session.get('currentSpace')});
    },
    invites: function() {
      return Invites.find({spaceId: Session.get('currentSpace')});
    }
  });
  Template.membersTab.events = {
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
    $('.rightSideNav').height(bot-top);
  }

  scrollChat = function() {
    var $chat = $('.chat-container .chat');
    if (($chat.scrollTop() === 0)
        || (50 + $chat.scrollTop()) >= ($chat.prop('scrollHeight') - $chat.prop('offsetHeight'))) {
      $chat.scrollTop(1000000);
    }
  }

  // router
  var SpaceRouter = Backbone.Router.extend({
    routes: {
      "": "menu",
      ":spaceId/invite/:inviteId": "invite",

      ":spaceId": "main",
      ":spaceId/:slug": "main",
    },

    menu: function() {
      Session.set('currentSpace', null);
      Session.set('page', 'home');
    },

    invite: function(spaceId, inviteId) {
      Session.set('currentSpace', null);
      if (Meteor.userId()) {
        Session.set('page', 'home');
      } else {
        Session.set('currentInviteId', inviteId);
        Session.set('page', 'invite');
      }
    },

    main: function(spaceId) {
      var oldSpace = Session.get('currentSpace');
      if (oldSpace !== spaceId) {
        Session.set('currentSpace', spaceId);
      }
      Session.set('page', 'space');
    },

    setSpace: function(spaceId) {
      var path = spaceId;
      var space = Spaces.findOne(spaceId);
      if (space)
        path += '/' + slugify(space.name);

      this.navigate(path, true);
    }
  });
  Router = new SpaceRouter;
}

if (Meteor.isServer) {
  Meteor.publish('messages', function(spaceId) {
    return Messages.find({spaceId: spaceId}, {sort: {created: -1}, limit: 1000});
  });
  Meteor.publish('links', function(spaceId) {
    return Links.find({spaceId: spaceId});
  });
  Meteor.publish('calendarEvents', function(spaceId) {
    return CalendarEvents.find({spaceId: spaceId});
  });
  Meteor.publish('space-invites', function(spaceId) {
    return Invites.find({spaceId: spaceId});
  });
  Meteor.publish('space-memberships', function(spaceId) {
    return Memberships.find({spaceId: spaceId});
  });
  Meteor.publish('my-memberships', function() {
    return Memberships.find({userId: this.userId});
  });
  Meteor.publish('my-invites', function() {
    var user = Meteor.users.findOne(this.userId);
    if (user)
      return Invites.find({ $or: [ { email: user.emails[0].address },
                                   { userId: user._id } ]
                          });
  });

  Meteor.publish('spaces', function(spaceIds) {
    return Spaces.find({_id: {$in: spaceIds}, deleted: {$ne : true} } );
  });
  Meteor.publish('allUserData', function() {
    return Meteor.users.find({}, {fields: {username: 1, emails: 1}});
  });

  Meteor.publish('recent-activity', function(spaceIds) {
    return RecentActivity.find({spaceId: {$in: spaceIds}});
  });

  Meteor.startup(function () {
    // code to run on server at startup
    //console.log(process.env);
  });

  Invites.allow({
    update: function(userId, doc, fields, modifier) {
      return true;
    }
  });

  Links.allow({
    remove: function(userId, doc) {
      // you own it, you can delete it
      return (doc.userId === userId);
    }
  });

  CalendarEvents.allow({
    insert: function(userId, doc) {
      if ((doc.userId === userId) &&
          (Memberships.findOne({spaceId: doc.spaceId, userId: userId})))
        return true;
    },
    remove: function(userId, doc) {
      return (doc.userId === userId);
    },
    update: function(userId, doc) {
      return (doc.userId === userId);
    }
  });
}
