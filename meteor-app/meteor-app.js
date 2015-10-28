let Spots = new Mongo.Collection('spots');

if (Meteor.isClient) {
  Template.main.onCreated(() => {
    Meteor.subscribe('spots');
  });

  Template.main.helpers({
    spots () { return Spots.find() },
    occupier () { return (this.user) ? this.user : 'Open'; }
  });

  Meteor.startup(() => {
    Blaze.render(Template.main, document.body);
  });
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    if (Spots.find().count() === 0) {
      Spots.insert({ name: 'eotw' });
      Spots.insert({ name: 'corner' });
    }
  });

  Meteor.publish('spots', () => {
    return Spots.find();
  });

  Meteor.publish('users', () => {
    return Meteor.users.find();
  });

  Meteor.methods({
    'Users.create': (email, password) => {
      return Accounts.createUser({email: email, password: password});
    },

    'Spots.update': function(_id, modifier) {
      return Spots.update(_id, modifier);
    },
  });
}
