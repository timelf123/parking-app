let React = require('react-native');
let {
  StyleSheet,
  View,
  Text,
  TabBarIOS,
  Navigator,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback
} = React;

let _ = require('underscore');
let ddp = require('../config/ddp');
let SignIn = require('./SignIn');
let Join = require('./Join');

let Layout = React.createClass({
  displayName: 'Layout',

  getInitialState() {
    return {
      connected: false,
      loggedIn: false,
      userId: null,
      spots: [],
      spotsObserver: null,
      users: [],
      usersObserver: null
    }
  },

  getSpots() {
    if (!this.state.spotsObserver) {
      ddp.subscribe('spots').then(() => {
        let spotsObserver = ddp.collections.observe(() => {
          let spots = [];
          if (ddp.collections.spots) {
            spots = ddp.collections.spots.find();
          }
          return spots;
        });

        this.setState({spotsObserver: spotsObserver});

        spotsObserver.subscribe((results) => {
          this.setState({spots: results});
        });
      });
    }
  },

  getUsers() {
    if (!this.state.usersObserver) {
      ddp.subscribe('users').then(() => {
        let usersObserver = ddp.collections.observe(() => {
          let users = [];
          if (ddp.collections.users) {
            users = ddp.collections.users.find();
          }
          return users;
        });

        this.setState({usersObserver: usersObserver});

        usersObserver.subscribe((results) => {
          console.log('RES', results);
          this.setState({users: results});
        });
      });
    }
  },

  componentWillMount() {
    ddp.initialize().then(() => {
      return ddp.loginWithToken();
    }).then((res) => {
      let state = {
        connected: true,
        loggedIn: false
      };
      if (res.loggedIn === true) {
        state.loggedIn = true;
        state.userId= res.userId;
      }
      this.setState(state);
    });
  },

  componentDidUpdate() {
    console.log('componentDidUpdate');
    this.getSpots();
    this.getUsers();
  },

  componentDidMount() {
    console.log('componentDidMount');
    this.getSpots();
    this.getUsers();
  },

  componentWillUnmount() {
    if (this.state.spotsObserver) {
      this.state.spotsObserver.dispose();
    }
  },

  handleLogout(res) {
    this.refs.navigator.pop()
    ddp.logout();
    this.setState(res);
  },

  handleLogin(res) {
    this.refs.navigator.push({
      id: 'main',
      userId: res.userId
    })
    this.setState(res);
  },

  toggleButtonState() {
    newState = !!!this.getOccupier()
    if (newState) {
      ddp.call('Spots.update', [{ name: 'eotw' }, { $set: { user: this.state.userId }}]);
    }
    else {
      ddp.call('Spots.update', [{ name: 'eotw' }, { $set: { user: null }}]);
    }
  },

  getOccupier() {
    let spot = _.findWhere(this.state.spots, { name: 'eotw' });
    if (spot && spot.user) {
      let occupier = _.findWhere(this.state.users, { _id: spot.user });
      if (occupier) {
        return occupier.emails[0].address
      }
    }
  },

  renderAvailable() {
    return (
      <TouchableOpacity onPress={this.toggleButtonState} activeOpacity={0.85}>
        <Image style={styles.button} source={require('image!green_button')}>
          <Text style={styles.buttonText}>CLAIM SPOT</Text>
        </Image>
      </TouchableOpacity>
    );
  },

  renderOccupied() {
    let spot = _.findWhere(this.state.spots, { name: 'eotw' });
    if (spot && spot.user === this.state.userId) {
      return (
        <TouchableOpacity onPress={this.toggleButtonState} activeOpacity={0.85}>
          <Image style={styles.button} source={require('image!red_button')}>
            <Text style={styles.buttonText}>RELEASE SPOT</Text>
          </Image>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <TouchableWithoutFeedback>
          <Image style={styles.button} source={require('image!red_button')}>
            <View>
              <Text style={styles.buttonText}>TAKEN BY</Text>
              <Text style={styles.buttonText}>{this.getOccupier()}</Text>
            </View>
          </Image>
        </TouchableWithoutFeedback>
      );
    }
  },

  renderButtons() {
    if (this.getOccupier()) {
      return (
        <View style={styles.container}>{this.renderOccupied()}</View>
      );
    }
    else {
      return (
        <View style={styles.container}>{this.renderAvailable()}</View>
      );
    }
  },

  renderMain() {
    return (
      <TabBarIOS>
        <TabBarIOS.Item
          title="Logout"
          icon={require('image!private')}
          selected={true}
          onPress={() => {
            this.handleLogout({loggedIn: false});
        }}>
          {this.renderButtons()}
        </TabBarIOS.Item>
      </TabBarIOS>
    )
  },

  renderAuth(route, navigator) {
    if (route.id === 'join') {
      return (
        <Join navigator={navigator} changeLogin={this.handleLogin}/>
      )
    }
    else {
      return (
        <SignIn navigator={navigator} changeLogin={this.handleLogin}/>
      );
    }
  },

  renderNavigatorScene(route, navigator) {
    if (this.state.loggedIn) {
      return this.renderMain();
    }
    else {
      return this.renderAuth(route, navigator);
    }
  },

  renderNavigator() {
    let initialRoute = { id: 'signIn', index: 0 };

    return (
      <Navigator
        ref="navigator"
        initialRoute={initialRoute}
        renderScene={this.renderNavigatorScene}
        configureScene={(route) => {
          let config = Navigator.SceneConfigs.FloatFromBottom
          if (route.sceneConfig) {
            config = route.sceneConfig;
          }
          config.gestures = {}; // Disable gestures
          return config;
        }}
      />
    );
  },

  renderConnecting() {
    return (
      <View>
        <Text>Connecting</Text>
      </View>
    )
  },

  render() {
    if (this.state.connected) {
      return this.renderNavigator();
    }
    else {
      return this.renderConnecting()
    }
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  },
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
    top: 100
  }
});

module.exports = Layout;
