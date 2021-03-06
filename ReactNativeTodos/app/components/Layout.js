let React = require('react-native');
let {
  StyleSheet,
  View,
  Text,
  TabBarIOS,
  Navigator,
  Image
} = React;

let _ = require('underscore');
let ddp = require('../config/ddp');
let Button = require('./Button');
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
      // should add done() to avoid swallowing errors, but adding here causes
      // weird INVALID_STATE_ERR error
      //}).done();
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
          this.setState({users: results});
        });
      });
      // should add done() to avoid swallowing errors, but adding here causes
      // weird INVALID_STATE_ERR error
      //}).done();
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
    }).done();
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
    if (this.state.usersObserver) {
      this.state.usersObserver.dispose();
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

  renderButtons() {
    return (
      <View style={styles.container}>
        {this.state.spots.map((spot, i) =>
          <Button key={i} userId={this.state.userId} users={this.state.users} spot={spot}/>
        )}
      </View>
    )
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
    //console.log('HELLO', this.cow.moo); // throws error as expected
    if (this.state.connected) {
      //console.log('HELLO', this.cow.moo); // does not throw error
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
});

module.exports = Layout;
