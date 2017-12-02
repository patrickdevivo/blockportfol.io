import React, {Component} from 'react';
import {observer} from 'mobx-react';
import MainStore from 'stores/MainStore';
import _ from 'lodash';
import moment from 'moment';
import './styles.css';
import numbro from 'numbro';
import {CURRENCIES} from 'helpers/constants'
import {Callout, Intent, NonIdealState, Tag, ProgressBar, Spinner, Button, Tooltip, Position} from '@blueprintjs/core';

import AddTransaction from './AddTransaction';

class Holdings extends Component {
    render() {
        const {selectedCurrency, transactions, coinlist, priceCache, loadingTransactions} = MainStore.toJS();
        const {holdings, unrealized, totalUnrealized, totalCurrentHoldings} = MainStore;
        const totalUnrealizedPositive = !_.isNull(totalUnrealized) ? totalUnrealized.percent >= 0 : null;
        const totalUnrealizedZero = (!_.isNull(totalUnrealizedPositive) && totalUnrealizedPositive) ? (totalUnrealized.percent === 0) : null;

        // console.log(holdings, unrealized, totalUnrealized, totalCurrentHoldings)

        if (_.isNull(coinlist) || loadingTransactions) return <div className="pt-card"><NonIdealState visual={<Spinner />} title="Loading from Blockstack" /></div>

        return (
            <div id="holdings" className="grid">
                <div className="col-12">
                    <div className="pt-card">
                        <div className="grid">
                            <div className="col-6">
                                <h3>Current Holdings {_.size(transactions) ? <Button className="pt-minimal pt-intent-primary" text={`edit ${_.size(transactions)} transaction${_.size(transactions) > 1 ? 's' : ''}`} onClick={MainStore.toggleManageTransactions} /> : null}</h3>
                            </div>

                            <div className="col-2">
                                    <Callout intent={Intent.PRIMARY} iconName={"bank-account"} style={{textAlign: 'right'}}>
                                        <Tooltip content={"Total current value of cryptos held"} position={Position.BOTTOM}>
                                            {!_.isNull(totalCurrentHoldings) ? <h5 style={{margin: 0}}>{`${numbro(totalCurrentHoldings).format('0,0.00')} ${selectedCurrency}`}</h5> : <Spinner className="pt-small" />}
                                        </Tooltip>
                                    </Callout>
                            </div>
                            <div className="col-2">
                                <Callout intent={(totalUnrealized && totalUnrealized.percent) ? (totalUnrealized.percent > 0 ? Intent.SUCCESS : Intent.DANGER) : Intent.DEFAULT} iconName={totalUnrealizedPositive ? (totalUnrealizedZero ? "chevron-right" : "chevron-up") : "chevron-down"} style={{textAlign: 'right'}}>
                                    <Tooltip content={"Total unrealized value of cryptos held"} position={Position.BOTTOM}>
                                        {totalUnrealized ? <h5 style={{margin: 0}}>{`${numbro(totalUnrealized.value).format('0,0.00')} ${selectedCurrency}`}</h5> : <Spinner className="pt-small" />}
                                    </Tooltip>
                                </Callout>
                            </div>
                            <div className="col-2">
                                <Callout intent={(totalUnrealized && totalUnrealized.percent) ? (totalUnrealized.percent > 0 ? Intent.SUCCESS : Intent.DANGER) : Intent.DEFAULT} iconName={totalUnrealizedPositive ? (totalUnrealizedZero ? "chevron-right" : "chevron-up") : "chevron-down"} style={{textAlign: 'right'}}>
                                    <Tooltip content={"Total percentage gain of cryptos held"} position={Position.BOTTOM_RIGHT}>
                                        {totalUnrealized ? <h5 style={{margin: 0}}>{numbro(totalUnrealized.percent).format('0,0.00%')}</h5> : <Spinner className="pt-small" />}
                                    </Tooltip>
                                </Callout>
                            </div>

                            <div className="col-12" style={{margin: '40px 0'}}>
                                {(_.isEmpty(transactions)) ?
                                    <NonIdealState visual="bank-account" title="No Transactions" description="Add transactions to see an overall summary of your current holdings and asset performance"/>
                                    :
                                    _.isEmpty(holdings.byCoin) ?
                                    <NonIdealState visual="minus" title="No Holdings" description=""/>
                                    :
                                    <table className="pt-table pt-striped pt-bordered" style={{width: '100%'}}>
                                        <thead>
                                            <tr>
                                                <th>Asset</th>
                                                <th>Net Units</th>
                                                <th>Avg. Purch. Price</th>
                                                <th>Current Price</th>
                                                <th>Currently Held</th>
                                                <th>Gain (Unrealized)</th>
                                                <th>% Gain (Unrealized)</th>
                                                <th>% of Holdings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {_.map(holdings.byCoin, (h, sym) => {
                                                const unr = unrealized ? unrealized[sym] : null;
                                                const currentPrice = (priceCache && priceCache[sym]) ? (priceCache[sym]) : null;
                                                const coin = coinlist[sym] ? coinlist[sym] : null;
                                                const currentlyHeld = (currentPrice) ? (currentPrice[selectedCurrency] * h.q) : null
                                                const percent = (currentPrice) ? (currentPrice[selectedCurrency] * h.q) / (totalCurrentHoldings) : null

                                                return (
                                                    <tr key={sym}>
                                                        <td>{coin ? coin.FullName : null} <Tag>{sym}</Tag></td>
                                                        <td>{numbro(h.q).format('0,0.00000')}</td>
                                                        <td>{`${numbro(h.avgPrice).format('0,0.00')} ${selectedCurrency}`}</td>
                                                        <td>{!_.isNull(currentPrice) ? `${numbro(currentPrice[selectedCurrency]).format('0,0.00')} ${selectedCurrency}` : <ProgressBar />}</td>
                                                        <td>{!_.isNull(currentlyHeld) ? `${numbro(currentlyHeld).format('0,0.00')} ${selectedCurrency}` : <ProgressBar />}</td>
                                                        <td>{(unr) ? `${numbro(unr.value).format('0,0.00')} ${selectedCurrency}` : <ProgressBar />}</td>
                                                        <td>{(unr) ? numbro(unr.percent).format('0,0.00%') : <ProgressBar />}</td>
                                                        <td><ProgressBar className="pt-no-animation pt-intent-primary pt-no-stripes" value={percent} /></td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                }
                            </div>
                            

                            <AddTransaction />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default observer(Holdings);