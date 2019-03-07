import React, { Component} from "react";
import { BrowserRouter as Router, Route, Redirect, Switch, withRouter } from "react-router-dom";
import { Modal } from 'semantic-ui-react'
import moment from 'moment';

import {request, getAccessToken, setAccessToken} from "../utils/helper";
import { getErrors, setErrorHandler } from './etc/Error_Tools';
import * as plugins from './plugins';

import Login from "./Page_Login";
import Pages from "./Pages";

// moment.locale("de");
const env = process.env.NODE_ENV || 'production';
const config = require('../config')[env];

const defaultUser = {
    name: null,
    role: null,
    token: null,
    isAuthenticated: false,
};

class App extends Component{

    constructor(props) {
        super(props);

        // TODO may check login credentials with backend route 'isAuthenticated', otherwise redirect to login page
        const localUser = JSON.parse(localStorage.getItem('user'));

        this.state = {
            user: {...defaultUser, ...localUser},

            globalErrors: [],

            hasJSError: false,
            jsErrorInfo: null,

            redirectToHome: false,
            // redirectToLogin: localUser === null
        };

        this.plugins = [];

        for (const plugin in plugins) {
            const plg = new plugins[plugin];
            this.plugins.push(plg);
        }

        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);

        this.errorHandler = this.errorHandler.bind(this);
        this.handleCloseErrorAlert = this.handleCloseErrorAlert.bind(this);

        // set acces token for axios requests
        setAccessToken(this.state.user.token);

        // set error handler to show global errors
        setErrorHandler(this.errorHandler);
    }

    componentDidMount() {

        // set moments js language
        moment.locale("de");

        // Only Chrome & Opera pass the error object.
        // window.onerror = function (message, file, line, col, error) {
        //     // console.log(message, "from", error.stack);
        // };
        // // Only Chrome & Opera have an error attribute on the event.
        // window.addEventListener("error", function (e) {
        //     // console.log(e.error.message, "from", e.error.stack);
        //     console.log("Catch error", e);
        // });

    }

    errorHandler(error) {
        const globalErrors = [...this.state.globalErrors];
        globalErrors.push(error);
        console.log("global Errors", globalErrors);
        this.setState({globalErrors})
    }

    handleCloseErrorAlert() {
        this.setState({globalErrors: []})
    }

    componentDidCatch(error, info) {
        console.log("Error", error, info);
        this.setState({
            hasJSError: error,
            jsErrorInfo: info
        });
    }

    handleLogin(data, callback) {
        let user = {
            name: data.name,
            role: data.role,
            token: data.token,
            isAuthenticated: true
        }
        user = {...this.state.user, ...user};
        console.log('handleLogin', user);

        // set access token for axios backend requests
        setAccessToken(data.token);

        // save login data in local storage
        localStorage.setItem('user', JSON.stringify(user))

        this.setState({
            user,
            // redirectToHome: true
        });
        callback();
    }

    handleLogout() {
        // destroy localUser
        localStorage.removeItem('user');

        // nullify access token
        setAccessToken(null);

        this.setState({
            user: defaultUser,
            // redirectToHome: true
        });

        // callback();
    }

    render() {

        if (this.state.hasJSError) {
            return (
                <div>
                    <h1>Something went wrong with our application.</h1>
                    <p>Please send the following error to our webmaster/application developer/admin/...</p>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.jsErrorInfo.componentStack}
                    </details>
                </div>
            );
        }

        const errorAlert = (
            <Modal
                open={this.state.globalErrors.length > 0}
                onClose={this.handleCloseErrorAlert}
                closeIcon
                centered={false}
                size={'small'}
            >
                <Modal.Header>
                    Error
                </Modal.Header>
                <Modal.Content>
                    {this.state.globalErrors.map((error, k) => {
                        return (
                            <div key={k}>
                                {error.message}
                            </div>
                        );
                    })}
                </Modal.Content>
            </Modal>
        );

        const RouteLogout = () => {
            this.handleLogout();
            return(<Redirect to="/" />);
        }

        const routerBasename = typeof config.publicBasePath === "undefined" ? "" : config.publicBasePath;

        return(
            <Router basename={routerBasename}>
                <div className="app">

                    {errorAlert}

                    <Switch>
                        <Route path="/login/:p?" render={props =>
                            <Login handleLogin={this.handleLogin} {...props} />
                        } />

                        <Route path="/logout" component={RouteLogout} />

                        <Route path="/" render={props =>
                            <Pages plugins={this.plugins} user={this.state.user} {...props} />
                        } />
                    </Switch>

                </div>
            </Router>
        );
  }
}

export default App;