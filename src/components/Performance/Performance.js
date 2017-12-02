import React, {Component} from 'react';
import {observer} from 'mobx-react';
import autoBind from 'react-autobind';
import MainStore from 'stores/MainStore';
import _ from 'lodash';
import moment from 'moment';
import numbro from 'numbro';
import {CURRENCIES} from 'helpers/constants'

import PerfChart from './PerfChart';

import './styles.css';

import {Callout, Intent, Spinner, Button, Popover, Position, NonIdealState, ProgressBar, Tag} from '@blueprintjs/core';
import {DateRangePicker} from '@blueprintjs/datetime';

class Performance extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {
            dateRange: [moment().subtract(30, 'days').toDate() ,new Date()],
            fifoOrLifo: 'fifo'
        }
    }

    selectDateRange(dateRange) {
        this.setState({dateRange})
    }

    render() {
        const {fifoOrLifo, dateRange} = this.state;
        const {selectedCurrency, coinlist} = MainStore.toJS();
        const {realizedFIFO, realizedLIFO, totalRealizedFIFO, totalRealizedLIFO, loadingTransactions} = MainStore;
        const startDate = dateRange ? moment(dateRange[0]) : null;
        const endDate = dateRange ? moment(dateRange[1]) : null;
        const printDateRange = dateRange ? `${moment(startDate).format('YYYY-MM-DD')} to ${moment(endDate).format('YYYY-MM-DD')}`  : null
        const realized = (fifoOrLifo === 'fifo') ? realizedFIFO : realizedLIFO;
        const totalRealized = (fifoOrLifo === 'fifo') ? totalRealizedFIFO : totalRealizedLIFO;
        if (loadingTransactions) return null
        // console.log(realized, totalRealized)

        return (
            <div id="performance" className="grid">
                <div className="col-12">
                    <div className="pt-card">
                        <div className="grid">
                            <div className="col-3">
                                <h3>Past Perfomance</h3>
                            </div>


                            <div className="col-9" style={{textAlign: 'right'}}>
                                <div className="pt-select pt-minimal">
                                    <select value={fifoOrLifo} onChange={e => this.setState({fifoOrLifo: e.target.value})}>
                                        <option value="fifo">FIFO</option>
                                        <option value="lifo">LIFO</option>
                                    </select>
                                </div>
                                <Popover position={Position.BOTTOM_RIGHT}>
                                    <Button text={dateRange ? printDateRange : "Choose Date Range"} className="pt-minimal" rightIconName="timeline-events" />
                                    <DateRangePicker
                                        value={dateRange}
                                        allowSingleDayRange
                                        onChange={this.selectDateRange}
                                        minDate={moment().subtract(5, 'years').toDate()}
                                        maxDate={new Date()}
                                    />
                                </Popover>
                            </div>

                            <div className="col-12" style={{margin: '40px 0'}}>
                                {_.size(realized) ? <table className="pt-table pt-striped pt-bordered" style={{width: '100%'}}>
                                    <thead>
                                        <tr>
                                            <th>Asset</th>
                                            <th>Realized Gain</th>
                                            <th>Realized Gain (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {_.map(realized, (h, sym) => {
                                            const coin = coinlist[sym] ? coinlist[sym] : null;

                                            return (
                                                <tr key={sym}>
                                                    <td>{coin ? coin.FullName : null} <Tag>{sym}</Tag></td>
                                                    <td>{numbro(h.value).format('0,0.00000')} {selectedCurrency}</td>
                                                    <td>{numbro(h.percent).format('0,0.00%')}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table> : null}
                            </div>

                            <div className="col-12">
                                <PerfChart dateRange={dateRange} />
                            </div>
                            
                            <div className="col-4">
                                
                            </div>

                            <div className="col-4">
                                <Callout intent={(totalRealized && totalRealized.value) ? (totalRealized.value > 0 ? Intent.SUCCESS : Intent.DANGER) : Intent.DEFAULT} iconName={((totalRealized && totalRealized.value)) ? ((totalRealized.value > 0) ? "chevron-up" : "chevron-down") : "chevron-right"} style={{textAlign: 'right'}}>
                                    {totalRealized ? <h5 style={{margin: 0}}>{numbro(totalRealized.value).format('0,0.00')} {selectedCurrency} <span className="pt-text-muted">Total Realized</span></h5> : <Spinner className="pt-small" />}
                                </Callout>
                            </div>

                            <div className="col-4">
                                <Callout intent={(totalRealized && totalRealized.value) ? (totalRealized.value > 0 ? Intent.SUCCESS : Intent.DANGER) : Intent.DEFAULT} iconName={((totalRealized && totalRealized.value)) ? ((totalRealized.value > 0) ? "chevron-up" : "chevron-down") : "chevron-right"} style={{textAlign: 'right'}}>
                                    {totalRealized ? <h5 style={{margin: 0}}>{numbro(totalRealized.percent).format('0,0.00%')} <span className="pt-text-muted">WA % Realized</span></h5> : <Spinner className="pt-small" />}
                                </Callout>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

export default observer(Performance);