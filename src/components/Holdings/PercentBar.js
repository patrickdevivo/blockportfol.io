import React, {Component} from 'react';
import {observer} from 'mobx-react';
import {observe} from 'mobx';
import autoBind from 'react-autobind';
import Chart from "frappe-charts/dist/frappe-charts.min.esm";
import 'frappe-charts/dist/frappe-charts.min.css';
import MainStore from 'stores/MainStore';
import _ from 'lodash';

class PercentBar extends Component {
    constructor(props) {
        super(props)
        autoBind(this)
    }

    componentDidMount() {
        this.dataObserver = observe(MainStore, 'unrealized', ({newValue, oldValue}) => {
            if (!newValue) return;
            const {unrealized} = MainStore;
            // console.log([{values: _.map(unrealized, v => v ? v.value : 0)}], _.keys(unrealized))
            console.log(this.chart)
            // this.chart.update_values([{values: _.map(unrealized, v => v ? v.value : 0)}], _.keys(unrealized))
        })

        this.chart = new Chart({
            parent: '#percentage-bar',
            data: {labels: [], datasets: []},
            type: "percentage",
            height: 50,
            colors: ['#7cd6fd', 'violet', 'blue'],
        })
    }

    componentWillUnMount() {
        this.dataObserver();
    }

    render() {
        return (
            <div style={{width: '100%'}}>
                <div id="percentage-bar">

                </div>
            </div>
        )
    }
}

export default observer(PercentBar);
