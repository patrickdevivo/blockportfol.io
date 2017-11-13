import React, {Component} from 'react';
import {observer} from 'mobx-react';
import _ from 'lodash';
import autoBind from 'react-autobind';
import MainStore from 'stores/MainStore';
import numbro from 'numbro';

import {Button} from '@blueprintjs/core';
import {CRYPTOS, CRYPTO_ICONS} from 'helpers/constants';
import Isvg from 'react-inlinesvg'

import './styles.css';

class Prices extends Component {
    constructor(props) {
        super(props);
        autoBind(this);

        this.state = {
            prices: _.fromPairs(_.map(CRYPTOS, c => [c, null]))
        }
    }

    componentDidMount() {
        this.fetchPrices();
    }

    async fetchPrices() {
        const {prices} = this.state;
        for (const sym in prices) {
            MainStore.fetchCryptoPrices(sym).then(price => {
                this.setState({prices: Object.assign(prices, {[sym]:price})})
            });
        }
        
    }

    render() {
        const {prices} = this.state;
        const {selectedCurrency} = MainStore.toJS();
        return (
            <div id="prices" className="grid">
                {_.map(prices, (price, sym) => {
                    const loading = _.isNull(price);
                    const displayPrice = loading ? null : numbro(price[selectedCurrency]).format('0,0.00')

                    if (loading) return (
                        <div key={sym} className="col-4">
                            <div className="pt-card pt-elevation-1 price-card">
                                <h3 className={`pt-skeleton`}>{sym}</h3>
                            </div>
                        </div>
                    )
                    
                    else return (
                        <div key={sym} className="col-4">
                            <div className="pt-card pt-elevation-1 price-card">
                                <Isvg className="crypto-icon" src={CRYPTO_ICONS[sym]} />
                                <h3>
                                    <span className="pt-text-muted" style={{color: '#137CBD'}}>{sym}</span>: {displayPrice} {selectedCurrency}
                                </h3>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
}

export default observer(Prices);