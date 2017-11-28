import React, {Component} from 'react';
import {observer} from 'mobx-react';
import MainStore from 'stores/MainStore';
import _ from 'lodash';
import moment from 'moment';
import numbro from 'numbro';
import {CURRENCIES} from 'helpers/constants'

import './styles.css';

import {Callout, Intent, Spinner, Button, Popover, Position, NonIdealState, ProgressBar} from '@blueprintjs/core';
import {DateRangePicker} from '@blueprintjs/datetime';

class Performance extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dateRange: null
        }
    }

    render() {
        const {selectedCurrency, selectedDateRange} = MainStore.toJS();
        const {holdings, unrealized, totalUnrealized, realizedFIFO, printSelectedDateRange, loadingTransactions} = MainStore;
        const totalUnrealizedPositive = !_.isNull(totalUnrealized) ? totalUnrealized.percent >= 0 : null;
        const totalUnrealizedZero = (!_.isNull(totalUnrealizedPositive) && totalUnrealizedPositive) ? (totalUnrealized.percent === 0) : null;

        if (loadingTransactions) return null

        return (
            <div id="performance" className="grid">
                <div className="col-12">
                    <div className="pt-card">
                        <div className="grid">
                            <div className="col-3">
                                <h3>Perfomance</h3>
                            </div>


                            <div className="col-9" style={{textAlign: 'right'}}>
                                {/*<Popover position={Position.BOTTOM_RIGHT}>
                                    <Button text={selectedDateRange ? printSelectedDateRange : "Choose Date Range"} className="pt-minimal" rightIconName="timeline-events" />
                                    <DateRangePicker
                                        value={selectedDateRange}
                                        allowSingleDayRange
                                        onChange={MainStore.selectDateRange}
                                    />
                                </Popover>*/}
                            </div>
                            
                            <div className="col-6">

                            </div>

                            <div className="col-3">
                                <Callout intent={(realizedFIFO && realizedFIFO.value) ? (realizedFIFO.value > 0 ? Intent.SUCCESS : Intent.DANGER) : Intent.DEFAULT} iconName={((realizedFIFO && realizedFIFO.value)) ? ((realizedFIFO.value > 0) ? "chevron-up" : "chevron-down") : "chevron-right"} style={{textAlign: 'right'}}>
                                    {realizedFIFO ? <h5 style={{margin: 0}}>{numbro(realizedFIFO.value).format('0,0.00')} {selectedCurrency} <span className="pt-text-muted">Realized</span></h5> : <Spinner className="pt-small" />}
                                </Callout>
                            </div>

                            <div className="col-3">
                                <Callout intent={(realizedFIFO && realizedFIFO.value) ? (realizedFIFO.value > 0 ? Intent.SUCCESS : Intent.DANGER) : Intent.DEFAULT} iconName={((realizedFIFO && realizedFIFO.value)) ? ((realizedFIFO.value > 0) ? "chevron-up" : "chevron-down") : "chevron-right"} style={{textAlign: 'right'}}>
                                    {realizedFIFO ? <h5 style={{margin: 0}}>{numbro(realizedFIFO.percent).format('0,0.00%')} <span className="pt-text-muted">Realized</span></h5> : <Spinner className="pt-small" />}
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