Messages = new Meteor.Collection("messages");

Meteor.methods({
  post: function(text) {
    console.log('post');
    return Messages.insert({
      userId: this.userId,
      created: Date.now(),
      text: text
    });
  }
});
