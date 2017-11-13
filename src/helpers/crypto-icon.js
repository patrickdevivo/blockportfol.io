import React from 'react';
import * as CryptoIcon from 'react-cryptocoins';
import _ from 'lodash';

export default function getIcon(crypto) {
    const Icon = CryptoIcon[_.upperFirst(_.toLower(crypto))]
    return <Icon />
}