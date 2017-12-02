import React, {Component} from 'react';
import {observer} from 'mobx-react';
import autoBind from 'react-autobind';
import _ from 'lodash';
import moment from 'moment';
import numbro from 'numbro';
import MainStore from 'stores/MainStore';
import {observe} from 'mobx';
import { ResponsiveContainer, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {stringToColor} from 'helpers/colors';
import { NonIdealState, Spinner } from '@blueprintjs/core';
import Color from 'color';


class PerfChart extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {
            data: null
        }
    }

    componentDidMount() {
        MainStore.updateHistoricalCache().then(this.getData);
        const update = async () => {
            await MainStore.updateHistoricalCache();
            this.getData();
        }
        this.transactionsObserserver = observe(MainStore.transactions, update)
        this.currencyObserver = observe(MainStore, 'selectedCurrency', update)
    }

    componentWillUnmount() {
        this.transactionsObserserver();
    }

    getData() {
        let {dateRange} = this.props;
        const startDate = dateRange[0];
        const endDate = dateRange[1];
        const data = MainStore.performance(startDate, endDate)
        console.log(data)
        this.setState({data})
    }

    componentDidUpdate(prevProps) {
        if (!_.isEqual(prevProps.dateRange, this.props.dateRange)) this.getData();
    }


    render() {
        const {data} = this.state;
        const {selectedCurrency} = MainStore.toJS();
        const {cryptosTransacted} = MainStore;

        if (_.isNull(data)) return <NonIdealState visual={<Spinner />} />

        return (
            <div>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data} margin={{top: 0, right: 0, bottom: 0, left: 0}}>
                        <Area type="monotone" dataKey="total" stroke="#0E5A8A" fill="#106BA3" isAnimationActive={false} />
                        {_.map(cryptosTransacted, sym => <Area key={sym} type="monotone" dataKey={sym} stroke={(Color(stringToColor(sym))).darken(.5).string()} fill={stringToColor(sym)} isAnimationActive={false} />)}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} tickFormatter={t => `${numbro(t).format('0a.00')} ${selectedCurrency}`} />
                        <Tooltip formatter={(v) => `${numbro(v).format('0,0')} ${selectedCurrency}`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }
}

export default observer(PerfChart)