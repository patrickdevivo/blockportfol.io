import React, {Component} from 'react';
import {observer} from 'mobx-react';
import {observe} from 'mobx';
import {Dialog, Button, Intent, NonIdealState, Spinner} from '@blueprintjs/core';
import MainStore from 'stores/MainStore';
import moment from 'moment';
import numbro from 'numbro';
import _ from 'lodash';
import { ResponsiveContainer, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

class CoinInfo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            days: 120,
            data: null,
            volume: false
        }
    }

     componentDidMount() {
         this.observer = observe(MainStore, 'coinInfo', () => {
             this.loadData()
         })
     }

     setDays(days) {
         this.setState({days});
     }

     setVolume(volume) {
         this.setState({volume});
     }

    async loadData() {
        const {coinInfo} = MainStore;
        const prices = await MainStore.fetchHistoDay(coinInfo, 2000);
        // const data = _.zipObject(_.map(prices.Data, p => moment(new Date(p.time*1000)).format('YYYY-MM-DD')), prices.Data);
        const data = _.map(prices.Data, d => ({...d, time: moment(d.time*1000).format('YYYY-MM-DD')}));
        this.setState({data});
    }

    render() {
        const {coinInfo, selectedCurrency} = MainStore;
        const {days, data, volume} = this.state;
        const slicedData = _.slice(data, _.size(data) - days)
        console.log(slicedData)
        return (
            <Dialog
                isOpen={!!coinInfo}
                iconName={'chart'}
                title={coinInfo || 'Coin Info'}
                style={{width: '90%'}}
                onClose={() => MainStore.setCoinInfo(null)}
            >
                    <div className="pt-dialog-body">
                        {_.isNull(coinInfo) ? <NonIdealState visual={<Spinner/>} /> :
                        <div>
                            <div className="pt-button-group" style={{marginBottom: 20}}>
                                <Button active={!volume} text={'Price'} onClick={() => this.setVolume(false)} />
                                <Button active={volume} text={'Volume'} onClick={() => this.setVolume(true)} />
                            </div>

                            <div className="pt-button-group" style={{marginBottom: 20, float: 'right'}}>
                                <Button active={days === 730} text={'2y'} onClick={() => this.setDays(730)} />
                                <Button active={days === 365} text={'1y'} onClick={() => this.setDays(365)} />
                                <Button active={days === 120} text={'6m'} onClick={() => this.setDays(120)} />
                                <Button active={days === 90} text={'90d'} onClick={() => this.setDays(90)} />
                                <Button active={days === 60} text={'60d'} onClick={() => this.setDays(60)} />
                                <Button active={days === 30} text={'30d'} onClick={() => this.setDays(30)} />
                                <Button active={days === 10} text={'10d'} onClick={() => this.setDays(10)} />
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={slicedData}>
                                        {volume ?
                                            [
                                                <Area type="monotone" key="volumeto" dataKey={'volumeto'} stroke="#0E5A8A" fill="#106BA3" isAnimationActive={false} />,
                                                <Area type="monotone" key="volumefrom" dataKey={'volumefrom'} stroke="#0E5A8A" fill="#106BA3" isAnimationActive={false} />,
                                            ]
                                            :
                                            [
                                                <Area type="monotone" key="close" dataKey={'close'} stroke="#0E5A8A" fill="#106BA3" isAnimationActive={false} />,
                                                <Area type="monotone" key="open" dataKey={'open'} stroke="#5C255C" fill="#752F75" isAnimationActive={false} />,
                                                <Area type="monotone" key="high" dataKey={'high'} stroke="#0A6640" fill="#0D8050" isAnimationActive={false} />,
                                                <Area type="monotone" key="low" dataKey={'low'} stroke="#A82A2A" fill="#C23030" isAnimationActive={false} />
                                            ]
                                        }

                                    <XAxis dataKey="time" />
                                    <YAxis allowDecimals={false} tickFormatter={t => `${numbro(t).format('0a.00')} ${selectedCurrency}`} />
                                    <Tooltip formatter={(v) => `${numbro(v).format('0,0')} ${selectedCurrency}`} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        }
                    </div>
                    <div className="pt-dialog-footer">
                        <div className="pt-dialog-footer-actions">
                            <Button
                                intent={Intent.PRIMARY}
                                onClick={() => MainStore.setCoinInfo(null)}
                                text="Close"
                            />
                        </div>
                    </div>
            </Dialog>
        )
    }
}

export default observer(CoinInfo);