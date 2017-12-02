import React, {Component} from 'react';
import {observer} from 'mobx-react';
import autoBind from 'react-autobind';
import MainStore from 'stores/MainStore';
import _ from 'lodash';
import numbro from 'numbro';
import moment from 'moment';
import { Dialog, Button, Intent, ProgressBar } from '@blueprintjs/core';

import AddTransaction from '../Holdings/AddTransaction'

class ManageTransactions extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {

        }
    }

    removeTransaction(id) {
        MainStore.removeTransaction(id);
        const {transactions} = MainStore.toJS();
        if (!_.size(transactions)) MainStore.toggleManageTransactions()
    }

    render() {
        const {manageTransactionsOpen, transactions, coinlist} = MainStore.toJS();
        return (
            <Dialog
                style={{width: '90vw', height: '60vh'}}
                isOpen={manageTransactionsOpen}
                onClose={MainStore.toggleManageTransactions}
                title="Manage Transactions"
                iconName="exchange"
            >
                <div className="pt-dialog-body">
                    <table className="pt-table pt-striped pt-bordered pt-interactive" style={{width: '100%'}}>
                        <thead>
                            <tr>
                                <th>Buy/Sell</th>
                                <th>Asset</th>
                                <th>Units</th>
                                <th>Price</th>
                                <th>Date (YYYY-MM-DD)</th>
                                <th>Remove</th>
                            </tr>
                        </thead>

                        <tbody>
                            {_.map(transactions, t => {
                                const coin = coinlist ? (coinlist[t.coinSym] ? coinlist[t.coinSym] : null) : null;
                                const date = moment(new Date(t.date))
                                return (
                                    <tr key={t.id}>
                                        <td>{t.bought ? "Bought" : "Sold"}</td>
                                        <td>{coin ? coin.FullName : <ProgressBar />}</td>
                                        <td>{numbro(t.coinQ).format('0,0.0000')}</td>
                                        <td>{numbro(t.coinP).format('0,0.00')} {t.currency}</td>
                                        <td>{date.format('YYYY-MM-DD')}</td>
                                        <td><Button className="pt-intent-danger pt-minimal pt-fill" text="remove" onClick={() => this.removeTransaction(t.id)} /></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="pt-dialog-footer">
                    <div className="pt-dialog-footer-actions">
                        <Button
                            intent={Intent.PRIMARY}
                            onClick={MainStore.toggleManageTransactions}
                            text="Done"
                        />
                    </div>
                </div>
            </Dialog>
        )
    }
}

export default observer(ManageTransactions)