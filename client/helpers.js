Handlebars.registerHelper("currentSpace", function() {
  return Session.get('currentSpace');
});

Handlebars.registerHelper("spaceName", function(id) {
  var space = Spaces.findOne(id);
  return space && space.name;
});
Handlebars.registerHelper("userName", function(id) {
  var user = Meteor.users.findOne(id);
  return user && user.username;
});
Handlebars.registerHelper("fromNow", function(timestamp) {
  return moment(timestamp).fromNow();
});

// XXX don't compute md5 and url everytime
Handlebars.registerHelper("avatar", function(userId, size) {
  var user = Meteor.users.findOne(userId);
  if (user) {
    var email = user.emails[0].address;
    var src = "http://www.gravatar.com/avatar/" + md5(email) + "?d=retro&s=100";
    return src;
  } else {
    // force mystery man default for anonymous users
    return "http://www.gravatar.com/avatar?d=mm&f=y&s=100"
  }
});
