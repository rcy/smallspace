Spaces = new Meteor.Collection("spaces");
Invites = new Meteor.Collection("invites");
Memberships = new Meteor.Collection("memberships");

Messages = new Meteor.Collection("messages");
Links = new Meteor.Collection("links");

Meteor.methods({
  post: function(object) {
    object = object || {};

    if (!object.text || !object.spaceId)
      throw new Meteor.Error(400, 'arg error');

    var messageId = Messages.insert({
      userId: this.userId,
      created: Date.now(),
      text: object.text,
      spaceId: object.spaceId
    });

    // touch the space update stamp
    Spaces.update(object.spaceId, {$set: {updated: Date.now()}});

    if (!this.isSimulation) {
      var links = extractLinks(object.text);
      _.each(links, function(link) {
        Links.insert({
          userId: this.userId,
          url: link,
          messageId: messageId,
          messageText: object.text,
          created: Date.now(),
          spaceId: object.spaceId,
          title: 'untitled'
        });
      }, this);
    }

    return messageId;
  },

  createSpace: function(object) {
    object = object || {};

    if (!object.name || !object.name.length)
      throw new Meteor.Error(400, 'arg error');

    var spaceId = Spaces.insert({
      name: object.name,
      created: Date.now(),
      updated: Date.now(),
      userId: this.userId
    });

    Memberships.insert({
      created: Date.now(),
      updated: Date.now(),
      userId: this.userId,
      spaceId: spaceId
    });

    return spaceId;
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    inviteByEmail: function (to, space) {
      // Let other method calls from the same client start running,
      // without waiting for the email sending to complete.
      this.unblock();

      console.log('mailurl:',process.env.MAIL_URL);

      // create invitation record
      var inviteId = Invites.insert({ email: to,
                                      spaceId: space._id,
                                      invitedBy: this.userId,
                                      created: Date.now() });

      Email.send({
        to: to,
        from: "rcyeske+server@gmail.com",
        subject: "invitation to '" + space.name + "'",
        text: "You are invited to " + space.name + "!\n\n" 
          + "Visit " + process.env.ROOT_URL + "/" + space._id + "/invite/" + inviteId
      });

    }
  });
}


extractLinks = function(text) {
  var re_weburl = /(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/gi;
  return text.match(re_weburl);
}
