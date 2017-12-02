import _ from 'lodash';
import { Colors } from "@blueprintjs/core";

function hashCode(str) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

const stringToColor = (str) => {
    const hash = hashCode(str);
    const ci = hash % _.size(Colors) - 1;
    return _.values(Colors)[ci]
}

export {
    stringToColor
}