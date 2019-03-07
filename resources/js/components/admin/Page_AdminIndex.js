import React, { Component} from "react";
import { Route, Redirect, Switch } from "react-router-dom";

import Profile from './Page_Profile';
import JobsNew from "./Page_JobsNew";
import JobsBrowser from "./Page_JobsBrowser";
import JobsEditor from "./Page_JobsEditor";
import User from './Page_User';
import Template from './Page_Templates';

class Admin extends Component{

    constructor(props) {
        super(props);

        this.plugins = props.plugins;
        this.user = props.user;

        this.state = {};
    }

    componentDidMount() {
    }

    render(){
        return(
            <div className="admin">
                <Switch>
                    {/* <AdminNavigation plugins={this.plugins} /> */}
                    {/* <div className="pusher content"> */}

                    {/* <Route path="/admin/" exact render={(props) => <div>Admin Dashboard...</div>} /> */}
                    <Route path="/admin/" exact render={(props) => <Redirect to="/admin/jobs" />} />

                    {/* <Route path="/admin/" exact component={JobsBrowser} /> */}
                    <Route path="/admin/profile" component={Profile} />
                    <Route path="/admin/jobs/new" component={JobsNew} />
                    <Route path="/admin/jobs" exact={true} component={JobsBrowser} />
                    <Route path="/admin/jobs/edit/:id" exact={true} component={JobsEditor} />
                    <Route path="/admin/templates" component={Template} />
                    <Route path="/admin/user" component={User} />
                    <Route path="/admin/system" render={(props) => <div>System Settings...</div>} />

                    {this.plugins.map((plugin, i) => {
                        // const entry = plugin.getMenu();
                        return (
                            <Route key={i} path={plugin.path} component={plugin.component} />
                        );
                    })}

                    <Route render={props =>
                        <div>Page not found</div>
                    } />

                </Switch>
            </div>
        );
  }
}

export default Admin;