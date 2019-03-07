import React, { Component} from "react";
import { Redirect } from "react-router-dom";

import {request} from "../utils/helper";

class PageLogin extends Component{

    constructor(props) {
        super(props);

        this.state = {
            loginError: false,
            redirectTo: false
        };

        this.parentHandleLogin = props.handleLogin;

        this.handleChangeInput = this.handleChangeInput.bind(this);
        this.handleSubmitForm = this.handleSubmitForm.bind(this);
        this.closeError = this.closeError.bind(this);
    }

    componentDidMount() {
    }

    handleChangeInput(e) {
        const target = e.target;
        const value = target.value;
        const name = target.name;

        this.setState({[name]: value});
    }

    handleSubmitForm(e) {
        request('login', '', 'POST', this.state)
        .then(result => {
            if (result.data == false) {
                this.setState({loginError: "Wrong user or password. Please try again"})
            } else {
                this.parentHandleLogin(result.data, () => {
                    let redirectTo = this.props.location.state
                        ? this.props.location.state.from
                        : { pathname: "/" };

                    if ((result.data.role == "admin" || result.data.role == "author") && redirectTo.pathname == "/") {
                        redirectTo = { pathname: "/admin" };
                    }

                    this.setState({redirectTo});
                })
            }
        })
        .catch(error => {
            this.setState({loginError: "Wrong user or password. Please try again"})
        })

        e.preventDefault();
    }

    closeError(e) {
        this.setState({loginError: false});
        e.preventDefault();
    }

    render(){
        if (this.state.redirectTo) {
            return (<Redirect to={this.state.redirectTo} />);
        }

        return(
            <div className="ui middle aligned center aligned grid" style={{marginTop: 50 + 'px'}}>
                <div className="column" style={{maxWidth: 450 + 'px'}}>
                    <h2 className="ui header">Jobbar Login</h2>
                    <form className="ui large form">
                        <div className="ui stacked segment">
                            {this.state.loginError !== false &&
                                <div className="ui negative message">
                                    <i className="close icon" onClick={this.closeError}></i>
                                    <div className="header">Error</div>
                                    <p>{this.state.loginError}</p>
                                </div>
                            }
                            <div className="field">
                                <div className="ui left icon input">
                                    <i className="user icon"></i>
                                    <input type="text" name="name" placeholder="Username" onChange={this.handleChangeInput} />
                                </div>
                            </div>
                            <div className="field">
                                <div className="ui left icon input">
                                    <i className="lock icon"></i>
                                    <input type="password" name="password" placeholder="Password" required onChange={this.handleChangeInput} />
                                </div>
                            </div>
                                <button className="ui button primary" type="submit" onClick={this.handleSubmitForm}>Login</button>
                        </div>

                    </form>
                </div>
            </div>
        );
  }
}

export default PageLogin;