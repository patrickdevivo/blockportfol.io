import _ from 'lodash';

export const CURRENCIES = [
    'USD','EUR','JPY','GBP','CHF','CAD','AUD','NZD','ZAR','CNY'
]

export const CRYPTOS = [
    'BTC','ETH','BCH','ETC','LTC','DASH','XMR', 'ZEC', 'XRP'
]

export const CRYPTO_ICONS = _.reduce(CRYPTOS, (icons, c) => Object.assign(icons, {[c]: require(`images/crypto-icons/${c}.svg`)}), {});