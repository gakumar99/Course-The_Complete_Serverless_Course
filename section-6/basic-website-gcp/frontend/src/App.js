import React, { Component } from 'react';
import { Layout } from 'antd';

/* Load firebase */
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/storage';
import 'firebase/firestore';

/* Load local files */
import './App.css';
import { Header } from './components/template/';
import Main from './components/Main';
import { withAPIService } from './hoc';
import config from './config.json';

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

const initialState = {
  fbAuth: auth,
  fbStorage: storage,
  fbDB: db,
  authenticated: false,
  error: '',
  user: null,
  picture: null,
  response: null,
  loading: true
};

class App extends Component {

  state = initialState;

  getStorage = async () => {
    const uid = this.state.user.id;
    const profileUrl = await this.state.fbStorage.ref(`/users/${uid}/profile.png`).getDownloadURL();
    await this.setState({
      picture: profileUrl
    });
  }

  setApplicationUser = async (loggedInUser) => {

    const userPreferences = await this.state.fbDB.collection('userPreferences').doc(`${loggedInUser.uid}`).get();
    const idToken = await loggedInUser.getIdToken();

    await this.setState({
      authenticated: true,
      verified: true,
      user: {
        email: loggedInUser.email,
        id: loggedInUser.uid,
        idToken: idToken
      },
      response: (userPreferences.exists ? userPreferences.data() : null),
      loading: false
    });

    await this.getStorage();

  }

  handleAuthLogin = (user) => {

    if (user && user.emailVerified) {

      this.setApplicationUser(user);

    } else if (user) {

      this.setState(
        {
          userLoggedIn: true,
          loggedInUser: user,
          verified: false,
          loading: false
        }
      );

    } else {

      this.setState(
        {
          userLoggedIn: false,
          loggedInUser: null,
          verified: false,
          loading: false
        }
      );

    }

  }

  signOut = async () => {
    await this.setState({ loading: true });
    await this.state.fbAuth.signOut();
    await this.reset();
  }

  reset = async () => {
    await this.setState(initialState);
    await this.setState({ loading: false });
  }

  componentDidMount() {

    const auth = this.state.fbAuth;

    if (auth.currentUser) {
      this.setApplicationUser(auth.currentUser);
    }

    auth.onAuthStateChanged(this.handleAuthLogin);

  }

  render() {
    const { fbAuth, fbStorage, authenticated, user, loading, picture, error } = this.state;

    return (
      <Layout className="layout">
        <Header signInHandler={this.signIn} signOutHandler={this.signOut} authenticated={authenticated} />

        <Main
          loading={loading}
          authenticated={authenticated}
          fbAuth={fbAuth}
          fbStorage={fbStorage}
          handleSignIn={this.signIn}
          user={user}
          picture={picture}
          getStorage={this.getStorage}
          error={error}
        />
      </Layout>
    );
  }
}

const WrappedComponent = withAPIService(App);

export default WrappedComponent;