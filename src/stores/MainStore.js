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
            selectedCrypto: 'BTC',
            selectedDateRange: null,
            coinlist: null,
            user: null,
            transactions: [],
            priceCache: observable.map(),

            holdings: computed(this.holdings),
            unrealized: computed(this.unrealized),
            totalUnrealized: computed(this.totalUnrealized),
            realizedFIFO: computed(this.realizedFIFO),
            printSelectedDateRange: computed(this.printSelectedDateRange),
            filteredTransactions: computed(this.filteredTransactions),

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
        })
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
        this.transactions = []
        this.user = null;
    })

    selectCurrency = action((currency) => {
        if (!_.includes(CURRENCIES, currency)) throw new Error(`Unsupported Currency ${currency}`);
        this.selectedCurrency = currency;
    })

    selectCrypto = action((crypto) => {
        if (!_.includes(CRYPTOS, crypto)) throw new Error(`Unsupported Crypto ${crypto}`);
        this.selectedCrypto = crypto;
    })

    selectDateRange = action((dr) => {
        // dr -> [start, end]
        this.selectedDateRange = dr;
    })

    printSelectedDateRange() {
        if (_.isNull(this.selectedDateRange)) return null
        return `${moment(this.selectedDateRange[0]).format('YYYY-MM-DD')} to ${moment(this.selectedDateRange[1]).format('YYYY-MM-DD')}`
    }

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
        const s = await blockstack.getFile('/transactions.json');
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
        await blockstack.putFile('/transactions.json', s);
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
            const currentCurrencyTransactions = _.filter(transactions, t => t.currency !== this.selectedCrypto)
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

        return computed(() => {
            const buys = _.filter(transactions, t => t.bought);
            const sells = _.filter(transactions, t => !t.bought);
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
        }).get()
    }

    realizedFIFO() {
        return this.realizedAsOf(false, new Date())
    }

    realizedLIFO() {
        return this.realizedAsOf(true, new Date())
    }
   
    toJS() {
		return toJS(this);
	}
}

export default new MainStore();