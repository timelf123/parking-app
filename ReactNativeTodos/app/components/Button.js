let React = require('react-native');
let {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback
} = React;

let _ = require('underscore');
let ddp = require('../config/ddp');

let Button = React.createClass({
  displayName: 'Button',

  toggleButtonState() {
    let newState = !!!this.getOccupier()
    let query = { user: null };
    if (newState) {
      query = { user: this.props.userId };
    }
    ddp.call('Spots.update', [{ name: this.props.spot.name }, { $set: query }]);
  },

  getOccupier() {
    if (this.props.spot) {
      if (this.props.spot.user) {
        let occupier = _.findWhere(this.props.users, { _id: this.props.spot.user });
        if (occupier) {
          return occupier.emails[0].address
        }
      }
    }
  },

  renderAvailable() {
    let name = this.props.spot.name.toUpperCase();
    return (
      <TouchableOpacity onPress={this.toggleButtonState} activeOpacity={0.85}>
        <Image style={styles.button} source={require('image!green_button')}>
          <Text style={styles.buttonText}>CLAIM {name} SPOT</Text>
        </Image>
      </TouchableOpacity>
    );
  },

  renderOccupied() {
    let name = this.props.spot.name.toUpperCase();
    if (this.props.spot.user === this.props.userId) {
      return (
        <TouchableOpacity onPress={this.toggleButtonState} activeOpacity={0.85}>
          <Image style={styles.button} source={require('image!red_button')}>
            <Text style={styles.buttonText}>RELEASE {name} SPOT</Text>
          </Image>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <TouchableWithoutFeedback>
          <Image style={styles.button} source={require('image!red_button')}>
            <Text style={styles.buttonText}>{name} TAKEN BY {this.getOccupier()}</Text>
          </Image>
        </TouchableWithoutFeedback>
      );
    }
  },

  render() {
    if (this.getOccupier()) {
      return this.renderOccupied();
    }
    else {
      return this.renderAvailable();
    }
  },
});

const styles = StyleSheet.create({
  button: {
    width: 225,
    height: 225,
    backgroundColor: 'transparent'
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    top: 80,
    left: 35,
    width: 150
  }
});

module.exports = Button;
