import React, {Component} from 'react';
import {observer} from 'mobx-react';
import MainStore from 'stores/MainStore';

import {Button, Tag} from '@blueprintjs/core';

import './styles.css';

class Header extends Component {

    render() {
        const {user} = MainStore.toJS();

        return (
            <nav className="pt-navbar">
                <div className="pt-navbar-group pt-align-left">
                    <img id="logo" alt="Blockportfol.io" src={require('images/Logo.png')} />
                    <div className="pt-navbar-heading">BlockPortfol.io</div>

                    {user ? <span>Welcome back {user.profile.name ? <Tag className="pt-intent-primary">{user.profile.name}</Tag> : null}</span> : null}
                </div>
                <div className="pt-navbar-group pt-align-right">
                    {user ? 
                        <Button
                            text="Logout"
                            className="pt-minimal"
                            onClick={MainStore.logoutWithBlockstack}
                        />
                    :
                        <Button
                            text="Login w/ Blockstack"
                            className="pt-minimal"
                            onClick={MainStore.loginWithBlockStack}
                        />
                    }
                </div>
            </nav>
        )
    }
}

export default observer(Header);