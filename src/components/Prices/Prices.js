import React, {Component} from 'react';
import {observer} from 'mobx-react';
import _ from 'lodash';
import autoBind from 'react-autobind';
import MainStore from 'stores/MainStore';

import {CRYPTOS, CRYPTO_ICONS} from 'helpers/constants';
import Isvg from 'react-inlinesvg'

import PriceCard from './PriceCard';

import './styles.css';
import { Button } from '@blueprintjs/core';

class Prices extends Component {
    constructor(props) {
        super(props);
        autoBind(this);

        this.state = {
            prices: _.fromPairs(_.map(CRYPTOS, c => [c, null])),
            days: 90
        }
    }

    componentDidMount() {
        this.fetchPrices();
        this.poll = setInterval(this.fetchPrices, 7*1000)
    }

    componentWillUnmount() {
        clearInterval(this.poll)
    }

    setDays(days) {
        this.setState({days})
    }

    async fetchPrices() {
        const {prices} = this.state;
        for (const sym in prices) {
            MainStore.fetchCryptoPrices(sym).then(price => {
                this.setState({prices: Object.assign(prices, {[sym]:price})});
            });
        }
    }

    render() {
        const {prices, days} = this.state;
        
        return (
            <div id="prices" className="grid">
                <div className="col-12" style={{textAlign: 'right'}}>
                    <div className="pt-button-group">
                        <Button active={days === 365} text={'365d'} onClick={() => this.setDays(365)} />
                        <Button active={days === 90} text={'90d'} onClick={() => this.setDays(90)} />
                        <Button active={days === 60} text={'60d'} onClick={() => this.setDays(60)} />
                        <Button active={days === 30} text={'30d'} onClick={() => this.setDays(30)} />
                        <Button active={days === 10} text={'10d'} onClick={() => this.setDays(10)} />
                    </div>
                </div>
                {_.map(prices, (price, sym) => {
                    return <PriceCard key={sym} sym={sym} price={price} days={days} />
                })}
            </div>
        )
    }
}

export default observer(Prices);