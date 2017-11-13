import {extendObservable, action, computed, observe, observable, toJS} from 'mobx';
import _ from 'lodash';
import axios from 'axios';
import qs from 'qs';
import shortid from 'shortid';
import * as blockstack from 'blockstack';
import {CURRENCIES, CRYPTOS} from 'helpers/constants';

// window.blockstack = require('blockstack');

const CRYPTO_COMPARE_BASE = 'https://min-api.cryptocompare.com/data'

class MainStore {
    constructor() {
        extendObservable(this, {
            selectedCurrency: 'USD',
            selectedCrypto: 'BTC',
            coinlist: null,
            user: null,
            transactions: [],
            priceCache: observable.map(),

            holdings: computed(this.holdings),
            unrealized: computed(this.unrealized),
            totalUnrealized: computed(this.totalUnrealized)
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

    async fetchCryptoPrices(crypto) {
        const query = {
            fsym: crypto,
            tsyms: _.join(CURRENCIES, ',')
        }
        const priceReq = await axios.get(`${CRYPTO_COMPARE_BASE}/price?fsym=${crypto}&tsyms=${_.join(CURRENCIES, ',')}`)
        return priceReq.data;
    }

    async fetchCoins() {
        const coinsReq = await axios.get(`${CRYPTO_COMPARE_BASE}/all/coinlist`);
        return coinsReq.data;
    }

    setCoins = action(async () => {
        const coinlist = await this.fetchCoins();
        this.coinlist = coinlist.Data;
    })

    async loadTransactions() {
        if (!blockstack.isUserSignedIn()) return;
        const s = await blockstack.getFile('/transactions.json');
        const t = JSON.parse(s);
        if (_.isArray(t)) this.transactions = t;
        console.log(t)
    }

    async saveTransactions() {
        if (!blockstack.isUserSignedIn()) return;
        const transactions = this.transactions;
        const s = JSON.stringify(transactions);
        console.log(s)
        await blockstack.putFile('/transactions.json', s);
    }

    addTransaction(bought, coinQ, coinSym, coinP, currency, date) {
        const transaction = {id: shortid.generate(), bought, coinQ, coinSym, coinP, currency, date};
        this.transactions.push(transaction);
        this.saveTransactions();
    }

    holdings() {
        const currentCurrencyTransactions = _.filter(this.transactions, t => t.currency !== this.selectedCrypto)
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
    }

    unrealized() {
        return _.mapValues(this.holdings.byCoin, (h, sym) => {
            const prices = this.priceCache.get(sym);
            if (!prices) return null;
            return {
                value: (prices[this.selectedCurrency]) * h.q - (h.avgPrice * h.q),
                percent: h.q ? ((prices[this.selectedCurrency]) * h.q - (h.avgPrice * h.q)) / (h.avgPrice * h.q) : 0
            }
        })
    }

    totalUnrealized() {
        const holdings = this.holdings;
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
    }
   
    toJS() {
		return toJS(this);
	}
}

export default new MainStore();