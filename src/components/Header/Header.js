import React, {Component} from 'react';
import {observer} from 'mobx-react';
import MainStore from 'stores/MainStore';
import {Button, Tag} from '@blueprintjs/core';
import {CURRENCIES} from 'helpers/constants';
import _ from 'lodash';

import './styles.css';

class Header extends Component {

    render() {
        const {user, selectedCurrency} = MainStore.toJS();
        return (
            <nav className="pt-navbar">
                <div className="pt-navbar-group pt-align-left">
                    <img id="logo" alt="Blockportfol.io" src={require('images/Logo.png')} />
                    <div className="pt-navbar-heading">BlockPortfol.io</div>

                    {user ? <span>Welcome back {user.profile.name ? <Tag className="pt-intent-primary">{user.profile.name}</Tag> : null}</span> : null}
                </div>
                <div className="pt-navbar-group pt-align-right">
                    <div className="pt-select pt-minimal">
                        <select value={selectedCurrency} onChange={e => MainStore.selectCurrency(e.target.value)}>
                            {_.map(CURRENCIES, c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
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