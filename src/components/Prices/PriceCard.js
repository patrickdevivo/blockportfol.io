import React, {Component} from 'react';
import _ from 'lodash';
import {observer} from 'mobx-react';
import {observe} from 'mobx';
import MainStore from 'stores/MainStore';
import numbro from 'numbro';
import moment from 'moment';

import {Button, NonIdealState, Spinner} from '@blueprintjs/core';
import {CRYPTO_ICONS} from 'helpers/constants';
import Isvg from 'react-inlinesvg';
import { ResponsiveContainer, ComposedChart, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

class PriceCard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            historicalPrices: null
        }
    }

    componentDidMount() {
        this.fetchData(this.props.days);
        this.selectedCurrencyObserver = observe(MainStore, 'selectedCurrency', ({oldValue, newValue}) => {
            this.fetchData(this.props.days);
        })
    }

    componentWillUnmount() {
        this.selectedCurrencyObserver();
    }

    componentWillReceiveProps(props) {
        if (props.days !== this.props.days) this.fetchData(props.days);
    }

    async fetchData(days) {
        const {sym} = this.props;
        this.setState({historicalPrices: null})
        const historicalPrices = (await MainStore.fetchHistoDay(sym, days)).Data;
        this.setState({historicalPrices});
    }

    render() {
        const {historicalPrices} = this.state;
        const {price, sym, days} = this.props;
        const {selectedCurrency} = MainStore.toJS();
        const loading = _.isNull(price) || _.isNull(historicalPrices);
        const displayPrice = loading ? null : numbro(price[selectedCurrency]).format('0,0.00')

        if (loading) return (
            <div className="col-4">
                <div className="pt-card pt-elevation-1 price-card">
                    <div className="price-card-body">
                        <h3 className={`pt-skeleton`} style={{marginBottom: 20}}>{sym}</h3>
                        <NonIdealState visual={<Spinner />} title={sym} />
                    </div>
                </div>
            </div>
        )
        
        else return (
            <div className="col-4">
                <div className="pt-card pt-elevation-1 price-card" onClick={() => MainStore.setCoinInfo(sym)}>
                    <div className="price-card-body">
                        <Isvg className="crypto-icon" src={CRYPTO_ICONS[sym]} />
                        <h3>
                            <span className="pt-text-muted" style={{color: '#137CBD'}}>{sym}</span>: {displayPrice} {selectedCurrency}
                        </h3>
                    </div>

                    <div>
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={historicalPrices} margin={{top: 0, right: 0, bottom: 0, left: 0}} syncId="price-cards">
                                <Tooltip
                                    content={(d) => {
                                        const data = historicalPrices[d.label];
                                        return (
                                            <div className="pt-card" style={{padding: 10}}>
                                                <span>
                                                {data ? moment(new Date(data.time * 1000)).format('YYYY-MM-DD') : ''}<br />
                                                {data ? data.close : ''} {selectedCurrency}
                                                </span>
                                            </div>
                                        )
                                    }}
                                />
                                <Area type="monotone" dataKey="close" stroke="#0E5A8A" fill="#106BA3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )
    }
}

export default observer(PriceCard);