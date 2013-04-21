Spaces = new Meteor.Collection("spaces");

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

    return Spaces.insert({
      name: object.name,
      created: Date.now(),
      userId: this.userId
    });
  }
});


extractLinks = function(text) {
  var re_weburl = /(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/gi;
  return text.match(re_weburl);
}
