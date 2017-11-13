import React, {Component} from 'react';
import {observer} from 'mobx-react';
import autoBind from 'react-autobind';
import MainStore from 'stores/MainStore';
import CoinSelector from 'components/common/CoinSelector/CoinSelector';
import { DateInput } from "@blueprintjs/datetime";
import {CURRENCIES} from 'helpers/constants';

import _ from 'lodash';

import {Button, InputGroup} from '@blueprintjs/core';

class AddTransaction extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {
            bought: true,
            selectedCoin: null,
            selectedCurrency: 'USD',
            coinQ: '',
            coinP: '',
            date: null
        }
    }

    numericOnly(s) {
        const nonNumericRegex = /[^0-9.]+/g;
        return s.replace(nonNumericRegex, "");
    }

    addTransaction() {
        const {bought, selectedCoin, selectedCurrency, coinQ, coinP, date} = this.state;
        MainStore.addTransaction(bought, parseFloat(coinQ), selectedCoin.Symbol, parseFloat(coinP), selectedCurrency, date);
        this.clear();
    }

    clear() {
        this.setState({
            bought: true,
            coinQ: '',
            coinP: '',
            date: null
        })
    }

    render() {
        const {bought, selectedCoin, selectedCurrency, coinQ, coinP, date} = this.state;

        const disabled = _.isNull(selectedCoin) || _.isNull(selectedCurrency) || !coinQ || !coinP || _.isNull(date);

        return (
            <div className="col-12 add-transaction">
                <div className="grid">
                    <div className="add-input">
                        <div className="pt-button-group">
                            <Button active={bought} text='Bought' onClick={() => this.setState({bought: true})} />
                            <Button active={!bought} text='Sold' onClick={() => this.setState({bought: false})} />
                        </div>
                    </div>
                    <div className="add-input">
                        <InputGroup
                            placeholder={`Coin Quantity`}
                            value={coinQ}
                            onChange={e => this.setState({coinQ: this.numericOnly(e.target.value)})}
                            rightElement={<CoinSelector onSelected={selectedCoin => this.setState({selectedCoin})} />}
                        />
                    </div>
                    <div className="add-input">
                        <InputGroup
                            placeholder={`Price per Coin`}
                            value={coinP}
                            onChange={e => this.setState({coinP: this.numericOnly(e.target.value)})}
                            rightElement={
                                <div className="pt-select pt-minimal">
                                    <select defaultValue={selectedCurrency}>
                                    {_.map(CURRENCIES, c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            }
                        />
                    </div>
                    <div className="add-input">
                        <DateInput
                            value={date}
                            maxDate={new Date()}
                            onChange={date => this.setState({date})}
                        />
                    </div>
                    <div className="add-input" style={{float: 'right'}}>
                        <Button
                            text="Add Transaction"
                            rightIconName="add"
                            className="pt-intent-success pt-minimal"
                            disabled={disabled}
                            onClick={this.addTransaction}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

export default observer(AddTransaction);