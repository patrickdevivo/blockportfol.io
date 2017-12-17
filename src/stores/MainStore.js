import {extendObservable, action, computed, observe, observable, toJS} from 'mobx';
import _ from 'lodash';
import axios from 'axios';
import qs from 'qs';
import shortid from 'shortid';
import * as blockstack from 'blockstack';
import {CURRENCIES, CRYPTOS} from 'helpers/constants';
import moment from 'moment';

// window.blockstack = require('blockstack');

const CRYPTO_COMPARE_BASE = 'https://min-api.cryptocompare.com/data'

class MainStore {
    constructor() {
        extendObservable(this, {
            selectedCurrency: 'USD',
            coinlist: null,
            user: null,
            transactions: [],
            priceCache: observable.map(),
            historyCache: {},

            holdings: computed(this.holdings),
            totalCurrentHoldings: computed(this.totalCurrentHoldings),
            unrealized: computed(this.unrealized),
            totalUnrealized: computed(this.totalUnrealized),
            realizedFIFO: computed(this.realizedFIFO),
            realizedLIFO: computed(this.realizedLIFO),
            totalRealizedFIFO: computed(this.totalRealizedFIFO),
            totalRealizedLIFO: computed(this.totalRealizedLIFO),
            filteredTransactions: computed(this.filteredTransactions),
            cryptosTransacted: computed(this.cryptosTransacted),

            coinInfo: false,

            lifo: false,
            manageTransactionsOpen: false,
            loadingTransactions: false
        });

        this.setCoins();
        this.auth();
        this.loadTransactions();

        this.holdingsObserver = observe(this, 'holdings', async ({newValue}) => {
            if (newValue) {
                const heldCurrencies = _.keys(newValue.byCoin);
                const prices = await this.setPriceCache(heldCurrencies);
            }
        });

        if (window.location.protocol === 'https:') window.location.protocol = 'http:'

        // setInterval(() => this.updatePriceCache(), 20*1000);
    }

    async setPriceCache(symbols) {
        const req = await axios.get(`${CRYPTO_COMPARE_BASE}/pricemulti`, {
            params: {
                fsyms: _.join(symbols, ','),
                tsyms: _.join(CURRENCIES, ',')
            }
        })
        this.priceCache.merge(req.data);
    }

    async updatePriceCache() {
        const heldCurrencies = _.keys(this.holdings.byCoin);
        await this.setPriceCache(heldCurrencies);
        await this.updateHistoricalCache();
    }

    async updateHistoricalCache() {
        const symbols = this.cryptosTransacted;
        for (const s in symbols) {
            const sym = symbols[s];
            if (this.historyCache[sym]) continue;
            const history = await this.fetchHistoDay(sym, 2000);
            const priceData = _.zipObject(_.map(history.Data, p => moment(new Date(p.time*1000)).format('YYYY-MM-DD')), history.Data)
            this.historyCache[sym] = priceData;
        }
    }

    auth = action(async () => {
        if (blockstack.isSignInPending()) {
            await blockstack.handlePendingSignIn();
        }

        if (blockstack.isUserSignedIn()) {
            const user = blockstack.loadUserData();
            this.user = user;   
        }
        else {
            this.user = null;
        }
    })

    loginWithBlockStack() {
        const dev = process.env.NODE_ENV === 'development';
        if (dev) {
            blockstack.redirectToSignIn(`${window.location.origin}/`, `http://localhost:5000/manifest.json`);
        } else {
            blockstack.redirectToSignIn();
        }
    }

    logoutWithBlockstack = action(() => {
        blockstack.signUserOut();
        // window.location.reload()
        this.transactions = []
        this.user = null;
    })

    selectCurrency = action((currency) => {
        if (!_.includes(CURRENCIES, currency)) throw new Error(`Unsupported Currency ${currency}`);
        this.selectedCurrency = currency;
    })

    async fetchCryptoPrices(crypto) {
        const priceReq = await axios.get(`${CRYPTO_COMPARE_BASE}/price?fsym=${crypto}&tsyms=${_.join(CURRENCIES, ',')}`)
        return priceReq.data;
    }

    async fetchCoins() {
        const coinsReq = await axios.get(`${CRYPTO_COMPARE_BASE}/all/coinlist`);
        return coinsReq.data;
    }

    async fetchHistoDay(fsym, days) {
        const req = await axios.get(`${CRYPTO_COMPARE_BASE}/histoday?fsym=${fsym}&tsym=${this.selectedCurrency}&limit=${days}`);
        return req.data;
    } 

    setCoins = action(async () => {
        const coinlist = await this.fetchCoins();
        this.coinlist = coinlist.Data;
    })

    toggleManageTransactions = action(() => {
        this.manageTransactionsOpen = !this.manageTransactionsOpen;
    })

    setLoadingTransactions = action(status => {
        this.loadingTransactions = status;
    })

    setLifo = action(lifo => {
        this.lifo = !!lifo;
    })

    async loadTransactions() {
        this.setLoadingTransactions(true);
        if (!blockstack.isUserSignedIn()) {
            this.setLoadingTransactions(false);
            return;
        }
        const s = await blockstack.getFile('blockportfolio/encryptedTransactions.json', true);
        const t = JSON.parse(s, (k, v) => (typeof v === 'string' && (!isNaN(Date.parse(v))) ? new Date(v) : v));
        if (_.isArray(t)) this.transactions = t;
        console.log(t)
        this.setLoadingTransactions(false);
    }

    async saveTransactions() {
        if (!blockstack.isUserSignedIn()) return;
        const transactions = this.transactions;
        const s = JSON.stringify(transactions);
        console.log(s)
        await blockstack.putFile('blockportfolio/encryptedTransactions.json', s, true);
    }

    addTransaction = action((bought, coinQ, coinSym, coinP, currency, date) => {
        const transaction = {id: shortid.generate(), bought, coinQ, coinSym, coinP, currency, date};
        this.transactions.push(transaction);
        this.saveTransactions();
    })

    removeTransaction = action((id) => {
        _.remove(this.transactions, t => t.id === id);
        this.saveTransactions();
    })

    cryptosTransacted() {
        return _.uniq(_.map(this.transactions, t => t.coinSym))
    }

    filteredTransactions() {
        // filters transactions based on selected fiat and date range, all transactions up to end date
        const {selectedCurrency, selectedDateRange} = this;
        const startDate = _.isNull(selectedDateRange) ? -Infinity : new Date(selectedDateRange[0]);
        const endDate = _.isNull(selectedDateRange) ? Infinity : new Date(selectedDateRange[1]);
        return _.filter(this.transactions,
            t => t.currency === selectedCurrency
            // && t.date >= startDate
            && t.date <= endDate
        );
    }

    transactionsAsOf(asOf) {
        if (!asOf) asOf = new Date();
        const {selectedCurrency} = this;
        return computed(() => {
            // filters transactions based on selected fiat and date range, all transactions up to end date
            return _.filter(this.transactions,
                t => t.currency === selectedCurrency
                && t.date <= asOf
            );
        }).get()
    }

    holdingsAsOf(asOf) {
        if (!asOf) asOf = new Date();
        return computed(() => {
            const transactions = _.filter(this.transactions, t => t.currency === this.selectedCurrency && t.date <= asOf);
            // const transactions = this.filteredTransactions;
            const currentCurrencyTransactions = _.filter(transactions, t => t.currency === this.selectedCurrency)
            const holdings = _.groupBy(currentCurrencyTransactions, t => t.coinSym);
            return {
                byCoin: _.mapValues(holdings, (transactions, sym) => {
                    const q = _.reduce(transactions, (sum, t) => sum += t.bought ? t.coinQ : -t.coinQ, 0);
                    const buys = _.filter(transactions, t => t.bought);
                    const buysQ = _.sum(_.map(buys, b => b.coinQ));
                    const avgPrice = _.sum(_.map(buys, b => b.coinP * b.coinQ/buysQ));
                    return {q, avgPrice}
                }),
                total: {
                    p: _.reduce(currentCurrencyTransactions, (sum, t) => sum += t.bought ? t.coinQ*t.coinP : -t.coinQ*t.coinP, 0)
                }
            }
        }).get()
    }

    holdings() {
        return this.holdingsAsOf(new Date())
    }

    totalCurrentHoldings() {
        const {holdings, priceCache, selectedCurrency} = this;
        let sum = 0;
        for (const sym in holdings.byCoin) {
            const h = holdings.byCoin[sym];
            const price = priceCache.get(sym);
            if (!price) return null;
            sum += h.q * price[selectedCurrency];
        }
        return sum;
    }

    unrealizedAsOf(asOf) {
        if (!asOf) asOf = new Date();
        return computed(() => {
            const holdings = this.holdingsAsOf(asOf);
            const {selectedCurrency, priceCache} = this;
            return _.mapValues(holdings.byCoin, (h, sym) => {
                const prices = priceCache.get(sym);
                if (!prices) return null;
                if (!prices[selectedCurrency]) return null;
                return {
                    value: (prices[selectedCurrency]) * h.q - (h.avgPrice * h.q),
                    percent: h.q ? ((prices[selectedCurrency]) * h.q - (h.avgPrice * h.q)) / (h.avgPrice * h.q) : 0
                }
            })
        }).get()
    }

    unrealized() {
        return this.unrealizedAsOf(new Date())
    }

    totalUnrealizedAsOf(asOf) {
        if (!asOf) asOf = new Date();
        const holdings = this.holdingsAsOf(asOf);
        return computed(() => {
            let totalV = 0;
            let totalB = 0;
    
            for (const sym in holdings.byCoin) {
                const prices = this.priceCache.get(sym);
                if (!prices) return null;
                const h = holdings.byCoin[sym];
                totalV += (prices[this.selectedCurrency]) * h.q
                totalB += (h.avgPrice * h.q)
            }
    
            return {
                value: totalV-totalB,
                percent: totalB ? (totalV-totalB)/totalB : 0
            }
        }).get()
    }

    totalUnrealized() {
        return this.totalUnrealizedAsOf(new Date())
    }

    realizedAsOf(lifo, asOf) {
        if (!asOf) asOf = new Date();
        lifo = !!lifo // cast to boolean
        const transactions = this.transactionsAsOf(asOf);
        const holdings = this.holdingsAsOf(asOf);
        
        return computed(() => {
            return _.mapValues(holdings.byCoin, (h, sym) => {
                const buys = _.filter(transactions, t => t.bought && sym === t.coinSym);
                const sells = _.filter(transactions, t => !t.bought && sym === t.coinSym);
                const proceeds = _.reduce(sells, (p, s) => p += s.coinQ*s.coinP, 0);
                const soldUnits = _.reduce(sells, (u, s) => u += s.coinQ, 0);
                let costBase = 0;
                let units = 0;
                const sortedBuys = _.orderBy(buys, ['date'], [lifo ? 'desc' : 'asc']);
                for (const i in sortedBuys) {
                    const b = sortedBuys[i];
                    if (units + b.coinQ < soldUnits){
                        units += b.coinQ;
                        costBase += b.coinQ * b.coinP;
                    }
                    else {
                        const remaining = soldUnits - units;
                        costBase += remaining * b.coinP;
                        units += remaining;
                    }
                }
                return {
                    value: proceeds - costBase,
                    percent: costBase ? (proceeds - costBase)/costBase : 0
                };
            })
        }).get()
    }

    totalRealizedAsOf(lifo, asOf) {
        const byCoin = this.realizedAsOf(lifo, asOf);
        return computed(() => {
            let totalV = 0;
            let percSum = 0;
            for (const sym in byCoin) {
                const r = byCoin[sym];
                totalV += r.value
                percSum += r.value * r.percent;
            }
            return {
                value: totalV,
                percent: totalV ? (percSum / totalV) : 0
            }
        }).get()
    }

    realizedFIFO() {
        return this.realizedAsOf(false, new Date())
    }

    realizedLIFO() {
        return this.realizedAsOf(true, new Date())
    }

    totalRealizedFIFO() {
        return this.totalRealizedAsOf(false, new Date())
    }

    totalRealizedLIFO() {
        return this.totalRealizedAsOf(true, new Date())
    }

    performance(startDate, endDate) {
        return computed(() => {
            let c = this.selectedCurrency;
            let dt = moment(startDate);
            let data = [];
            while (dt < endDate) {
                dt.add(1, 'days');
                if (dt.diff(moment(), 'days') === 0) continue;
                let d = {day: dt.format('YYYY-MM-DD')};
                const holdings = this.holdingsAsOf(dt.toDate())
                // console.log(holdings)
                let total = 0;
                for (const sym in holdings.byCoin) {
                    const h = holdings.byCoin[sym];
                    const history = this.historyCache[sym];
                    if (!history) continue;
                    const p = history[dt.format('YYYY-MM-DD')];
                    if (!p) continue;
                    d[sym] = h.q * p.close;
                    total += h.q * p.close;
                }
                d.total = total;
                data.push(d)
            }
            return data;
        }).get()
    }

    setCoinInfo(sym) {
        this.coinInfo = sym;
    }
   
    toJS() {
		return toJS(this);
	}
}

export default new MainStore();