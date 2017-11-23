import React, {Component} from 'react';
import autoBind from 'react-autobind';
import {observer} from 'mobx-react';
import {observe} from 'mobx';
import MainStore from 'stores/MainStore';
import _ from 'lodash';
import {MenuItem, Classes, Button} from '@blueprintjs/core';
import {Select as S} from '@blueprintjs/labs';

import './styles.css';

const Select = S.ofType();

class CoinSelector extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {
            selectedCoin: null
        }
    }

    componentDidMount() {
        if (MainStore.coinlist && MainStore.coinlist.BTC) {
            this.setState({selectedCoin: MainStore.coinlist.BTC})
            this.props.onSelected(MainStore.coinlist.BTC)
        }
        this.coinlistObserver = observe(MainStore, 'coinlist', ({newValue, oldValue}) => {
            if (_.isNull(oldValue) && newValue) {
                this.setState({selectedCoin: newValue.BTC})
                this.props.onSelected(newValue.BTC)
            }
        })
    }

    componentWillUnmount() {
        this.coinlistObserver();
    }

    render() {
        const {onSelected} = this.props;
        const {selectedCoin} = this.state;
        const {coinlist} = MainStore.toJS();
        const coins = _.isNull(coinlist) ? [] : _.map(_.values(coinlist), c => _.pick(c, ['Id', 'FullName', 'Symbol', 'Name']));
        return (
            <Select
                popoverProps={{popoverClassName: "asset-select-popup"}}
                items={coins}
                itemRenderer={({handleClick, isActive, item}) =>
                    <MenuItem
                        className={`${isActive ? `pt-intent-primary ${Classes.ACTIVE}` : ''}`}
                        key={item.Id}
                        text={item.FullName}
                        label={item.Symbol}
                        onClick={handleClick}
                    />
                }
                onItemSelect={(selected) => {
                    this.setState({selectedCoin: selected});
                    onSelected(selected);
                }}
                itemPredicate={(query, item, index) => {
                    return `${item.Symbol} ${item.Name} ${item.Id}`.toLowerCase().indexOf(query.toLowerCase()) >= 0;
                }}
                noResults={<MenuItem disabled text="No results." />}
            >
                <Button
                    className="pt-minimal"
                    text={_.isNull(selectedCoin) ? '...' : selectedCoin.Symbol}
                    disabled={_.isNull(coinlist)}
                    loading={_.isNull(coinlist)}
                    rightIconName="double-caret-vertical"
                />
            </Select>
        )
    }
}

export default observer(CoinSelector);